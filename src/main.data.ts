import { Dir, exists, readTextFile as readFile } from "@tauri-apps/api/fs";
import { get_jdb } from "./utils/jdb";
import { SalesMetaData, artist_schema, reach_schema, sale_schema } from "./utils/schemas";
import { z } from "zod";

const artists = await get_jdb("artists", "ART", artist_schema);
artists.full_table = () => {
	return artists.create_table("Band Name", "Legal Names" as "Full Names");
};

const reach = await get_jdb("reach", "RCH", reach_schema);
reach.full_table = () => {
	return reach.create_table("Artist", "Reach", "Timestamp", "Income");
}

const sales = await get_jdb("sales", "SALE", sale_schema, { from: "0-0-0" } as SalesMetaData);
sales.full_table = () => {
	return sales.create_table("Sale Month", "Report Date", "Store", "Artist", "Title", "Quantity", "Album", "Country", "Earnings");
};

(async () => {
	const f_name = "snapshot.json" as const;
	const snapshot_exists = await exists(f_name, { dir: Dir.AppData });
	if (!snapshot_exists) {
		console.log("No snapshot file found")
		return;
	}
	const data_string = await readFile(f_name, { dir: Dir.AppData });
	const date_schema = z.string().regex(/\w+-[0-9]+-[0-9]+/);
	const schema = z.object({
		date: date_schema,
		data: z.array(z.object({
			"Reporting Date": date_schema,
			"Sale Month": z.string().regex(/[0-9]+-[0-9]+/),
			"Store": z.string(),
			"Artist": z.string(),
			"Title": z.string(),
			"ISRC": z.string(),
			"UPC": z.string(),
			"Quantity": z.number(),
			"Song/Album": z.literal("Song").or(z.literal("Album")),
			"Country of Sale": z.string(),
			"Earnings (USD)": z.number(),
		}))
	});
	
	const result = schema.safeParse(JSON.parse(data_string));
	if (!result.success) {
		console.error("Failed to parse data!", result.error.issues)
		return;
	}
	const snapshot = result.data;

	console.log("Snapshot data from", snapshot.date);
	console.log("Loaded data from", sales.meta_data.from);
	if (sales.meta_data.from == snapshot.date) {
		console.log("Aborting the parsing of snapshot. Current data is of the same date");
		return;
	}
	for (const data of snapshot.data) {
		const artist = artists.find_by("band_name", data["Artist"]);
		if (artist == -1) {
			console.warn("Ignoring uknown artist", artist);
			continue;
		}
		sales.insert({
			sale_month: data["Sale Month"],
			store: data["Store"],
			report_date: data["Reporting Date"],
			title: data["Title"],
			album: data["Song/Album"] == "Song" ? "single" : "album",
			artist,
			country: data["Country of Sale"],
			earnings: data["Earnings (USD)"],
			quantity: data["Quantity"],
		});
	}
})();

export {
	artists,
	reach,
	sales,
};
