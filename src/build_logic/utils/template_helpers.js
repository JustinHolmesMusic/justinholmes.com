import Handlebars from 'handlebars';
import { DateTime } from 'luxon';

// Reference block details
const REFERENCE_BLOCK = 20612385; // Example block number
const REFERENCE_TIMESTAMP = 1724670731; // Unix timestamp in seconds
const AVERAGE_BLOCK_TIME = 12.068; // Average block time in seconds

let _helpers_are_registered = false;

export function registerHelpers() {

    if (_helpers_are_registered) {
        console.warn('Helpers are already registered');
        return;
    }

    // Blockheight - datetime
    Handlebars.registerHelper('blockToDate', (blockHeight, timeZone) => {
        const blockDifference = blockHeight - REFERENCE_BLOCK;
        const timeDifference = blockDifference * AVERAGE_BLOCK_TIME;
        const estimatedTimestamp = REFERENCE_TIMESTAMP + timeDifference;

        // Create a Luxon DateTime object
        const date = DateTime.fromSeconds(estimatedTimestamp, {zone: timeZone});

        // Format the date as desired
        const formatted_date = date.toFormat('MMMM dd, yyyy, h:mm a'); // e.g., "January 01, 2023, 2:30:45 PM EST";
        return formatted_date;
    });

    // RnumberWithCommas
    Handlebars.registerHelper('numberWithCommas', function (number) {
        // Ensure the input is a number
        if (typeof number !== 'number') {
            number = parseFloat(number);
        }

        // Return the number formatted with commas
        return number.toLocaleString();
    });

    _helpers_are_registered = true;
}
