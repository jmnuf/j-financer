import { exists, BaseDirectory as Dir, writeFile, createDir, readTextFile as readFile } from "@tauri-apps/api/fs";
import { appDataDir } from '@tauri-apps/api/path';

export const app_dir = await appDataDir();
console.log(app_dir);

type BaseModel = Record<string, string | number | string[] | number[]> & { id: string; };
type BaseData<T extends BaseModel> = Omit<T, "id">

const test1 = {
	id: "T00001",
	name: "John",
	age: 32,
};
const test2 = {
	name: "John",
	age: 32,
	id: test1.id,
} as BaseData<typeof test1>;
test2.name

class JDB<T extends BaseModel, const F extends string, const P extends string, TBase extends BaseData<T> = BaseData<T>> {
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
			contents += `${id};${JSON.stringify(data)}`;
		}
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

type Artist = {
	id: `ATR${string}`;
	band_name: string;
	full_names: string[];
};

type ReachSnapshot = {
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
