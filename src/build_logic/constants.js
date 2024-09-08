import {fileURLToPath} from "url";
import path from "path";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const templateDir = path.resolve(__dirname, '../templates');
export const pageBaseDir = path.resolve(templateDir, 'pages');
export const outputBaseDir = path.resolve(__dirname, '../../_prebuild_output');
export const dataDir = path.resolve(__dirname, '../data');
export const showsDir = path.resolve(dataDir, 'shows');
export const imagesSourceDir = path.join(__dirname, '../images');

// Erase the output directory if it exists
if (fs.existsSync(outputBaseDir)) {
    fs.rmSync(outputBaseDir, {recursive: true});
}

// And then make a fresh one.
fs.mkdirSync(outputBaseDir, {recursive: true});