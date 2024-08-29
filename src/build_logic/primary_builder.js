import Handlebars from 'handlebars';
import fs from 'fs';
import * as glob from 'glob';
import {fileURLToPath} from 'url';
import yaml from 'js-yaml';
import path from 'path';
import {songs, songsByProvenance} from "./show_and_set_data.js";
import {marked} from 'marked';
import {gatherAssets, unusedImages} from './asset_builder.js';
import {deserializeChainData} from './chaindata_db.js';
import {execSync} from 'child_process';
import {generateSetStoneMetadataJsons, renderSetStoneImages} from './setstone_utils.js';
import {registerHelpers} from './utils/template_helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.resolve(__dirname, '../templates');

const chainData = deserializeChainData();
const dataAvailableAsContext = {"songs": songs, 'songsByProvenance': songsByProvenance};

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

///// Helpers
/////////////
registerHelpers();

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
        const pageSpecificFiles = fs.readdirSync(pageSpecificDataPath);

        pageSpecificFiles.forEach(file => {
            const fileContents = fs.readFileSync(path.join(pageSpecificDataPath, file), 'utf8');

            // If it's markdown, render it with marked.
            if (file.endsWith('.md')) {
                contextFromPageSpecificFiles[page][file.replace(/\.md$/, '')] = marked(fileContents);
            }
            // If it's yaml, load it as yaml.
            if (file.endsWith('.yaml')) {
                contextFromPageSpecificFiles[page][file.replace(/\.yaml$/, '')] = yaml.load(fileContents);
            }
            // TODO: Handle failure case if there are two files with the same name but different extensions.

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
        specified_context = {};
    }

    if (pageInfo['include_chaindata_as_context'] != undefined) {
        for (let chainDataSection of pageInfo['include_chaindata_as_context']) {
            specified_context[chainDataSection] = chainData[chainDataSection];
        }
    }

    if (pageInfo['include_data_in_context'] != undefined) {
        for (let dataSection of pageInfo['include_data_in_context']) {
            let dataSectionToInclude = dataAvailableAsContext[dataSection];
            if (dataSectionToInclude === undefined) {
                throw new Error(`Data section ${dataSection} requested for page ${page} but not found in dataAvailableAsContext.`);
            }
            specified_context[dataSection] = dataSectionToInclude;
        }
    }

    let context = {
        page_name: page,
        ...pageInfo['context'],
        ...specified_context,
        imageMapping,
        chainData,
    };

    if (contextFromPageSpecificFiles[page]) {
        context = Object.assign({}, context, contextFromPageSpecificFiles[page])
    }

    // Render the template with context (implement getContextForTemplate as needed)
    const mainBlockContent = template(context);

    let baseTemplateName = pageInfo["base_template"];
    if (baseTemplateName === undefined) {
        baseTemplateName = 'base.hbs';
    }
    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', baseTemplateName), 'utf8'));

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});


// Copy client-side partials to the output directory
fs.cpSync(path.join(templateDir, 'client_partials'), path.join(outputBaseDir, 'partials'), {recursive: true});


////////////////////////////////////////////////////////
/// Render Show pages, including set stone minting    //
////////////////////////////////////////////////////////

// for every show in chainData, render a page

Object.entries(chainData.showsWithChainData).forEach(([show_id, show]) => {
    const page = `show_${show_id}`;
    const outputFilePath = path.join(outputBaseDir, `shows/${show_id}.html`);

    const hbsTemplate = path.join(templateDir, 'reuse/single-show.hbs');

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);


    let context = {
        page_name: page,
        page_title: show.title,
        show,
        imageMapping,
        chainData,
    };  

    // console.log(context);

    // Add latest git commit to context.
    context['_latest_git_commit'] = execSync('git rev-parse HEAD').toString().trim();

    // Render the template with context
    const mainBlockContent = template(context);

    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', 'base.hbs'), 'utf8'));


    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});

// Same for each song (one page per).
Object.entries(songs).forEach(([song_slug, song]) => {
    const page = `song_${song_slug}`;
    const outputFilePath = path.join(outputBaseDir, `songs/${song_slug}.html`);

    const hbsTemplate = path.join(templateDir, 'reuse/single-song.hbs');

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);


    let context = {
        page_name: page,
        page_title: song.name,
        shows: chainData.showsWithChainData,
        song,
        imageMapping,
        chainData,
    };

    // Render the template with context
    const mainBlockContent = template(context);
    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', 'base.hbs'), 'utf8'));

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});




// Generate set stone metadata json files.
generateSetStoneMetadataJsons(chainData.showsWithChainData, path.resolve(__dirname, '../../_prebuild_output/setstones'));
renderSetStoneImages(chainData.showsWithChainData, path.resolve(__dirname, '../../_prebuild_output/assets/images/setstones'));


// Warn about each unused image.
unusedImages.forEach(image => {
    console.warn(`Image not used: ${image}`);
});