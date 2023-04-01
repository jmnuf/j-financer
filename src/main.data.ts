import { artists } from "./utils/data-reader";

let jm = artists.retrieve(0);
if (!jm) {
	jm = artists.insert({
		band_name: "__JM__",
		full_names: ["Jose Marco Nufio Garrido"],
	});
	artists.update_external();
	console.log("Created __JM__ register");
} else {
	console.log("Found register 0");
}

console.log(jm);
