import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {globSync} from 'glob';
import {fileURLToPath} from 'url';
import Handlebars from 'handlebars';
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesSourceDir = path.join(__dirname, '../images');
const imageDirPattern = `${imagesSourceDir}/**/*.{png,jpg,jpeg,gif,avif,svg,webp,mp4}`
const outputDir = path.join(__dirname, '../../_prebuild_output/assets');
const imageOutputDir = path.join(outputDir, 'images');
const mappingFilePath = path.join(__dirname, '../../_prebuild_output/imageMapping.json');

// Ensure the output directory exists
if (!fs.existsSync(imageOutputDir)) {
    fs.mkdirSync(imageOutputDir, {recursive: true});
}

let imageMapping = {};
var unusedImages = new Set();

function gatherAssets() {
    let imageFiles = globSync(imageDirPattern);

    imageFiles.forEach(file => {
        // copy the vowelsound artifacts under their original name
        if (file.includes('vowelsound-artifacts')) {
            const vowelSoundArtifactsDir = path.join(__dirname, '../images/vowelsound-artifacts');
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

}


Handlebars.registerHelper('resolveImage', function (originalPath) {

    let foundImage;
    try {
        foundImage = imageMapping[originalPath];
    } catch (e) {
        throw new Error(`Image not found: ${originalPath}`);
    }


    if (!foundImage) {
        // Raise an error if the image is not found
        throw new Error(`Image not found: ${originalPath}`);
    } else {
        unusedImages.delete(originalPath);
    }
    return foundImage
});

Handlebars.registerHelper('resolveChart', function (artist_id, blockheight, setId) {

    let foundImage;
    let originalPath
    if (setId === "full-show") {
        originalPath = `charts/${artist_id}-${blockheight}-full-show-provenance.png`;
    } else {
        originalPath = `charts/${artist_id}-${blockheight}-set-${setId}-provenance.png`;
    }
    try {
        foundImage = imageMapping[originalPath];
    } catch (e) {
        throw new Error(`Image not found: ${originalPath}`);
    }

    if (!foundImage) {
        // Raise an error if the image is not found
        throw new Error(`Image not found: ${originalPath}`);
    } else {
        unusedImages.delete(originalPath);
    }
    return foundImage
});


Handlebars.registerHelper('safeHTML', function (content) {
    return new Handlebars.SafeString(content);
});

let auxDataFile = fs.readFileSync("src/data/aux_data.yaml");
let auxData = yaml.load(auxDataFile);
let slogans = auxData["slogans"];

// Write slogans to a JSON file for use in the frontend
fs.writeFileSync(path.join(outputDir, "slogans.json"), JSON.stringify(slogans));


export default gatherAssets;
export {gatherAssets};
export {unusedImages};