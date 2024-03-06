import Handlebars from 'handlebars';
import fs from 'fs';
import * as glob from 'glob';
import {fileURLToPath} from 'url';
import yaml from 'js-yaml';
import path from 'path';
import gatherAssets from './prebuild-assets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pageyamlFile = fs.readFileSync("pages.yaml");
let pageyaml = yaml.load(pageyamlFile);

gatherAssets();

function getImageMapping() {
    const mappingFilePath = path.join(__dirname, 'src/assets/imageMapping.json');
    const jsonData = fs.readFileSync(mappingFilePath, {encoding: 'utf8'});
    return JSON.parse(jsonData);
}

// When preparing context for Handlebars
const imageMapping = getImageMapping();


Handlebars.registerHelper('isActive', function (currentPage, expectedPage, options) {
    return currentPage === expectedPage ? 'active' : '';
});

// Make sure target directory exists
const targetDir = path.resolve(__dirname, '_prebuild_output');

// Check if the directory exists, if not, create it
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true});
}

// Register Partials
const partialsDir = path.resolve(__dirname, 'src/templates/partials');
const partialFiles = glob.sync(`${partialsDir}/*.hbs`);
partialFiles.forEach(partialPath => {
    const partialName = path.relative(partialsDir, partialPath).replace(/\.hbs$/, '');
    const partialTemplate = fs.readFileSync(partialPath, 'utf8');
    Handlebars.registerPartial(partialName, partialTemplate);
});

// Register Helpers
// Example: A simple link helper
Handlebars.registerHelper('link', (text, url) => {
    text = Handlebars.escapeExpression(text);
    url = Handlebars.escapeExpression(url);
    return new Handlebars.SafeString(`<a href="${url}">${text}</a>`);
});

//////////////////
//////////////////

// Define your base directories
const pageBaseDir = path.resolve(__dirname, 'src/pages');
const outputBaseDir = path.resolve(__dirname, '_prebuild_output');

// Use glob to find all .hbs files under the input directory
const pageFiles = glob.sync(`${pageBaseDir}/**/*.hbs`);

// For use in some, but perhaps not all pages (esp. if I resume a blog, etc).
const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'src/layouts/base.hbs'), 'utf8'));


/////////////////
// Page iteration
//////////////////
Object.keys(pageyaml).forEach(page => {
    let pageInfo = pageyaml[page];
    let templateName = pageInfo["template"];
    let hbsTemplate = path.join(pageBaseDir, templateName);
    const outputFilePath = path.join(outputBaseDir, templateName).replace(/\.hbs$/, '.html');

    // Ensure the output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);

    const context = {
        ...pageInfo['context'],
        imageMapping,
    };

    // Render the template with context (implement getContextForTemplate as needed)
    const mainBlockContent = template(context);

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});

// pageFiles.forEach(templatePath => {
//     // Compute the relative path from the input base directory
//     const relativePath = path.relative(pageBaseDir, templatePath);
//     // Replace the file extension from .hbs to .html
//     const outputFilePath = path.join(outputBaseDir, relativePath).replace(/\.hbs$/, '.html');
//     // Ensure the output directory exists
//     const outputDir = path.dirname(outputFilePath);
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir, {recursive: true});
//     }
//
//     // Load and compile the template
//     const templateSource = fs.readFileSync(templatePath, 'utf8');
//     const template = Handlebars.compile(templateSource);
//
//
//     // Render the template with context (implement getContextForTemplate as needed)
//     const mainBlockContent = template(context);
//
//     rendered_page = baseTemplate({...context, main_block: mainBlockContent})
//
//     // Write the rendered HTML to the output file path
//     fs.writeFileSync(outputFilePath, rendered_page);
// });