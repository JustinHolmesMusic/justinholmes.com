import {get_times_for_shows} from './chain_reading.js';
import path from 'path';
import fs from "fs";
import {stringify} from "../js/utils.js";
import {dataDir} from "./constants.js";


const time_data_json_path = path.resolve(dataDir, 'time_data.json');
const times_for_shows = await get_times_for_shows();
const times_for_shows_json = stringify(times_for_shows);

fs.writeFileSync(time_data_json_path, times_for_shows_json);

console.log("Wrote time data to " + time_data_json_path);
console.log("Feel free to commit it.");
