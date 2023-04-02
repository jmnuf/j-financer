// import { invoke } from "@tauri-apps/api/tauri";
import { create_app } from "./utils/ui";
import { artists } from "./main.data";
// import type { Artist } from "./utils/jdb";
import Table from "./components/table";
import type { Artist } from "./utils/jdb";

class App {
	private title;
	private artists;
	private _name;

	constructor(title: string, name: string = "") {
		this.title = title;
		this._name = "";
		this.name = name;
		this.artists = new Table("Artists", "ID", "Artistic Name", "Legal Names");
	}

	add_artist(art: Artist) {
		return this.artists.add_row(art.id, art.band_name, art.band_name);
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
}

const model = new App("Financer", "J");
create_app("app-template", model);
console.dir(model);


for (const artist of artists.values()) {
	console.log("Add row", artist);
	model.add_artist(artist);
}
