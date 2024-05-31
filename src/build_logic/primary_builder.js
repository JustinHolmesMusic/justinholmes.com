import Handlebars from 'handlebars';
import fs from 'fs';
import * as glob from 'glob';
import {fileURLToPath} from 'url';
import yaml from 'js-yaml';
import path from 'path';
import {marked} from 'marked';
import {gatherAssets, unusedImages} from './asset_builder.js';
import {chainData} from './populate_trophy_cases.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../templates');


let pageyamlFile = fs.readFileSync("src/data/pages.yaml");
let pageyaml = yaml.load(pageyamlFile);


// TODO: Generalize this to be able to handle multiple yaml files
let ensembleyamlFile = fs.readFileSync("src/data/ensemble.yaml");
let ensembleyaml = yaml.load(ensembleyamlFile);

gatherAssets();


function getImageMapping() {
    const mappingFilePath = path.join(__dirname, '../../_prebuild_output/imageMapping.json');
    const jsonData = fs.readFileSync(mappingFilePath, {encoding: 'utf8'});
    return JSON.parse(jsonData);
}

// When preparing context for Handlebars
const imageMapping = getImageMapping();


Handlebars.registerHelper('isActive', function (currentPage, expectedPage, options) {
    return currentPage === expectedPage ? 'active' : '';
});

Handlebars.registerHelper('isEven', function (index, options) {
    return (index % 2 === 0);
});

// Make sure target directory exists
const targetDir = path.resolve(__dirname, '../../_prebuild_output');

// Check if the directory exists, if not, create it
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true});
}

// Register Partials
const partialsDir = path.resolve(templateDir, 'partials');
const partialFiles = glob.sync(`${partialsDir}/*.hbs`);
partialFiles.forEach(partialPath => {
    const partialName = path.relative(partialsDir, partialPath).replace(/\.hbs$/, '');
    const partialTemplate = fs.readFileSync(partialPath, 'utf8');
    Handlebars.registerPartial(partialName, partialTemplate);
});

Handlebars.registerHelper('link', (text, url) => {
    text = Handlebars.escapeExpression(text);
    url = Handlebars.escapeExpression(url);
    return new Handlebars.SafeString(`<a href="${url}">${text}</a>`);
});

// Define your base directories
const pageBaseDir = path.resolve(templateDir, 'pages');
const outputBaseDir = path.resolve(__dirname, '../../_prebuild_output');

// Use glob to find all .hbs files under the input directory
const pageFiles = glob.sync(`${pageBaseDir}/**/*.hbs`);

// For use in some, but perhaps not all pages (esp. if I resume a blog, etc).
const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts/base.hbs'), 'utf8'));


/////////////////
// Page iteration
//////////////////

let contextFromPageSpecificFiles = {};
Object.keys(pageyaml).forEach(page => {
    let pageInfo = pageyaml[page];
    let templateName = pageInfo["template"];
    let hbsTemplate = path.join(pageBaseDir, templateName);
    const outputFilePath = path.join(outputBaseDir, templateName).replace(/\.hbs$/, '.html');

    // See if there is a directory in data/page_specifc for this page.
    const pageSpecificDataPath = `src/data/page_specific/${page}`;
    if (fs.existsSync(pageSpecificDataPath)) {
        // Add an entry to the context for this page.
        contextFromPageSpecificFiles[page] = {};

        // Iterate through files in this directory.
        // TODO: This assumes they are md - might be useful to allow others.
        const pageSpecificFiles = fs.readdirSync(pageSpecificDataPath);

        pageSpecificFiles.forEach(file => {
            const fileContents = fs.readFileSync(path.join(pageSpecificDataPath, file), 'utf8');
            // Assume markdown for the moment.
            contextFromPageSpecificFiles[page][file.replace(/\.md$/, '')] = marked(fileContents);
        });
    }

    // Ensure the output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);

    let specified_context;

    if (pageInfo['context_from_yaml'] == true) {
        // Load specified context from yaml
        let yaml_for_this_page = fs.readFileSync(`src/data/${page}.yaml`);
        specified_context = {[page]: yaml.load(yaml_for_this_page)};
    } else {
        specified_context = pageInfo['context'];
    }

    let context = {
        ...specified_context,
        imageMapping,
        chainData,
    };


    if (contextFromPageSpecificFiles[page]) {
        context = Object.assign({}, context, contextFromPageSpecificFiles[page])
    }

    // Render the template with context (implement getContextForTemplate as needed)
    const mainBlockContent = template(context);

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});

// Warn about each unused image.
unusedImages.forEach(image => {
    console.warn(`Image not used: ${image}`);
});
