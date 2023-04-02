import { setup_component } from "../utils/ui";

export type TableRowItemValue = string | number | string[] | number[];
export type TableRow = TableRowItemValue[];
export type SizedArr<T, L extends number> = [...T[]] & { length: L; };

class TableModel<const L extends number = number> {
	title: string;
	headers: SizedArr<string, L>;
	rows: TableRow[];
	
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
export type Model<Length extends number> = TableModel<Length>;

const Component = setup_component(TableModel, "#table-template");
export default Component;
