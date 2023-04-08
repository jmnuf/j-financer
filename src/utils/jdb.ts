import { exists, BaseDirectory as Dir, writeFile, createDir, readTextFile as readFile } from "@tauri-apps/api/fs";
import Table from "../components/table";
import { UnderscoreToSpace } from "./more-types";

export type BaseModel = Record<string, string | number | string[] | number[]> & { id: string; };
export type BaseData<T extends BaseModel> = Omit<T, "id">

type IterValue<T extends Iterable<unknown>> = T extends Iterable<infer V> ? V : never;

type FilterMapPredicate<T, R> = (value: T, index: number) => R | undefined;

export type CustomIterator<V> = { (): Generator<V, void>; } & {
	to_array(): V[];
	to_array<R>(predicate: FilterMapPredicate<V, R>): R[];
};

export function create_custom_iterator<T extends Iterable<unknown> = Iterable<unknown>, V extends IterValue<T> = IterValue<T>>(data: T): CustomIterator<V>;
export function create_custom_iterator<K extends keyof V, T extends Iterable<unknown> = Iterable<unknown>, V extends IterValue<T> = IterValue<T>>(data: T, key: K): CustomIterator<V[K]>;
export function create_custom_iterator<const K extends keyof V, T extends Iterable<any> = Iterable<any>, V extends IterValue<T> = IterValue<T>>(data: T, key?: K): CustomIterator<V|V[K]> {
	const generator = function* () {
		for (const value of data) {
			if (key == undefined) {
				yield value;
				continue;
			}
			yield value[key];
		}
	}.bind(data) as unknown as CustomIterator<V | V[K]>;
	
	generator.to_array = function <R>(predicate?: FilterMapPredicate<V | V[K], R>) {
		const list: ((V | V[K])[] | R[]) = [];
		let i = 0;
		for (const subdata of data) {
			const value = key == undefined ? subdata : subdata[key];
			if (predicate == null) {
				list.push(value);
				continue;
			}
			const mapped = predicate(value, i);
			i += 1;
			if (mapped === undefined) {
				continue;
			}

			list.push(mapped);
		}
		return list;
	}.bind(data);
	
	return generator;
}

const capitalize = <T extends string>(str: T) => {
	const capital = str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
	return capital as Capitalize<T>;
};

type JMetaData = Record<string, NonNullable<unknown> | string | number | null>;
type DataID<P extends string> = `${P}${number}`;
type SchemaObj<T extends { id: string }> = { parse: (value:unknown) => T, safeParse: (value:unknown) => ({ success: true, data: T } | { success: false, error: { message: string } }) };
type SchemaType<T extends SchemaObj<{ id: string }>> = ReturnType<T["parse"]>;

export class JDB<S extends SchemaObj<any>, const F extends string, const P extends string, T extends SchemaType<S>, M extends JMetaData | undefined = undefined, TBase extends BaseData<T> = BaseData<T>> {
	private file: `jdb/${F}.jdb`;
	private prefix: P;
	private count: number = 0;
	private data = new Map<DataID<P>, T>();
	private _name: Capitalize<F>;
	private _schema: S;

	meta_data: M;

	constructor(name: F, prefix: P, schema: S);
	constructor(name: F, prefix: P, schema: S, meta: M);
	constructor(name: F, prefix: P, schema: S, meta: M = undefined as any) {
		this._schema = schema;
		this._name = name.split("-").map(capitalize).join(" ") as Capitalize<F>;
		this.file = `jdb/${name}.jdb`;
		this.prefix = prefix;
		this.meta_data = meta;
	}

	private create_id(num: number) {
		return `${this.prefix}${`${num}`.padStart(6, "0")}` as DataID<P>;
	}

	clear() {
		this.data.clear();
	}

	insert(data: TBase) {
		const id = this.create_id(this.count + 1);

		try {
			const value:T = this._schema.parse(Object.assign(data, { id }));
			this.data.set(id, value);

			const inserted = this.data.get(id) as T;
			this.count += 1;
			return { ok: true, inserted } as const;
		} catch (e) {
			console.error(e);
			return { ok: false, inserted: null, error: e as Error } as const;
		}
	}

	retrieve(id: number | DataID<P>) {
		const data_id = typeof id == "number" ? this.create_id(id) : id;
		return this.data.get(data_id);
	}

	holds(id: number) {
		const data_id = typeof id == "number" ? this.create_id(id) : id;
		return this.data.has(data_id);
	}

	find_by(key: Exclude<keyof T, "id">, value: T[typeof key]) {
		for (const [id, item] of this.entries()) {
			if (item[key] != value) {
				continue;
			}
			return id;
		}
		return -1
	}

	find_through(predicate: (value: T) => boolean) {
		for (const [id, value] of this.entries()) {
			if (predicate(value)) {
				return id;
			}
		}
		return -1;
	}

	readonly entries = create_custom_iterator(this.data);
	readonly ids = create_custom_iterator(this.data, 0);
	readonly values = create_custom_iterator(this.data, 1);
	
	[Symbol.iterator]() {
		return this.data[Symbol.iterator]()
	}
	
	protected async read_file() {
		try {
			return await readFile(this.file, { dir: Dir.AppData });
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	private _verify_meta_data(): M | null {
		if (!this.meta_data) {
			return null;
		}
		const keys = Object.keys(this.meta_data);
		const data = {} as NonNullable<M>;
		for (const k of keys) {
			const value = this.meta_data[k];
			if (value === undefined) {
				continue;
			}
			data[k] = value;
		}

		return data;
	}

	stringify_meta_data() {
		const meta = this._verify_meta_data();
		if (!meta || Object.keys(meta).length < 1) {
			return "";
		}
		return JSON.stringify(meta);
	}

	async update_external() {
		const meta = this.stringify_meta_data();
		let contents = `@${this.count}${meta.length == 0 ? meta : `;${meta}`}\n`;
		for (const [id, data] of this.data.entries()) {
			contents += `${id};${JSON.stringify(data)}\n`;
		}
		contents = contents.substring(0, contents.length - 1);
		try {
			await writeFile(this.file, contents, { dir: Dir.AppData });
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async update_internal() {
		const contents = await this.read_file();
		if (contents == null) {
			return false;
		}
		
		if (contents.length == 0) {
			if (this.count == 0) return true;
			this.count = 0;
			this.data.clear();
			return true;
		}

		const lines = contents.split("\n");
		const meta = lines.shift()!.split(";").map(v => v.trim());
		this.count = parseInt(meta[0].substring(1));
		if (typeof meta[1] === "string" && meta[1].length > 0) {
			const data = JSON.parse(meta[1]);
			if (!this.meta_data) {
				// @ts-expect-error
				this.meta_data = {};
			}
			for (const k of Object.keys(data)) {
				this.meta_data[k] = data[k];
			}
		}

		for (const line of lines) {
			const [id, data_string] = line.split(";").reduce((s, c, i) => {
				i < 2 ? s[i] = c : s[1] += `;${c}`;
				return s;
			}, [this.prefix, ""]).map(v => v.trim()) as [`${P}${number}`, string];
			const data = JSON.parse(data_string);
			this.data.set(id, data);
		}

		return true;
	}

	create_table<
		H extends UnderscoreToSpace<
				Exclude<keyof T, number | symbol | "id">
			>[]
	>(...headers: H) {
		type DataKey = Exclude<keyof T, number | symbol>;
		type ExtractKeys<T, K extends any> = {
			[Key in Extract<keyof T, K>]: T[Key];
		};
		type ArrayT<T extends any[]> = T extends (infer A)[] ? A : never;
		const table = new Table<
			// @ts-expect-error
			ExtractKeys<T, "id" | SpaceToUnderscore<ArrayT<H>>>,
			["ID", ...H]
		>(this._name, "ID", ...headers);
		const keys = ["id", ...headers.map(v => v.replace(" ", "_").toLowerCase() as DataKey)] as ("id" & DataKey)[];

		for (const data of this.values()) {
			const value = {} as Record<"id" & DataKey, T[DataKey]>;
			for (const k of keys) {
				value[k] = data[k];
			}
			table.add_data(value as any);
		}

		return table;
	}

	// @ts-expect-error
	declare full_table: () => Table<T, ["ID",...`${UnderscoreToSpace<Exclude<keyof T, symbol | "id">>}`[]]>;

	get filename() {
		return this.file;
	}

	get size() {
		return this.data.size;
	}
}

const base_jdb_file_info = <T extends string>(name: T) => {
	const file_name = `jdb/${name}.jdb` as const;
	const options = () => ({
		dir: Dir.AppData,
		recursive: true,
	}) as const;

	const info = {
		file_name,
		options,
		exists: () => exists(file_name, options()),
		write: (content: string) => writeFile(file_name, content, options())
	} as const;

	return info;
}

export function get_jdb<T extends SchemaObj<BaseModel>, N extends string, P extends string>(name: N, prefix: P, schema: T, load?:boolean): Promise<JDB<T, N, P, SchemaType<T>>>;
export function get_jdb<T extends SchemaObj<BaseModel>, N extends string, P extends string, M extends JMetaData>(name: N, prefix: P, schema: T, meta: M, load?:boolean): Promise<JDB<T, N, P, SchemaType<T>, M>>;
export async function get_jdb<
	T extends SchemaObj<BaseModel>,
	N extends string,
	P extends string,
	M extends JMetaData | undefined = undefined
>(name: N, prefix: P, schema: T, meta_or_load: M | boolean = true, load_data:boolean = true) {
	const file = base_jdb_file_info(name);
	
	const exists = await file.exists();
	if (!exists) {
		try {
			createDir("jdb", file.options());
		} catch (e) {
			console.error(e);
		}
		try {
			await file.write("");
		} catch (e) {
			console.error(e);
		}
	}

	const should_load = typeof meta_or_load == "boolean" ? meta_or_load : load_data;
	const meta = (typeof meta_or_load == "object" ? meta_or_load : undefined) as M;

	const jdb = new JDB<T, N, P, SchemaType<T>, M>(name, prefix, schema, meta);

	if (!should_load) {
		return jdb;
	}

	await jdb.update_internal();

	return jdb;
}
