import { setup_component } from "../utils/ui";

export type TableRowItemValue = string | number | string[] | number[];
export type TableRow = TableRowItemValue[];
export type SizedArr<T, L extends number> = [...T[]] & { length: L; };

class _Table<const L extends number = number> {
	title: string;
	headers: SizedArr<string, L>;
	rows: TableRow[]
	constructor(title: string, ...headers: SizedArr<string, L>) {
		this.title = title;
		this.headers = headers;
		this.rows = [];
	}

	add_row(...row: SizedArr<TableRowItemValue, L>) {
		this.rows.push(row);
	}

	set_headers(...headers: SizedArr<string, L>) {
		this.headers = headers;
	}
}

export const Table = setup_component(_Table, "#table-template");
