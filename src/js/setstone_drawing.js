import { nesPalette } from './constants.js';

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

export function generateDiamondPatternFromNesPalette(baseColorIndex, shadowColorIndex, highlightColorIndex, backgroundColor, renderingAreaId, size = 200) {
    const colorValues = Object.values(nesPalette);
    const baseColor = colorValues[baseColorIndex];
    const shadowColor = colorValues[shadowColorIndex];
    const highlightColor = colorValues[highlightColorIndex];
    generateDiamondPattern(baseColor, shadowColor, highlightColor, backgroundColor, renderingAreaId, size);
}

// Generate diamond pattern
export function generateDiamondPattern(baseColor, shadowColor, highlightColor, backgroundColor, renderingAreaId, size = 200) {
    // Create a new canvas element in the shapeRenderingArea div
    // const  = nesPalette.brightWhite;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    // Define the size of the pixel art
    const pixelSize = Math.floor(size / 200 * 5);
    const width = canvas.width / pixelSize;
    const height = canvas.height / pixelSize;
    const ctx = canvas.getContext('2d');
    document.getElementById(renderingAreaId).appendChild(canvas);

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
