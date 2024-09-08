import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import { stringify } from "../js/utils.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 
const chain_data_dir = path.resolve(__dirname, '../../_prebuild_chain_data');


// If the environment variable TEST_CHAIN_DATA is set, use the testChainData.json instead
const chain_data_json_path = process.env.TEST_CHAIN_DATA 
    ? path.resolve(__dirname, '../../_prebuild_chain_data/testChainData.json') 
    : path.resolve(__dirname, '../../_prebuild_chain_data/chainData.json');


export function serializeChainData(chainData) {
// create the _prebuild_chain_data directory if it doesn't exist
    if (!fs.existsSync(chain_data_dir)) {
        fs.mkdirSync(chain_data_dir, {recursive: true});
    }
    const chainDataJson = stringify(chainData);
    fs.writeFileSync(chain_data_json_path, chainDataJson);
}

export function deserializeChainData() {
    const chainDataJson = fs.readFileSync(chain_data_json_path, 'utf8');
    const parsedChainData = JSON.parse(chainDataJson);
    return parsedChainData;
}

export function deserializeTimeData() {
    const time_data_json_path = path.resolve(__dirname, '../data/time_data.json');
    const time_data_json = fs.readFileSync(time_data_json_path, 'utf8');
    return JSON.parse(time_data_json);
}