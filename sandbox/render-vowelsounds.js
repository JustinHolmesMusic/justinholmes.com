import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';


// Function to render the image
async function renderImage(canvas, ctx) {
    const img_path = "../src/images/albums/vowel-sounds-cover-art-800.png";

        const img = await loadImage(img_path);

        // Calculate the scaling factor to fit the image within the canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Calculate the position to center the image on the canvas
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        // Draw the image on the canvas
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        console.log('Image loaded and drawn');

        // Save the canvas as a PNG file
        saveCanvas(canvas, 'vowel-sounds-cover-art-800');
}

function saveCanvas(canvas, name) {
    const buffer = canvas.toBuffer('image/png');
    const fileName = `${name}.png`;
    fs.writeFileSync(fileName, buffer);
    console.log(`Image saved as ${fileName}`);
}


function drawNumber(number, startX, startY, ctx) {

    console.log('Drawing number', number);
    const pattern = numbers[number];


    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            // ctx.fillStyle = pattern[y][x] === '1' ? numberColors.foreground : numberColors.background;
            if (pattern[y][x] === '1') {
                ctx.fillStyle = numberColors.foreground;
                ctx.fillRect((startX + x) * pixelSize, (startY + y) * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

    // Define the size of each pixel and the canvas dimensions

const numberColors = {
    background: "#000000",
    foreground: "#FF5050"
};

    // Pixel art for numbers 0-9 using an 8x8 grid
const numbers = [
    [
        "00111100",
        "01000010",
        "01000110",
        "01001010",
        "01010010",
        "01100010",
        "01000010",
        "00111100"
    ],
    [
        "00011000",
        "00111000",
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "00000010",
        "00000100",
        "00001000",
        "00010000",
        "00100000",
        "01111110"
    ],
    [
        "00111100",
        "01000010",
        "00000010",
        "00011100",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ],
    [
        "00000100",
        "00001100",
        "00010100",
        "00100100",
        "01000100",
        "01111110",
        "00000100",
        "00000100"
    ],
    [
        "01111110",
        "01000000",
        "01000000",
        "01111100",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "01000000",
        "01111100",
        "01000010",
        "01000010",
        "01000010",
        "00111100"
    ],
    [
        "01111110",
        "00000010",
        "00000100",
        "00001000",
        "00010000",
        "00100000",
        "00100000",
        "00100000"
    ],
    [
        "00111100",
        "01000010",
        "01000010",
        "00111100",
        "01000010",
        "01000010",
        "01000010",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "01000010",
        "00111110",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ]
];


// Fill the background

// Create a canvas
const width = 800;
const height = 800;
const pixelSize = 36;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
ctx.fillStyle = numberColors.background;
ctx.fillRect(0, 0, canvas.width, canvas.height);
const pixelWidth = canvas.width / pixelSize;
const pixelHeight = canvas.height / pixelSize;


const spaceBetweenNumbers = 9;

// Draw the numbers 0-9
// for (let i = 0; i < 9; i++) {
    // drawNumber(i, i * spaceBetweenNumbers, 0, ctx);  // 9 is used to leave a gap between the numbers
// }

saveCanvas(canvas, 'vowel-sounds-cover-art-800');

// Function to draw a two-digit number
function drawTwoDigitNumber(number, startX, startY, ctx) {
    const tens = Math.floor(number / 10);
    const ones = number % 10;
    drawNumber(tens, startX, startY, ctx);
    drawNumber(ones, startX + 7, startY, ctx);  // 9 is used to leave a gap between the digits
}

// Loop to render numbers 10 to 20
for (let i = 11; i <= 29; i++) {
    // Clear the canvas
    ctx.fillStyle = numberColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the image
    await renderImage(canvas, ctx);

    // Draw the number in the middle of the canvas
    let startX = Math.floor((canvas.width / pixelSize - 16) / 2);  // 16 is the width of two digits
    let startY = Math.floor((canvas.height / pixelSize - 8) / 2);  // 8 is the height of the digits

    // startY += 10;
    // Function to draw a shadow for a single digit
    function drawNumberShadow(number, startX, startY, ctx) {
        const pattern = numbers[number];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black for shadow

        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (pattern[y][x] === '1') {
                    ctx.fillRect((startX + x + 1) * pixelSize, (startY + y + 1) * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }

    // Function to draw a shadow for a two-digit number
    function drawTwoDigitNumberShadow(number, startX, startY, ctx) {
        const tens = Math.floor(number / 10);
        const ones = number % 10;
        drawNumberShadow(tens, startX, startY, ctx);
        drawNumberShadow(ones, startX + 7, startY, ctx);
    }

    // Draw the shadow before drawing the actual number
    drawTwoDigitNumberShadow(i, startX, startY, ctx);


    drawTwoDigitNumber(i, startX, startY, ctx);

    // Save the canvas with the number
    saveCanvas(canvas, `vowel-sounds-cover-art-${i}`);
}