// import { invoke } from "@tauri-apps/api/tauri";
import { PuiComponent, create_app } from "./utils/ui";
import { artists, reach } from "./utils/jdb";
import type { Artist, ReachSnapshot } from "./utils/jdb";
import Table from "./components/table";

type AppTables = typeof App.prototype.tables;
type AppTableNames = keyof AppTables;

const manual = false as const;

class App extends PuiComponent<typeof App> {
	private title;
	readonly tables;
	private _name;
	table_names: AppTableNames[];
	declare active_name: AppTableNames;
	private active_table;

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
		const artists = new Table<["ID", "Band_Name", "Full_Names"], Artist>("Artists", "ID", "Band_Name", "Full_Names");
		this.active_name = "artists";

		const reaches = new Table<["ID", "Artist", "Income", "TimeStamp"], ReachSnapshot>("Artist Reach", "ID", "Artist", "Income", "TimeStamp");

		this.tables = Object.freeze({
			artists,
			reaches,
		});
		this.table_names = Object.keys(this.tables) as AppTableNames[];
		
		// This is works with automatic updates
		this.active_table = new Table<string[], Record<string, any>>(artists.title, manual, ...artists.headers);
		this.active_table.rows = artists.rows;
	}

	set_active_table(table_name: AppTableNames) {
		const active = this.tables[table_name];
		this.active_table.title = active.title;
		this.active_table.headers = active.headers;
		this.active_table.rows = active.rows;
		this.active_name = table_name;
	}

	get_table<T extends AppTableNames>(table_name: T) {
		return this.tables[table_name];
	}

	add_artist(art: Artist) {
		const artists = this.tables.artists;
		const r = artists.add_row(art.id, art.band_name, art.full_names);
		this.request_ui_update();
		return r;
	}

	add_reach_snapshot(snapshot: ReachSnapshot) {
		const reaches = this.tables.reaches;
		return reaches.add_row(snapshot.id, snapshot.artist, snapshot.income, snapshot.timestamp);
	}

	// @ts-expect-error
	private on_table_btn_clicked = (event:PointerEvent) => {
		const target = event.target as HTMLButtonElement;
		const text = target.innerText;
		if (this.active_name == text) {
			return;
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
}

const app = new App("Financer", "J");

for (const artist of artists.values()) {
	console.log("Add row", artist);
	app.add_artist(artist);
}

const active = app.tables[app.active_name];
console.log(active);


for (const snapshot of reach.values()) {
	console.log("Add reach snapshot", snapshot);
	app.add_reach_snapshot(snapshot);
}



create_app("app-template", app, manual);
console.dir(app);

