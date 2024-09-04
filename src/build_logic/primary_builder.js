import {slugify} from "./utils/text_utils.js";

console.time('primary-build');
import {renderPage} from "./utils/rendering_utils.js";
import nunjucks from 'nunjucks';
import {outputBaseDir, templateDir} from "./constants.js";
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import {songs, shows, songsByProvenance, pickers} from "./show_and_set_data.js";
import {marked} from 'marked';
import {gatherAssets, unusedImages, imageMapping} from './asset_builder.js';
import {deserializeChainData, serializeChainData} from './chaindata_db.js';
import {execSync} from 'child_process';
import {generateSetStonePages, renderSetStoneImages} from './setstone_utils.js';
import {registerHelpers} from './utils/template_helpers.js';
import {appendChainDataToShows, fetch_chaindata} from './chain_reading.js';

/////////////////////////
///// Chapter one: chain data
////////////////////////////
console.time("chain-data");
const skip_chain_data_fetch = process.env.SKIP_CHAIN_DATA_FETCH
if (skip_chain_data_fetch) {
    console.log("Skipping chain data generation");
} else {
    const fetchedchainData = await fetch_chaindata(shows);
    serializeChainData(fetchedchainData);
}

let chainData

try {
    chainData = deserializeChainData();
} catch (e) {
    // If the error is that the directory wasn't found, make a suggestion.
    if (e.code === 'ENOENT' && skip_chain_data_fetch) {
        throw new Error("Chain data not found, and you're running with 'skip_chain_data_fetch'. You probably need to fetch chain data.");
    } else {
        throw e;
    }
}

console.timeEnd("chain-data");

//////////////////////////////////
///// Chapter two: assets
//////////////////////////////////
gatherAssets();


////////////////////////////////////////////////
///// Chapter three: One-off Pages
/////////////////////////////////////////////
console.time('pages-yaml-read');

////////
/// Chapter 3.1: Register helpers, partials, and context
//////

// We'll need helpers....
registerHelpers();

// ...and processed context...
appendChainDataToShows(shows, chainData); // Mutates shows.
const dataAvailableAsContext = {
    "songs": songs,
    "shows": shows,
    'songsByProvenance': songsByProvenance,
    'latest_git_commit': execSync('git rev-parse HEAD').toString().trim(),
};

// Copy client-side partials to the output directory
fs.cpSync(path.join(templateDir, 'client_partials'), path.join(outputBaseDir, 'client_partials'), {recursive: true});


////////////////////
// Chapter 3.2: Render one-off pages from YAML
///////////////////////

let pageyamlFile = fs.readFileSync("src/data/pages.yaml");
let pageyaml = yaml.load(pageyamlFile);

let contextFromPageSpecificFiles = {};
Object.keys(pageyaml).forEach(page => {
    let pageInfo = pageyaml[page];

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

    let specified_context;

    if (pageInfo['context_from_yaml'] === true) {
        // Load specified context from yaml
        let yaml_for_this_page = fs.readFileSync(`src/data/${page}.yaml`);
        specified_context = {[page]: yaml.load(yaml_for_this_page)};
    } else {
        specified_context = {};
    }

    // TODO: Why is this special?  Can't this be generalized with other data sections for context inclusion?
    if (pageInfo['include_chaindata_as_context'] !== undefined) {
        for (let chainDataSection of pageInfo['include_chaindata_as_context']) {
            specified_context[chainDataSection] = chainData[chainDataSection];
        }
    }

    if (pageInfo['include_data_in_context'] !== undefined) {
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
    const template_path = "pages/" + pageInfo["template"];
    const output_path = path.join(pageInfo["template"]).replace(/\.html$/, '.html');

    renderPage({
            template_path: template_path,
            output_path: output_path,
            context: context,
            layout: pageInfo["base_template"],
        }
    );

});

console.timeEnd('pages-yaml-read');

///////////////////////////////////////////
// Chapter 4: Factory pages (individual shows, songs, etc)  and JSON files
/////////////////////////////////////////////

// Render things that we'll need later.
generateSetStonePages(shows, path.resolve(outputBaseDir, 'setstones'));
renderSetStoneImages(shows, path.resolve(outputBaseDir, 'assets/images/setstones'));

//////////////////////
// Chapter 4.1: Show pages
////////////////////

Object.entries(shows).forEach(([show_id, show]) => {
    const page = `show_${show_id}`;

    let context = {
        page_name: page,
        page_title: show.title,
        show,
        imageMapping,
        chainData,
    };

    renderPage({
            template_path: 'reuse/single-show.html',
            output_path: `shows/${show_id}.html`,
            context: context
        }
    );

});

///////////////////////////
// Chapter 4.2: Song pages
///////////////////////////

Object.entries(songs).forEach(([song_slug, song]) => {
    const page = `song_${song_slug}`;

    let context = {
        page_name: page,
        page_title: song.title,
        song,
        imageMapping,
        chainData,
    };

    renderPage({
            template_path: 'reuse/single-song.html',
            output_path: `songs/${song_slug}.html`,
            context: context
        }
    );

});


///////////////////////////
// Chapter 4.2: Musician pages
///////////////////////////

Object.entries(pickers).forEach(([picker, picker_data]) => {

    let picker_slug = slugify(picker);

    let shows_played_by_this_picker = []
    let show_list = picker_data['shows'];
    for (let [show_id, instruments] of Object.entries(show_list)) {
        shows_played_by_this_picker.push({
            show_id,
            show: shows[show_id],
            instruments
        });
    }

    let context = {
        page_name: picker,
        page_title: picker,
        picker,
        shows_played_by_this_picker,
        imageMapping,
        chainData,
    };

    renderPage({
            template_path: 'reuse/single-picker.html',
            output_path: `pickers/${picker_slug}.html`,
            context: context
        }
    );

});



///////////////////////////
// Chapter 5: Cleanup
///////////////////////////

// Warn about each unused image.
unusedImages.forEach(image => {
    console.warn(`Image not used: ${image}`);
});

console.timeEnd('primary-build');
