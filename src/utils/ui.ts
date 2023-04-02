import { UI } from "@peasy-lib/peasy-ui";

export const config = {
	parent: document.getElementById("pui-app"),
	components: {} as Record<string, PUIComponent<unknown>>
}

type Class = { new(...args: any[]): unknown; }
// type ClassInstance<C extends Class> = C extends { new(...args: unknown[]): infer T; } ? T : never;

type PUI_HTMLComponent<C extends Class | unknown> = (C extends Class ? C : Class) & { template: HTMLTemplateElement; };
type PUI_JSComponent<C extends Class | unknown> = (C extends Class ? C : Class) & { template: string; };
type PUIComponent<C extends Class | unknown> = PUI_HTMLComponent<C> | PUI_JSComponent<C>;

export function create_app<T extends {}>(id: string, model: T) {
	const parent = config.parent;
	if (!parent) {
		throw new Error("Parent Element #pui-element doesn't exist");
	}
	const elem = document.getElementById(id);
	if (!(elem instanceof HTMLTemplateElement)) {
		throw new TypeError(`Expected elment with #${id} to be a template HTML element`);
	}
	const view = UI.create(parent, elem, model);
	elem.remove();

	return [view, model, elem] as const;
}

export function setup_component<C extends Class>(Cls: C, template: `#${string}`): PUI_HTMLComponent<C>;
export function setup_component<C extends Class>(Cls: C, template: string): PUI_JSComponent<C>;
export function setup_component<C extends Class>(Cls: C, template:string): PUIComponent<C> {
	// @ts-expect-error
	const Component: PUIComponent<C> = Cls;

	if (template.startsWith('#')) {
		const elem = document.querySelector(template);
		if (!(elem instanceof HTMLTemplateElement)) {
			throw new TypeError("Expected a template element for setting up the component");
		}
		Component.template = elem;
	} else {
		Component.template = template;
	}

	config.components[Cls.name] = Component;

	return Component;
}
