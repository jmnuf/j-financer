// import { invoke } from "@tauri-apps/api/tauri";
import { create_app } from "./utils/ui";
import { artists } from "./main.data";
import type { Artist } from "./utils/jdb";

class App {
	title: string;
	artists:Artist[] = [];
	private _name: string;

	constructor(title: string, name: string = "") {
		this.title = title;
		this._name = "";
		this.name = name;
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
}

const model = new App("Financer", "J");
create_app("app-template", model);
console.dir(model);

model.artists = artists.values.to_array();
