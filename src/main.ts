// import { invoke } from "@tauri-apps/api/tauri";
import { PuiComponent, create_app } from "./utils/ui";
// import { artists, reach } from "./main.data";
import type { Artist, ReachSnapshot } from "./utils/schemas";
import Table, { TableRowItemValue } from "./components/table";
import { AllStringCasings } from "./utils/more-types";
// import { artists as artists_data, reach as reaches_data, sales as sales_data } from "./main.mock";
import { artists as artists_data, reach as reaches_data, sales as sales_data } from "./main.data";

type AppTables = typeof App.prototype.tables;
type AppTableNames = keyof AppTables;

const manual = false as const;

class App extends PuiComponent<typeof App> {
	private title;
	readonly tables;
	private _name;
	table_names: AppTableNames[];
	private active_table;
	declare active_name: AppTableNames;
	declare private on_table_btn_clicked: (event: PointerEvent) => void;

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
		this._name = typeof name == "string" ? name : "";
		const artists = artists_data.full_table();
		this.active_name = "artists";
		
		const reaches = reaches_data.full_table();
		const sales = sales_data.full_table();
		
		this.tables = Object.freeze({
			artists,
			reaches,
			sales,
		});
		this.table_names = Object.keys(this.tables) as AppTableNames[];
		
		this.active_table = new Table<Record<string, TableRowItemValue>, AllStringCasings<string>>(artists.title, manual, ...artists.headers);
		this.active_table.rows = artists.rows;

		this.__init__();
	}

	private __init__() {
		this.on_table_btn_clicked = (event:PointerEvent) => {
			const target = event.target as HTMLButtonElement;
			const text = target.innerText;
			if (this.active_name == text) {
				return;
			}
			this.set_active_table(text as AppTableNames);
		}
	}

	set_active_table(table_name: AppTableNames) {
		const active = this.tables[table_name];
		this.active_table.title = active.title;
		this.active_table.headers = active.headers;
		this.active_table.rows = active.rows;
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

	get is_artists_active() {
		return this.active_name === "artists";
	}
	get is_reaches_active() {
		return this.active_name === "reaches";
	}

	set name(value: string | String | null | undefined) {
		if (typeof value == "string" || value instanceof String) {
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

	// get active_table() {
	// 	return this.tables[this.active_name];
	// }
}

const app = new App("Financer", "J");

const active = app.get_active_table();
console.log("App starting on table", app.active_name, active);

create_app("app-template", app, manual);
console.dir(app);

