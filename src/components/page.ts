import type { BasePuiComponentParams, Class } from "../utils/ui";
import { PuiComponent } from "../utils/ui";

type Observed<C extends Class> = BasePuiComponentParams<C>["observe"];
type PageClass = Class & { readonly page_name: string };

export class Page<C extends PageClass> extends PuiComponent<C> {
	static readonly page_name: string;
	declare readonly page_name: string;
	readonly page_path: string;

	constructor({ Cls, observe, path }:{ Cls: C, path?: string, observe?: Observed<C> }) {
		super({
			Cls, template: `#${Cls.name.toLowerCase()}-template`,
			is_app: false, observe,
		});
		Object.defineProperty(this, "page_name", {
			configurable: false, enumerable: true,
			get() {// Local property just references static class value
				return Cls.page_name;
			}
		});

		if (typeof path === "string") {
			this.page_path = path;
			return;
		}
		this.page_path = `/${this.page_name}`;
	}

	create_link_element(text: string = this.page_name) {
		return new PageLink(this.page_path, text);
	}
}

export function into_page<T extends { template: HTMLTemplateElement | string; }>(model: T, page_name: string, page_path: string = `/${page_name}`) {
	const template = document.createElement("template");
	template.innerHTML = `<pui-page pui="content ==="><pui-page/>`;
	class ContentPage<TData> extends Page<typeof ContentPage> {
		static readonly template: HTMLTemplateElement;
		static readonly page_name: string = page_name;
		content: TData;

		constructor(model: TData) {
			super({
				Cls: ContentPage,
				path: page_path,
			});
			this.content = model;
		}
	}
	const page = new ContentPage(model);
	return [page, ContentPage] as const;
}

export class PageLink {
	private static template = `<a href="/\${to}" \${click @=> _on_click}>\${message}</a>`;
	message: string;
	to: string;

	constructor(to: string, message?: string) {
		this.to = to.trim();
		if (typeof message === "string") {
			this.message = message;
			return
		}

		this.message = this.to;
	}

	get template() {
		return PageLink.template;
	}
}
