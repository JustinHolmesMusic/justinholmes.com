import fs from 'fs';
import path from 'path';
import {generateDiamondPatternFromNesPalette} from '../js/setstone_drawing.js'
import {renderPage} from "./utils/rendering_utils.js";
import {imageMapping} from "./asset_builder.js";
import {nesPalette} from "../js/constants.js";

/**
 * Generates and saves NFT metadata JSON files for each setstone in the shows.
 * @param {Object} showsWithChainData - Object containing show data with chain information.
 * @param {string} outputDir - Directory to save the generated JSON files.
 */
export function generateSetStonePages(shows, outputDir) {
    for (const [showId, show] of Object.entries(shows)) {
        // We're only interested in shows that have set stones.
        if (!show.has_set_stones_available) {
            continue;
        }

        Object.entries(show.sets).forEach(([setNumber, set]) => {
            set.setstones.forEach((setstone, setstoneNumber) => {

                ////////////////
                // metadata JSON for NFT
                ////////////////
                const metadata = {
                    name: `Set Stone for show ${showId}`,

                    // TODO: Does this become the show page?
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

                fs.mkdirSync(path.dirname(filePath), {recursive: true});
                fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

                ////////////////////////
                /// Set Stone Profile Page
                /////////////////////////

                const NEScolorNames = Object.keys(nesPalette)
                const setstoneColornames = `${NEScolorNames[setstone.color[0]]}, ${NEScolorNames[setstone.color[1]]}, ${NEScolorNames[setstone.color[2]]}` // TODO: Modeling, WWDD
                let context = {
                    show: show,
                    set: set,
                    setstone: setstone,
                    colors: setstoneColornames,
                    imageMapping,
                };
                const outputPath = `/artifacts/setstones/${showId}-${setstone.tokenId}.html`;
                setstone.resource_url = outputPath;
                renderPage({
                        template_path: 'reuse/single-set-stone.html',
                        output_path: outputPath,
                        context: context
                    }
                );
            });
        });
    };
}


export function renderSetStoneImages(shows, outputDir) {
    // create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    for (const [showId, show] of Object.entries(shows)) {
        // We're only interested in shows that have set stones.
        if (!show.has_set_stones_available) {
            continue;
        }   

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
    };
}