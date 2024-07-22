import {fileURLToPath} from "url";
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');

// iterate through the shows directory in data, get the YAML filenames.
import path from "path";
import fs from "fs";

const showsDir = path.resolve(dataDir, 'shows');
const liveShowYAMLs = fs.readdirSync(showsDir);

let shows = {};

// Iterate through the YAML files and get the show IDs.
let liveShowIDs = [];
for (let i = 0; i < liveShowYAMLs.length; i++) {
    let showYAML = liveShowYAMLs[i];
    let showID = showYAML.split('.')[0];
    liveShowIDs.push(showID);

    // Read the YAML file
    let showYAMLFile = fs.readFileSync(path.resolve(showsDir, showYAML));
    let showYAMLData = yaml.load(showYAMLFile);

    let sets_in_this_show = {}

    for (i = 0; i < Object.keys(showYAMLData['sets']).length; i++) {
        let set = showYAMLData['sets'][i];

        sets_in_this_show[i] = set;
        let songs_in_this_set = {}

        // Clean the data, turning eerything into an object
        for (let s = 0; s < set.length; s++) {
            let song = set[s];
            let songObject = {};
            if (typeof song === 'string') {
                songObject['type'] = "normal";
                songObject['title'] = song;
                songs_in_this_set[s] = songObject;
            } else {
                const song_title = Object.keys(song)[0]
                songObject['title'] = song_title;
                for (let key in song) {
                    if (key !== song_title) {
                        songObject[key] = song[key];
                    }
                }
            }
        }
    }
    // All songs are now objects.  TODO: Just give shows an ID and persist them, etc.
    showYAMLData['sets'] = sets_in_this_show;
    shows[showID] = showYAMLData;
}


// Export the liveShowIDs
export {shows};