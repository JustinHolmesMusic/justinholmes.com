// NES color palette as an object
const nesPalette = {
    grey: '#7C7C7C',
    blue: '#0000FC',
    darkBlue: '#0000BC',
    purple: '#4428BC',
    darkPurple: '#940084',
    red: '#A80020',
    orange: '#A81000',
    brown: '#881400',
    darkBrown: '#503000',
    green: '#007800',
    darkGreen: '#006800',
    darkerGreen: '#005800',
    teal: '#004058',
    black: '#000000',
    lightGrey: '#BCBCBC',
    lightBlue: '#0078F8',
    skyBlue: '#0058F8',
    violet: '#6844FC',
    pink: '#D800CC',
    hotPink: '#E40058',
    lightRed: '#F83800',
    peach: '#E45C10',
    gold: '#AC7C00',
    lightGreen: '#00B800',
    neonGreen: '#00A800',
    aquaGreen: '#00A844',
    cyan: '#008888',
    white: '#F8F8F8',
    lightCyan: '#3CBCFC',
    babyBlue: '#6888FC',
    lavender: '#9878F8',
    magenta: '#F878F8',
    rose: '#F85898',
    salmon: '#F87858',
    tangerine: '#FCA044',
    yellow: '#F8B800',
    lime: '#B8F818',
    mint: '#58D854',
    paleGreen: '#58F898',
    turquoise: '#00E8D8',
    greyBlue: '#787878',
    brightWhite: '#FCFCFC',
    powderBlue: '#A4E4FC',
    lightLavender: '#B8B8F8',
    pastelPurple: '#D8B8F8',
    palePink: '#F8B8F8',
    blush: '#F8A4C0',
    ivory: '#F0D0B0',
    cream: '#FCE0A8',
    lightYellow: '#F8D878',
    lemon: '#D8F878',
    paleMint: '#B8F8B8',
    softTurquoise: '#B8F8D8',
    electricBlue: '#00FCFC',
    lightRose: '#F8D8F8'
};

window.onload = function () {
    // Example highlight color
    const backgroundColor = nesPalette.white;  // Example background color

    // Convert hex color to RGB
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    // Blend two colors
    function blendColors(color1, color2, blendFactor) {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const r = Math.round(rgb1[0] * (1 - blendFactor) + rgb2[0] * blendFactor);
        const g = Math.round(rgb1[1] * (1 - blendFactor) + rgb2[1] * blendFactor);
        const b = Math.round(rgb1[2] * (1 - blendFactor) + rgb2[2] * blendFactor);
        return `rgb(${r},${g},${b})`;
    }

// Generate diamond pattern
export function generateDiamondPattern(baseColor, shadowColor, highlightColor, backgroundColor, renderingAreaId) {
    // Create a new canvas element in the shapeRenderingArea div
    // const  = nesPalette.brightWhite;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    // Define the size of the pixel art
    const pixelSize = 5;
    const width = canvas.width / pixelSize;
    const height = canvas.height / pixelSize;
    const ctx = canvas.getContext('2d');
    document.getElementById(renderingAreaId).appendChild(canvas);

    // Define the size of the diamond
    const diamondSize = 20; // Adjust this value to change the diamond size
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
        // Define the size of the diamond
        const diamondSize = 20; // Adjust this value to change the diamond size
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate the offset positions
            const offsetX = Math.abs(x - centerX);
            const offsetY = Math.abs(y - centerY);
            const distanceFromCenter = offsetX + offsetY;

            // Set the base color for the diamond
            let color = backgroundColor;

            if (distanceFromCenter < diamondSize) {
                const blendFactor = (diamondSize - distanceFromCenter) / diamondSize;
                // Add highlight on the top-left and bottom-right
                if ((x + y) % (2 * diamondSize) < diamondSize) {
                    color = blendColors(baseColor, highlightColor, blendFactor);
                }
                // Add shadow on the bottom-left and top-right
                else {
                    color = blendColors(baseColor, shadowColor, blendFactor);
                }
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}



// Initial generation
// generateDiamondPattern(nesPalette.yellow, nesPalette.cream, nesPalette.brightWhite);
// generateDiamondPattern(nesPalette.hotPink, nesPalette.palePink, nesPalette.brightWhite);
// generateDiamondPattern(nesPalette.green, nesPalette.brightWhite, nesPalette.cream);
// generateDiamondPattern(nesPalette.peach, nesPalette.black, nesPalette.purple);
// generateDiamondPattern(nesPalette.blue, nesPalette.babyBlue, nesPalette.brightWhite);
// generateDiamondPattern(nesPalette.hotPink, nesPalette.palePink, nesPalette.lightRed);
// generateDiamondPattern(nesPalette.red, nesPalette.orange, nesPalette.yellow);
// generateDiamondPattern(nesPalette.purple, nesPalette.lavender, nesPalette.brightWhite);
// generateDiamondPattern(nesPalette.teal, nesPalette.lightBlue, nesPalette.brightWhite);

window.onload = function () {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');

    // Define the size of each pixel and the canvas dimensions
    const pixelSize = 3;
    const width = canvas.width / pixelSize;
    const height = canvas.height / pixelSize;

    const numberColors = {
        background: nesPalette.black,
        foreground: nesPalette.white
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

    function drawNumber(number, startX, startY) {
        console.log('Drawing number', number);
        const pattern = numbers[number];

        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                ctx.fillStyle = pattern[y][x] === '1' ? numberColors.foreground : numberColors.background;
                ctx.fillRect((startX + x) * pixelSize, (startY + y) * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    // Fill the background
    ctx.fillStyle = numberColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the numbers 0-9
    for (let i = 0; i < 9; i++) {
        drawNumber(i, i * 9, 0);  // 9 is used to leave a gap between the numbers
    }
};

