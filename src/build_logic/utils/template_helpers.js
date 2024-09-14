
import nunjucks from "nunjucks";
import {imageMapping, unusedImages} from "../asset_builder.js";
import {templateDir} from "../constants.js";
import {slugify} from "./text_utils.js";
import {pickers} from "../show_and_set_data.js";

const REFERENCE_BLOCK = 20612385; // Example block number
const REFERENCE_TIMESTAMP = 1724670731; // Unix timestamp in seconds
const AVERAGE_BLOCK_TIME = 12.12; // Average block time in seconds

let _helpers_are_registered = false;

let env = nunjucks.configure(templateDir, {autoescape: false});

export function registerHelpers() {

    if (_helpers_are_registered) {
        console.warn('Helpers are already registered');
        return;
    }

    env.addFilter('showInstrumentalist', function(song_play, instrument_to_show) {
        const ensemble = song_play._set._show.ensemble

        // We have the ensemble object; iterate through artists and their instruments.
        for (let [picker_name, instruments] of Object.entries(ensemble)) {
            for (let instrument_played of instruments) {
                if (instrument_played === instrument_to_show) {
                    const picker = pickers[picker_name];
                    const link_string = `<a href="${picker.resource_url}">${picker_name}</a>`
                    return link_string; // TODO: We're returning the first one we find - what if there are multiple?
                }
            }
        }
        // If we got this far, then nobody played the insrument in question on this play.
        return `No ${instrument_to_show}`;
    });

    env.addFilter('slugify', function (string_to_slugify) {
        return slugify(string_to_slugify);
    });

    env.addFilter('resolveChart', function (artist_id, blockheight, setId) {

        // Sanity check.
        if (artist_id === undefined || blockheight === undefined || setId === undefined) {
            throw new Error("resolveChart requires artist_id, blockheight, and setId");
        }

        let foundImage;
        let originalPath;
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

    _helpers_are_registered = true;
}
