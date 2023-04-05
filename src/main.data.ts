import { Dir, exists, readTextFile as readFile } from "@tauri-apps/api/fs";
import { get_jdb } from "./utils/jdb";
import { SalesMetaData, artist_schema, reach_schema, sale_schema } from "./utils/schemas";
import { z } from "zod";

const artists = await get_jdb("artists", "ART", artist_schema);
artists.full_table = () => {
	return artists.create_table("Band Name", "Full Names");
};

const reaches = await get_jdb("reach", "RCH", reach_schema);
reaches.full_table = () => {
	return reaches.create_table("Artist", "Reach", "Timestamp", "Income");
}

const sales = await get_jdb("sales", "SALE", sale_schema, { from: "0-0-0" } as SalesMetaData);
sales.full_table = () => {
	return sales.create_table("Sale Month", "Report Date", "Store", "Artist", "Title", "Quantity", "Album", "Country", "Earnings");
};

await (async () => {
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
	
	const parse_result = schema.safeParse(JSON.parse(data_string));
	if (!parse_result.success) {
		console.error("Failed to parse data!", parse_result.error.issues)
		return;
	}
	const snapshot = parse_result.data;

	console.log("Snapshot data from", snapshot.date);
	console.log("Save data from", sales.meta_data.from);
	if (sales.meta_data.from == snapshot.date) {
		console.log("Aborting the parsing of snapshot. Current data is of the same date");
		return;
	}
	const inserts_result = { ok: true, failed: [] as { artist: string, err: Error }[] };
	for (const data of snapshot.data) {
		const artist = artists.find_by("band_name", data["Artist"]);
		if (artist == -1) {
			console.warn("Ignoring uknown artist", artist);
			continue;
		}
		const result = sales.insert({
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
		if (result.ok) {
			continue;
		}

		inserts_result.failed.push({ artist, err: result.error });
	}
	sales.meta_data.from = snapshot.date;
	console.log("Loaded data from", sales.meta_data.from);
	if (!inserts_result.ok) {
		console.error("Failed to insert all saved values\n", inserts_result.failed);
		console.warn("Not updating local sales file because of insert errors");
		return;
	}
	const udpated = await sales.update_external();
	if (udpated) {
		console.log("Succesfully updated the local sales save");
	} else {
		console.error("Failed to update the local sales save");
	}
})();

export {
	artists,
	reaches as reach,
	sales,
};
