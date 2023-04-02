import { artists } from "./utils/jdb";

let jm = artists.retrieve(0);
if (!jm) {
	jm = artists.insert({
		band_name: "__JM__",
		full_names: ["Jose Marco Nufio Garrido"],
	});
	artists.update_external();
	console.log("Created __JM__ register");
} else {
	console.log("Found register 0", jm);
}

let simplicity = artists.retrieve(1);
if (!simplicity) {
	simplicity = artists.insert({
		band_name: "Simplicity",
		full_names: ["Victor Josue Ferrufino Median"]
	});
	artists.update_external();
	console.log("Created Simplicity register");
} else {
	console.log("Found register 1", simplicity);
}

export {
	jm,
	simplicity,
	artists,
};
