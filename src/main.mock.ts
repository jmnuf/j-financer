import Table from "./components/table";
import type { Artist, ReachSnapshot, Sales } from "./utils/schemas";

const test_data_artists: Artist[] = [
	{ id: "ART000000", band_name: "NF", full_names: ["Nathan Feuerstein"] },
	{ id: "ART000001", band_name: "Eminem", full_names: ["Marshal Mathers"] },
	{ id: "ART000002", band_name: "Nach", full_names: ["Ignacio Fornés Olmo"] },
];
export const artists = {
	data: (() => new Map(test_data_artists.map(v => [v.id, v])))(),
	full_table: () => {
		const t = new Table<Artist>("Artists", "Band Name", "Full Names");
		for (const a of test_data_artists) {
			t.add_data(a);
		}
		return t;
	}
};

const create_random_snapshot = () => {
	// @ts-expect-error
	const index:number = create_random_snapshot.index ? create_random_snapshot.index : 0;
	// @ts-expect-error
	create_random_snapshot.index = index + 1;
	// @ts-expect-error
	const timestamp: number = create_random_snapshot.timestamp ?? Date.now() - Math.floor(Math.random() * 100_420_000 + 69_000_000);
	// @ts-expect-error
	create_random_snapshot.timestamp = timestamp - Math.floor(Math.random() * 1_000_000 + 1_000);

	const artist_count = artists.data.size;
	const artist = Array.from(artists.data.keys())[Math.floor(Math.random() * artist_count)];

	return {
		id: `RCH${`${index}`.padStart(6, "0")}`,
		artist,
		income: new Number(Math.floor(Math.random() * 5_000) + 1_000) as number,
		reach: new Number(Math.floor(Math.random() * 69_000)) as number,
		timestamp: new Number(timestamp) as number,
	} as ReachSnapshot;
};
const test_data_reaches: ReachSnapshot[] = [];
for (let i = 0; i < 20; i++) {
	test_data_reaches.push(create_random_snapshot());
}
export const reach = {
	data: (() => new Map(test_data_reaches.map(v => [v.id, v])))(),
	full_table: () => {
		const t = new Table<ReachSnapshot>("Artist Reach", "Artist", "Reach", "Income", "Timestamp");
		for (const snapshot of test_data_reaches) {
			t.add_data(snapshot);
		}
		return t;
	}
};

const create_random_sale = () => {
	// @ts-expect-error
	const index:number = create_random_sale.index ? create_random_sale.index : 0;
	// @ts-expect-error
	create_random_sale.index = index + 1;
	// @ts-expect-error
	const timestamp: number = create_random_sale.timestamp ?? Date.now() - Math.floor(Math.random() * 100_420_000 + 69_000_000);
	// @ts-expect-error
	create_random_sale.timestamp = timestamp - Math.floor(Math.random() * 1_000_000 + 1_000);

	const artist_count = artists.data.size;
	const artist = Array.from(artists.data.keys())[Math.floor(Math.random() * artist_count)];
	const store = ["Spotify", "Apple Music"][Math.floor(Math.random() * 2)];
	const quantity = Math.floor(Math.random() * 1000) + 1;

	return {
		id: `SALE${`${index}`.padStart(6, "0")}`,
		sale_month: "MM-dd",
		report_date: "MM-dd-yyyy",
		store,
		artist,
		title: "Item Title",
		quantity,
		country: "US",
		album: "single",
		earnings: Math.round(quantity * 0.000012345 * 1_000_000) / 1_000_000,
	} as Sales;
};
const test_data_sales: Sales[] = [];
for (let i = 0; i < 50; i++) {
	test_data_sales.push(create_random_sale());
}
export const sales = {
	data: (() => new Map(test_data_sales.map(v => [v.id, v])))(),
	full_table: () => {
		const t = new Table<Sales>("Artist Sales", "Sale Month", "Report Date", "Store", "Artist", "Title", "Quantity", "Album", "Country", "Earnings");
		for (const sale of test_data_sales) {
			t.add_data(sale);
		}
		return t;
	}
};
