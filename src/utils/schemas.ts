import { z } from "zod";

export const artist_schema = z.object({
	id: z.string(),
	band_name: z.string(),
	full_names: z.array(z.string()),
});

export type Artist = z.infer<typeof artist_schema>;

export const reach_schema = z.object({
	id: z.string(),
	artist: z.string(),
	reach: z.number(),
	from_date: z.string(),
	income: z.number(),
});

export type ReachSnapshot = z.infer<typeof reach_schema>;


export const sale_schema = z.object({
	id: z.string(),
	sale_month: z.string(),
	report_date: z.string(),
	from: z.string(),
	store: z.string(),
	artist: z.string(),
	title: z.string(),
	quantity: z.number(),
	album: z.literal("single").or(z.literal("album")),
	country: z.string(),
	earnings: z.number(),
});

export type Sales = z.infer<typeof sale_schema>;

export type SalesMetaData = {
	// Month-Day-Year
	from: string;
};