import Handlebars from 'handlebars';
import {DateTime} from 'luxon';

// Reference block details
const REFERENCE_BLOCK = 20612385; // Example block number
const REFERENCE_TIMESTAMP = 1724670731; // Unix timestamp in seconds
const AVERAGE_BLOCK_TIME = 12.08; // Average block time in seconds

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


    Handlebars.registerHelper("inc", function (value, options) {
        return parseInt(value) + 1;
    });


    Handlebars.registerHelper('subtract', function (a, b) {
        return a - b;
    });

    Handlebars.registerHelper('getElement', function (array, index) {
        return array[index];
    });


    Handlebars.registerHelper('isActive', function (currentPage, expectedPage, options) {
        return currentPage === expectedPage ? 'active' : '';
    });

    Handlebars.registerHelper('isEven', function (index, options) {
        return (index % 2 === 0);
    });

    Handlebars.registerHelper('fourCycle', function (index, options) {
        return index % 4;
    });

    Handlebars.registerHelper('objectLength', function (obj) {
        return Object.keys(obj).length;
    });

// Register a custom helper to iterate two items at a time
    Handlebars.registerHelper('eachPair', function (context, options) {
        let result = '';
        for (let i = 0; i < context.length; i += 2) {
            const pair = [context[i], context[i + 1]];
            result += options.fn(pair);
        }
        return result;
    });

// New helper to truncate a string if it is longer than a threshold
    Handlebars.registerHelper('truncate', function (str, len) {
        if (str.length > len) {
            return str.substring(0, len) + '...';
        }
        return str;
    });

// Register the not-eq helper
    Handlebars.registerHelper('not-eq', function (a, b) {
        return a !== b;
    });

    Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
    });


    _helpers_are_registered = true;
}
