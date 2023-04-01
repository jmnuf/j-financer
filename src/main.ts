// import { invoke } from "@tauri-apps/api/tauri";
import { create_app } from "./utils/component";

class App {
	title: string;
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
}

const model = new App("Peasy UI");
create_app("app-template", model);
console.dir(model);

setTimeout(() => {
	model.name = "John Snow";
}, 10_000);
