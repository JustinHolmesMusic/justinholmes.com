import {fileURLToPath} from "url";
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');

// iterate through the shows directory in data, get the YAML filenames.
import path from "path";
import fs from "fs";
import { stringify } from "../js/utils.js";

const showsDir = path.resolve(dataDir, 'shows');
const liveShowYAMLs = fs.readdirSync(showsDir);

let shows = {};

// Iterate through the YAML files.
// We're going to get the show metadata and,
// FOR NOW, the list of songs, which we'll turn into a plausible future format.
let liveShowIDs = [];
for (let i = 0; i < liveShowYAMLs.length; i++) {
    let showYAML = liveShowYAMLs[i];
    let showID = showYAML.split('.')[0];
    liveShowIDs.push(showID);

    // Read the YAML file
    let showYAMLFile = fs.readFileSync(path.resolve(showsDir, showYAML));
    let showYAMLData = yaml.load(showYAMLFile);

    // This array will become an array of sets with songs formatted as we imagine they one day will be onchain.
    let sets_in_this_show = {}

    for (let [set_number, set] of Object.entries(showYAMLData['sets'])) {

        let this_set = {"songplays": {}}

        // Now we'll iterate through the songs.
        // Some of them will just be strings, while others will be objects.
        // For the strings, we'll set the default of type: normal.
        for (let s = 0; s < set["songplays"].length; s++) {
            let song = set["songplays"][s];
            let songObject = {};
            if (typeof song === 'string') {
                songObject['title'] = song;
            } else {
                const song_title = Object.keys(song)[0]
                songObject['title'] = song_title;
                for (let key in song) {
                    if (key !== song_title) {
                        // All other keys apply (ie, traditional: true)
                        songObject[key] = song[key];
                    }
                }
            }
                
            // fill the default values for unspecified fields
            if (!songObject.hasOwnProperty('type')) {
                songObject['type'] = "normal";
            }
            // And put the song back into the set object.
            this_set["songplays"][s] = songObject;
        }


        sets_in_this_show[set_number] = this_set;
    }
    // All songs are now objects.  TODO: Just give shows an ID and persist them, etc.
    showYAMLData['sets'] = sets_in_this_show;
    shows[showID] = showYAMLData;
}

export {shows};