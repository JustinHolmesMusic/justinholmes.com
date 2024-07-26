import { generateDiamondPattern, nesPalette, setstoneColors } from '../../shapes.js';

function displaySetStoneColorPalette() {

    Object.entries(setstoneColors).forEach(([index, color]) => {
        console.log(index, " color: ", nesPalette[color[0]], nesPalette[color[1]], nesPalette[color[2]]);

        const div = document.createElement('div');
        const innerDiv = document.createElement('div');
        innerDiv.id = `stoneRender-${index}`;
        div.appendChild(innerDiv);

        const h3 = document.createElement('h3');
        h3.textContent = `Color ${index}`;
        innerDiv.appendChild(h3);
        // append another div

        document.getElementById("shapeRenderingArea").appendChild(innerDiv);
        generateDiamondPattern(nesPalette[color[0]], nesPalette[color[1]], nesPalette[color[2]], innerDiv.id);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displaySetStoneColorPalette();
});