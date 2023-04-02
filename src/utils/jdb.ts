import { exists, BaseDirectory as Dir, writeFile, createDir, readTextFile as readFile } from "@tauri-apps/api/fs";

export type BaseModel = Record<string, string | number | string[] | number[]> & { id: string; };
export type BaseData<T extends BaseModel> = Omit<T, "id">

type IterValue<T extends Iterable<unknown>> = T extends Iterable<infer V> ? V : never;

type FilterMapPredicate<T, R> = (value: T, index: number) => R | undefined;

export type CustomIterator<V> = { (): Generator<V, void>; } & {
	to_array(): V[];
	to_array<R>(predicate: FilterMapPredicate<V, R>): R[];
};

export function createCustomIterator<T extends Iterable<unknown> = Iterable<unknown>, V extends IterValue<T> = IterValue<T>>(data: T): CustomIterator<V>;
export function createCustomIterator<K extends keyof V, T extends Iterable<unknown> = Iterable<unknown>, V extends IterValue<T> = IterValue<T>>(data: T, key: K): CustomIterator<V[K]>;
export function createCustomIterator<const K extends keyof V, T extends Iterable<any> = Iterable<any>, V extends IterValue<T> = IterValue<T>>(data: T, key?: K): CustomIterator<V|V[K]> {
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

export class JDB<T extends BaseModel, const F extends string, const P extends string, TBase extends BaseData<T> = BaseData<T>> {
	private file: `jdb/${F}.jdb`;
	private prefix: P;
	private count: number = 0;
	private data = new Map<string, T>();

	constructor(name:F, prefix:P) {
		this.file = `jdb/${name}.jdb`;
		this.prefix = prefix;
	}

	private create_id(num: number) {
		return `${this.prefix}${`${num}`.padStart(6, "0")}`;
	}

	insert(data: TBase) {
		const id = this.create_id(this.count++);
		// @ts-ignore
		data.id = id;
		// @ts-ignore
		this.data.set(id, data);

		return this.data.get(id);
	}

	retrieve(num: number) {
		const id = this.create_id(num);
		return this.data.get(id);
	}

	holds(num: number) {
		const id = this.create_id(num);
		return this.data.has(id);
	}

	readonly entries = createCustomIterator(this.data);
	readonly ids = createCustomIterator(this.data, 0);
	readonly values = createCustomIterator(this.data, 1);
	
	[Symbol.iterator]() {
		return this.data[Symbol.iterator]()
	}
	
	protected async readFile() {
		try {
			return await readFile(this.file, { dir: Dir.AppData });
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	async update_external() {
		let contents = `@${this.count}\n`;
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
		const contents = await this.readFile();
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
		const counter = lines.shift() as string;
		this.count = parseInt(counter.substring(1));

		for (const line of lines) {
			const [id, data_string] = line.split(";", 2);
			const data = JSON.parse(data_string);
			this.data.set(id, data);
		}

		return true;
	}

	get filename() {
		return this.file;
	}
}

export type Artist = {
	id: `ATR${string}`;
	band_name: string;
	full_names: string[];
};

export type ReachSnapshot = {
	id: `RCH${string}`;
	artist: string;
	reach: number;
	timestamp: number,
	income: number,
};

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

const get_jdb = async <T extends BaseModel, N extends string, P extends string>(name: N, prefix: P) => {
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

	const jdb = new JDB<T, N, P>(name, prefix);

	await jdb.update_internal();

	return jdb;
}

export const artists = await get_jdb<Artist, "artists", "ART">("artists", "ART");

export const reach = await get_jdb<ReachSnapshot, "reach", "RCH">("reach", "RCH");
