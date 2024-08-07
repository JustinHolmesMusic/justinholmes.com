import fs from 'fs';
import path from 'path';
import { generateDiamondPatternFromNesPalette } from '../js/setstone_drawing.js'

/**
 * Generates and saves NFT metadata JSON files for each setstone in the shows.
 * @param {Object} showsWithChainData - Object containing show data with chain information.
 * @param {string} outputDir - Directory to save the generated JSON files.
 */
export function generateSetStoneMetadataJsons(showsWithChainData, outputDir) {
    Object.entries(showsWithChainData).forEach(([showId, show]) => {
        Object.entries(show.sets).forEach(([setNumber, set]) => {
            set.setstones.forEach((setstone, setstoneNumber) => {

                const metadata = {
                    name: `Set Stone for show ${showId}`,
                    external_url: `https://justinholmes.com/cryptograss/bazaar/setstones/${showId}.html`,
                    description: `Set Stone from artist with id=${show.artist_id} and show on ${show.blockheight}`,
                    image: `https://justinholmes.com/assets/images/setstones/${set.shape}-${setstone.color[0]}-${setstone.color[1]}-${setstone.color[2]}.png`, 
                    attributes: [
                        {
                            trait_type: "Shape",
                            value: set.shape
                        },
                        {
                            trait_type: "Color 1",
                            value: setstone.color[0]
                        },
                        {
                            trait_type: "Color 2",
                            value: setstone.color[1]
                        },
                        {
                            trait_type: "Color 3",
                            value: setstone.color[2]
                        }
                    ]

                };

                const fileName = `${setstone.tokenId}`;
                const filePath = path.join(outputDir, fileName);

                fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            });
        });
    });
}


export function renderSetStoneImages(showsWithChainData, outputDir) {
    // create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    Object.entries(showsWithChainData).forEach(([showId, show]) => {
        Object.entries(show.sets).forEach(([setNumber, set]) => {
            set.setstones.forEach((setstone, setstoneNumber) => {
                const canvas = generateDiamondPatternFromNesPalette(setstone.color[0], setstone.color[1], setstone.color[2], "transparent", null, 1000);
                const buffer = canvas.toBuffer('image/png');
                // const fileName = `${set.shape}-${setstone.color[0]}-${setstone.color[1]}-${setstone.color[2]}.png`;
                const fileName = `${setstone.tokenId}.png`;
                const filePath = path.join(outputDir, fileName);
                fs.writeFileSync(filePath, buffer);
            });
        });
    });
}