// import { invoke } from "@tauri-apps/api/tauri";
import { PuiComponent, create_app } from "./utils/ui";
// import { artists, reach } from "./main.data";
import type { Artist, ReachSnapshot } from "./utils/schemas";
import Table, { TableRowItemValue } from "./components/table";
import { AllStringCasings } from "./utils/more-types";

type AppTables = typeof App.prototype.tables;
type AppTableNames = keyof AppTables;

const manual = false as const;

class App extends PuiComponent<typeof App> {
	private title;
	readonly tables;
	private _name;
	table_names: AppTableNames[];
	declare active_name: AppTableNames;
	// private active_table;

	constructor(title: string, name: string = "") {
		super({
			Cls: App, template: "#app-template",
			observe: !manual ? undefined : {
				keys: ["active_name", "name"],
				dont_define: ["name"],
			},
			is_app: true,
		});
		this.title = title;
		this._name = "";
		this.name = name;
		const artists = new Table<Artist>("Artists", "ID", "Band Name", "Full Names");
		this.active_name = "artists";

		const reaches = new Table<ReachSnapshot>("Artist Reach", "ID", "Artist", "Reach", "Income", "Timestamp");

		this.tables = Object.freeze({
			artists,
			reaches,
		});
		this.table_names = Object.keys(this.tables) as AppTableNames[];
		
		// this.active_table = new Table<Record<string, TableRowItemValue>, AllStringCasings<string>>(artists.title, manual, ...artists.headers);
		// this.active_table.rows = artists.rows;
	}

	set_active_table(table_name: AppTableNames) {
		// const active = this.tables[table_name];
		// this.active_table.title = active.title;
		// this.active_table.headers = active.headers;
		// this.active_table.rows = active.rows;
		this.active_name = table_name;
		console.log("Changed to table", table_name, this.active_table);
	}

	get_table<T extends AppTableNames>(table_name: T) {
		return this.tables[table_name];
	}

	add_artist(art: Artist) {
		const artists = this.tables.artists;
		return artists.add_row(art.id, art.band_name, art.full_names);
	}

	add_reach_snapshot(snapshot: ReachSnapshot) {
		const reaches = this.tables.reaches;
		return reaches.add_row(snapshot.id, snapshot.artist, snapshot.reach, snapshot.income, snapshot.timestamp);
	}

	// @ts-expect-error
	private on_table_btn_clicked = (event:PointerEvent) => {
		const target = event.target as HTMLButtonElement;
		const text = target.innerText;
		if (this.active_name == text) {
			// return;
		}
		this.set_active_table(text as AppTableNames);
	}

	get is_artists_active() {
		return this.active_name === "artists";
	}
	get is_reaches_active() {
		return this.active_name === "reaches";
	}

	set name(value: string | null | undefined) {
		if (typeof value == "string") {
			this._name = value.trim();
			return;
		}
		this._name = "";
	}

	get name(): string | null {
		return this._name && this._name.length > 0 ? this._name : null;
	}

	get greeting() {
		return `Welcome ${this.name}`;
	}

	get app_title() {
		return this.title;
	}

	get_active_table() {
		return this.tables[this.active_name];
	}
	get active_table() {
		return this.tables[this.active_name];
	}
}

const app = new App("Financer", "J");

const test_data_artists: Artist[] = [
	{ id: "ART000000", band_name: "NF", full_names: ["Nathan Feuerstein"] },
	{ id: "ART000001", band_name: "Eminem", full_names: ["Marshal Mathers"] },
	{ id: "ART000002", band_name: "Nach", full_names: ["Ignacio Fornés Olmo"] },
];
for (const artist of test_data_artists) {
	app.add_artist(artist);
}

// for (const artist of artists.values()) {
// 	console.log("Add row", artist);
// 	app.add_artist(artist);
// }

const create_random_snapshot = (): ReachSnapshot => {
	// @ts-expect-error
	const index:number = create_random_snapshot.index ? create_random_snapshot.index : 0;
	// @ts-expect-error
	create_random_snapshot.index = index + 1;
	// @ts-expect-error
	const timestamp: number = create_random_snapshot.timestamp ?? Date.now() - Math.floor(Math.random() * 100_420_000 + 69_000_000);
	// @ts-expect-error
	create_random_snapshot.timestamp = timestamp - Math.floor(Math.random() * 1_000_000 + 1_000);

	const artist_count = app.tables.artists.rows.length;
	const artist = app.tables.artists.rows[Math.floor(Math.random() * artist_count)][0];

	return {
		id: `RCH${`${index}`.padStart(6, "0")}`,
		artist,
		income: new Number(Math.floor(Math.random() * 5_000) + 1_000) as number,
		reach: new Number(Math.floor(Math.random() * 69_000)) as number,
		timestamp: new Number(timestamp) as number,
	} as ReachSnapshot;
};
const test_data_reaches: ReachSnapshot[] = [
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
	create_random_snapshot(),
];
for (const snapshot of test_data_reaches) {
	app.add_reach_snapshot(snapshot);
}

const active = app.tables[app.active_name];
console.log(active);


// for (const snapshot of reach.values()) {
// 	console.log("Add reach snapshot", snapshot);
// 	app.add_reach_snapshot(snapshot);
// }



create_app("app-template", app, manual);
console.dir(app);

