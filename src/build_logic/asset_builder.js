import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {globSync} from 'glob';
import yaml from "js-yaml";
import {imagesSourceDir, outputPrimaryDir} from "./constants.js";

console.time('asset-builder')

const imageDirPattern = `${imagesSourceDir}/**/*.{png,jpg,jpeg,gif,avif,svg,webp,mp4}`
const assetsOutputDir = path.join(outputPrimaryDir, 'assets');
const imageOutputDir = path.join(assetsOutputDir, 'images');
const mappingFilePath = path.join(outputPrimaryDir, 'imageMapping.json');

let imageMapping = {};
let unusedImages = new Set();

let _assets_gathered = false;

function gatherAssets() {
    console.time('asset-gathering');
    // Ensure the output directory exists
    if (!fs.existsSync(imageOutputDir)) {
        fs.mkdirSync(imageOutputDir, {recursive: true});
    }

    if (_assets_gathered) {
        throw new Error("Assets have already been gathered.")
    }
    let imageFiles = globSync(imageDirPattern);

    imageFiles.forEach(file => {
        // copy the vowelsound artifacts under their original name
        if (file.includes('vowelsound-artifacts')) {
            const vowelSoundArtifactsDir = path.join(imagesSourceDir, 'vowelsound-artifacts');
            const originalPath = path.relative(vowelSoundArtifactsDir, file).replace(/\\/g, '/');

            const dest_dir = path.join(imageOutputDir, 'vowelsound-artifacts');
            if (!fs.existsSync(dest_dir)) {
                fs.mkdirSync(dest_dir, {recursive: true});
            }

            fs.copyFileSync(file, path.join(dest_dir, originalPath));
            return;
        }

        const buffer = fs.readFileSync(file);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const ext = path.extname(file);
        const hashedFilename = `${hash}${ext}`;
        const outputPath = path.join(imageOutputDir, hashedFilename);

        // Optional: Process images with sharp here if needed

        fs.writeFileSync(outputPath, buffer);

        // Create mapping
        const originalPath = path.relative(imagesSourceDir, file).replace(/\\/g, '/');
        imageMapping[originalPath] = `/assets/images/${hashedFilename}`;
        unusedImages.add(originalPath);
    });

    // Write the mapping to a JSON file
    fs.writeFileSync(mappingFilePath, JSON.stringify(imageMapping, null, 2));
    console.log('Image processing complete. Mapping saved to:', mappingFilePath, 'Found', Object.keys(imageMapping).length, 'images.');
    console.timeEnd('asset-gathering');

    let auxDataFile = fs.readFileSync("src/data/aux_data.yaml");
    let auxData = yaml.load(auxDataFile);
    let slogans = auxData["slogans"];

    // Write slogans to a JSON file for use in the frontend
    fs.writeFileSync(path.join(assetsOutputDir, "slogans.json"), JSON.stringify(slogans));

}


function getImageMapping() {
    if (!_assets_gathered) {
        throw new Error("Need to gather assets before using image mapping.")
    }
    const mappingFilePath = path.join(outputPrimaryDir, 'imageMapping.json');
    const jsonData = fs.readFileSync(mappingFilePath, {encoding: 'utf8'});
    return JSON.parse(jsonData);
}

function get_image_from_asset_mapping(filename) {
    // remove this filename from unusedImages
    unusedImages.delete(filename);
    return imageMapping[filename];  // Return empty string if not found
}

export {gatherAssets, imageMapping, unusedImages, getImageMapping, get_image_from_asset_mapping};