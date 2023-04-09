import { UI } from "@peasy-lib/peasy-ui";
import { RemoveArrayRepeats } from "./more-types";

let updating = false;
let updating_timeout: ReturnType<typeof setTimeout>;
export const config = {
	parent: document.getElementById("pui-app"),
	get updating() {
		return updating;
	},
}

export type PUI_Template = string | HTMLTemplateElement;
export type Class = { new(...args: any[]): unknown };
export type ClassInstance<C extends Class> = C extends { new(...args: any[]): infer T; } ? T : never;

type PUI_HTMLComponent<C extends Class | unknown> = (C extends Class ? C : Class) & { template: HTMLTemplateElement; };
type PUI_JSComponent<C extends Class | unknown> = (C extends Class ? C : Class) & { template: string; };
type PUIComponent<C extends Class | unknown> = PUI_HTMLComponent<C> | PUI_JSComponent<C>;

export function create_app<T extends {}>(id: string, model: T, manual_updates:boolean = false) {
	const parent = config.parent;
	if (!parent) {
		throw new Error("Parent Element #pui-element doesn't exist");
	}
	const elem = document.getElementById(id);
	if (!(elem instanceof HTMLTemplateElement)) {
		throw new TypeError(`Expected elment with #${id} to be a template HTML element`);
	}
	
	if (manual_updates) {
		UI.initialize(false);
		// Throttle updates
		const true_updater = UI.update;
		UI.update = () => {
			if (updating) {
				clearTimeout(updating_timeout);
				updating_timeout = setTimeout(() => {
					updating = false;
					UI.update();
				}, 50);
				return;
			}
			updating = true;
			true_updater.call(UI);
			updating_timeout = setTimeout(() => updating = false, 50);
		}
	}

	const view = UI.create(parent, elem, model);
	
	if (manual_updates) {
		UI.update();
	}
	
	elem.remove();
	return [view, model, elem] as const;
}

export function setup_component<C extends Class>(Cls: C, template: `#${string}` | HTMLTemplateElement, remove?:boolean): PUI_HTMLComponent<C>;
export function setup_component<C extends Class>(Cls: C, template: string): PUI_JSComponent<C>;
export function setup_component<C extends Class>(Cls: C, template:string | HTMLTemplateElement, remove = true): PUIComponent<C> {
	// @ts-expect-error
	const Component: PUIComponent<C> = Cls;

	if (template instanceof HTMLTemplateElement) {
		Component.template = template;
		if (remove) {
			template.remove();
		}
		return Component;
	}

	if (template.startsWith('#')) {
		const elem = document.querySelector(template);
		if (!(elem instanceof HTMLTemplateElement)) {
			throw new TypeError("Expected a template element for setting up the component");
		}
		Component.template = elem;
		if (remove) {
			elem.remove();
		}
	} else {
		Component.template = template;
	}

	return Component;
}

export function update_on_keys<T extends Record<string, any>, Keys extends (keyof T)[]>(model: T, keys: RemoveArrayRepeats<Keys>) {
	const observed = {}
	for (const k of Object.keys(model) as (keyof T)[]) {
		if (!keys.includes(k)) {
			Object.defineProperty(observed, k, {
				set(value: T[keyof T]) {
					model[k] = value;
				},
				get() {
					return model[k];
				}
			});
			continue;
		}
		Object.defineProperty(observed, k, {
			set(value: T[keyof T]) {
				model[k] = value;
				UI.update();
			},
			get() {
				return model[k];
			},
		});
	}
	return observed as T;
}

export type BasePuiComponentParams<C extends Class> = {
	readonly Cls: C,
	readonly template: `#${string}` | HTMLTemplateElement;
	readonly is_app?: boolean,
	readonly observe?: {
		readonly keys: readonly Exclude<keyof ClassInstance<C>, symbol>[];
		readonly dont_define?: readonly Exclude<keyof ClassInstance<C>, symbol>[];
	};

}

export abstract class PuiComponent<C extends Class> {
	declare static readonly template: HTMLTemplateElement;
	declare private readonly template: HTMLTemplateElement;

	constructor({ Cls, template, observe, is_app }: BasePuiComponentParams<C>) {
		if ("template" in Cls && Cls.template instanceof HTMLTemplateElement) {
			this.template = Cls.template;
			return;
		}

		const C = setup_component(Cls, template, !is_app);
		this.template = C.template;
		if (!observe) {
			return;
		}

		for (const key of observe.keys) {
			const private_key = `_${key}` as Exclude<keyof typeof this, symbol>;
			let set, get;
			if (private_key in this) {
				const desc = Object.getOwnPropertyDescriptor(this, private_key)!;
				if (desc.get) {
					get = desc.get;
				}
				if (desc.set) {
					set = desc.set;
				}
				desc.enumerable = false;
			} else if (observe.dont_define == null || !observe.dont_define.includes(key)) {
				console.log(`Defining missing private key: "${private_key}"`);
				Object.defineProperty(this, private_key, {
					value: 0,
					writable: true,
					configurable: false,
					enumerable: false,
				});
			}
			if (!set) {
				set = (value: any) => {
					this[private_key] = value;
					UI.update();
				}
			} else {
				const original_setter = set;
				set = function(this: C, value: unknown) {
					original_setter.call(this, value);
					UI.update();
				}
			}
			if (!get) {
				get = () => this[private_key];
			}
			console.log(`Base key: "${key}"`);
			console.log(`Priv key: "${private_key}"`);
			Object.defineProperty(this, key, {
				set, get,
				enumerable: true,
			});
		}
	}

	request_ui_update() {
		UI.update();
	}
}
