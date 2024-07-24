import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chain_data_dir = path.resolve(__dirname, '../../_prebuild_chain_data');
const chain_data_json_path = path.resolve(__dirname, '../../_prebuild_chain_data/chainData.json');

function stringify(obj) {
    // Custom replacer function to handle BigInt
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2);
}

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
    return JSON.parse(chainDataJson);
}