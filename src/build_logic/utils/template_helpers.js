import {DateTime} from 'luxon';
import nunjucks from "nunjucks";
import {imageMapping, unusedImages} from "../asset_builder.js";
import {templateDir} from "../constants.js";

const REFERENCE_BLOCK = 20612385; // Example block number
const REFERENCE_TIMESTAMP = 1724670731; // Unix timestamp in seconds
const AVERAGE_BLOCK_TIME = 12.08; // Average block time in seconds

let _helpers_are_registered = false;

let env = nunjucks.configure(templateDir, {autoescape: false});

export function registerHelpers() {

    if (_helpers_are_registered) {
        console.warn('Helpers are already registered');
        return;
    }

    // Blockheight - datetime
    env.addFilter('blockToDate', (blockHeight, timeZone) => {
        const blockDifference = blockHeight - REFERENCE_BLOCK;
        const timeDifference = blockDifference * AVERAGE_BLOCK_TIME;
        const estimatedTimestamp = REFERENCE_TIMESTAMP + timeDifference;

        // Create a Luxon DateTime object
        const date = DateTime.fromSeconds(estimatedTimestamp, {zone: timeZone});

        // Format the date as desired
        const formatted_date = date.toFormat('MMMM dd, yyyy, h:mm a'); // e.g., "January 01, 2023, 2:30:45 PM EST";
        return formatted_date;
    });


    env.addFilter('resolveChart', function (artist_id, blockheight, setId) {

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

    _helpers_are_registered = true;
}
