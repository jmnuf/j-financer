import { SpaceToUnderscore, UnderscoreToSpace, AllStringCasings } from "../utils/more-types";
import { PuiComponent, setup_component } from "../utils/ui";

export type TableRowItemValue = string | number | string[] | number[];
export type TableRow<L extends number> = SizedArr<TableRowItemValue, L>;
export type SizedArr<T, L extends number> = [...T[]] & { length: L; };

type KeysOfH<T extends SizedArr<string, number>> = Lowercase<SpaceToUnderscore<T[number]>>;
type KeyToH<T extends string | number> = AllStringCasings<T> | (
	T extends `${string}_${string}` ? AllStringCasings<UnderscoreToSpace<T>> : never
);

class TableModel<
	T extends Record<KeysOfH<H[]>, TableRowItemValue>,
	H extends `${KeyToH<Exclude<keyof T, symbol>>}` = `${KeyToH<Exclude<keyof T, symbol>>}`,
	const L extends number = number
> extends PuiComponent<typeof TableModel> {
	title: string;
	headers: SizedArr<string, L>;
	rows: TableRow<L>[];
	
	constructor(title:string, manual_updates:boolean, ...headers: SizedArr<H, L>);
	constructor(title:string, ...headers: H[]);
	constructor(title: string, ...headers: SizedArr<H, L> | [boolean, ...SizedArr<H, L>]) {
		const manual = typeof headers[0] === "boolean" && headers.shift() ? true : false;
		super({
			Cls: TableModel, template: "#table-template",
			observe: !manual ? undefined : {
				keys: ["rows", "title", "headers"]
			},
		});
		this.title = title;
		this.headers = (headers as SizedArr<H, L>).map(val => val.trim().replaceAll("_", " ")) as SizedArr<H, L>;
		this.rows = [];
		// @ts-expect-error
		this.template = TableModel.template;
	}

	add_data(data: T) {
		const values = [];
		for (const h of this.headers) {
			const key = h.toLowerCase().replaceAll(" ", "_") as KeysOfH<H[]>;
			const value = typeof data[key] == "number" ? new Number(data[key]) : data[key];
			values.push(value);
		}
		// @ts-expect-error
		this.add_row(...values);
	}

	add_row(...row: SizedArr<TableRowItemValue, L>) {
		// TODO: Remove when peasy allows number type in iterators
		for (let i = 0; i < row.length; i += 1) {
			if (typeof row[i] !== "number") {
				continue;
			}
			row[i] = new Number(row[i]) as TableRowItemValue;
		}
		this.rows.push(row);
	}
}
export type TableClass = typeof TableModel;
export default TableModel;
