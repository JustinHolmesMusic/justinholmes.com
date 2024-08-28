import {createCanvas} from 'canvas';
import {Chart, registerables} from 'chart.js';
import {fileURLToPath} from "url";
import yaml from 'js-yaml';

Chart.register(...registerables);
Chart.defaults.color = '#fff';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesSourceDir = path.join(__dirname, '../images');
// Make a 'charts' directory in the images directory.
const chartsDir = path.join(imagesSourceDir, 'charts');
if (!fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir, {recursive: true});
}

const dataDir = path.resolve(__dirname, '../data');

// iterate through the shows directory in data, get the YAML filenames.
import path from "path";
import fs from "fs";
import {slugify} from "./utils/text_utils.js";

const showsDir = path.resolve(dataDir, 'shows');
const liveShowYAMLs = fs.readdirSync(showsDir);

// Sort liveShowYAMLs in reverse (so that most recent shows are first)..
liveShowYAMLs.sort().reverse();

let shows = {};
let songs = {};
let allSongPlays = [];
let tours = {};

// Iterate through the YAML files.
// We're going to get the show metadata and,
// FOR NOW, the list of songs, which we'll turn into a plausible future format.
let liveShowIDs = [];
for (let i = 0; i < liveShowYAMLs.length; i++) {
    let showYAML = liveShowYAMLs[i];
    let showID = showYAML.split('.')[0];
    let artistID = showID.split('-')[0];
    let blockheight = showID.split('-')[1];
    liveShowIDs.push(showID);

    // Read the YAML file
    let showYAMLFile = fs.readFileSync(path.resolve(showsDir, showYAML));
    let showYAMLData = yaml.load(showYAMLFile);

    // If show is part of a tour, add it to that tour.
    if (showYAMLData.hasOwnProperty('tour')) {
        let tour = showYAMLData['tour'];

        if (!tours.hasOwnProperty(tour)) {
            tours[tour] = [];
        }

        tours[tour].push(showID);
    }

    // This array will become an array of sets with songs formatted as we imagine they one day will be onchain.
    let sets_in_this_show = {}

    for (let [set_number, set] of Object.entries(showYAMLData['sets'])) {

        let this_set = {"songplays": {}}

        // Now we'll iterate through the songs.
        // Some of them will just be strings, while others will be objects.
        // For the strings, we'll set the default of type: normal.
        // TODO: Denest this and run it in a separate loop somewhere.
        for (let s = 0; s < set["songplays"].length; s++) {

            let songPlay = {
                artistID: artistID,
                showID: showID,
            }

            let songEntry = set["songplays"][s];

            //////
            let songName;
            if (typeof songEntry === 'string') {
                songName = songEntry;
            } else {
                songName = Object.keys(songEntry)[0]
            }

            const songSlug = slugify(songName);

            //// First let's see if we already know about this song.
            let songObject;
            if (songs.hasOwnProperty(songSlug)) {
                songObject = songs[songSlug];
            } else {
                // TODO: This is a little awkward - these oughts be separate processes, where the song object is already made somewhere else.
                songObject = {
                    "plays": [],
                    "title": songName,
                    "slug": songSlug,
                };
            }
            songObject.plays.push(songPlay);

            // Deal with the possible songplay-level properties that might be in the set YAML.
            if (typeof songEntry != 'string') {

                for (let key in songEntry) {
                    if (key === songName) {
                        continue;
                    }
                    if (key === "teases") {
                        songPlay['teases'] = [];
                        for (let tease of songEntry[key]) {
                            songPlay['teases'].push(tease);
                        }
                    } else if (key === "performance_modification") {
                        // TODO: This is such a discrete piece of song logic; feels weird to handle it in a parsing loop.
                        if (songEntry[key] === "can") {
                            // TODO: Track this?
                            songPlay["detail"] = "(around the can)";
                        } else {
                            throw new Error("Unknown performance modification: " + songEntry[key]);
                        }
                    } else if (key === "ensemble-modification") {
                        // TODO: Same - does this belong in a parsing loop?
                        if (songEntry[key] === "justin-solo") {
                            // TODO: Track this?
                            songPlay["detail"] = "(Justin Solo)";
                        } else {
                            throw new Error("Unknown performance modification: " + songEntry[key]);
                        }
                    } else if (key === "mode") {
                        songPlay['mode'] = songEntry[key];
                    } else {
                        throw new Error("Unknown key in song object: " + key);
                    }
                }
            }

            songPlay['songSlug'] = songSlug;

            songs[songObject['slug']] = songObject;

            // Add it back into the set.
            this_set["songplays"][s] = songPlay;

            // And push this songPlay to all songPlays.
            allSongPlays.push(songPlay);

            sets_in_this_show[set_number] = this_set;
        } // Songs loop (turns songs into objects)

        // All songs are now objects.  TODO: Just give shows an ID and persist them, etc.
        showYAMLData['sets'] = sets_in_this_show;
        showYAMLData['number_of_sets'] = Object.keys(sets_in_this_show).length

        // Arguably redundant, but we'll add the artist ID and blockheight to the showYAMLData.
        showYAMLData["artist_id"] = artistID;
        showYAMLData["blockheight"] = blockheight;
        shows[showID] = showYAMLData;
    } // Sets loop

} // Shows loop

////////////// Song data //////////////

// Populate objects of songYAMLData
const songYAMLFiles = fs.readdirSync(path.resolve(dataDir, 'songs_and_tunes'));

let allSongYAMLData = {};

// Iterate through the songYAMLFiles.
// We're going to get the song metadata.
for (let i = 0; i < songYAMLFiles.length; i++) {
    let songYAML = songYAMLFiles[i];
    let songSlug = songYAML.split('.')[0];

    // Read the YAML file
    let songYAMLFile = fs.readFileSync(path.resolve(dataDir, 'songs_and_tunes', songYAML));
    let songYAMLData = yaml.load(songYAMLFile);

    // Add the songYAMLData to the allSongs object.
    allSongYAMLData[songSlug] = songYAMLData;

    // Also slugify any alternate names and add them.
    if (songYAMLData.hasOwnProperty('alternate_names')) {
        for (let alt_name of songYAMLData['alternate_names']) {
            allSongYAMLData[slugify(alt_name)] = songYAMLData;
        }
    }
    // Same with primary display name.
    if (songYAMLData.hasOwnProperty('primary_display_name')) {
        allSongYAMLData[slugify(songYAMLData['primary_display_name'])] = songYAMLData;
    }
}

let songsByProvenance = {'original': [], 'traditional': [], 'cover': [], 'video_game': [], 'film': [], 'one-off': []};
let songsByArtist = {};
let songsByVideoGame = {};

// Iterate through allSongs.
// We're going to add details to the songs.
Object.entries(songs).forEach(([songSlug, songObject]) => {

    // Check to see if song slug is in the allSongYAMLData yaml data.
    if (allSongYAMLData.hasOwnProperty(songSlug)) {
        // If it is, add the songYAMLData to the songObject.
        let songYAMLData = allSongYAMLData[songSlug];

        // Append keys directly to the songObject from the YAML.
        for (let key in songYAMLData) {
            songObject[key] = songYAMLData[key];
        }

        // Note, traditionals.
        if (songYAMLData.hasOwnProperty('traditional')) {
            // TODO: Sometimes, we display songs as traditional, but influenced by a particular artist.
            // For example, we call 'circle' a "Carter Family Traditional".
            // Is this a function of the song?  Of the songplay (ie, only when we play it like they did)?
            // how do we reflect it?
            songsByProvenance['traditional'].push(songObject);
        }

        // Video game tunes.
        if (songYAMLData.hasOwnProperty('video_game')) {
            songsByProvenance['video_game'].push(songObject);
            if (!songsByVideoGame.hasOwnProperty(songYAMLData['video_game'])) {
                songsByVideoGame[songYAMLData['video_game']] = [];
            }
            songsByVideoGame[songYAMLData['video_game']].push(songObject);
        }

        // TODO Is this the place to track metrics like number of times played?
        // songYAMLData['times_played'] = allSongsPlayed[song];

    } else {
        songObject['undocumented'] = true;
    }
}); // Second songs loop.


// Iterate through songPlays and add the song details.
for (const songPlay of allSongPlays) {

    let song = songs[songPlay.songSlug];
    // Determine the provenances: original, traditional, cover, or video game tune.

    // Songs with explicit artist ID (ie, an artist already in our data ecosystem).
    if (song.hasOwnProperty('by_artist_id')) {
        if (song['by_artist_id'] === parseInt(songPlay.artistID)) {
            // The artist ID of the song is the same of the artist ID of the show.
            // Thus, this is an original.
            songPlay['provenance'] = 'original';
            songsByProvenance['original'].push(song); // TODO: This is weird - what if someone else is playing it?  Forward-incompatible with other artists.
        } else {
            // This is a cover of another cryptograss artist!  Awesome.
            // TODO: Someday we'll handle this.  But for now, we'll throw an error.
            throw new Error("Need to add support for covers of other cryptograss artists."); // TODO
        }
    }

    // Songs with explicit artist name (ie, an artist not in our data ecosystem).
    if (song.hasOwnProperty('by_artist')) {
        songPlay['provenance'] = 'cover';
        songsByProvenance['cover'].push(song); // TODO: Again, this needs to be forward-compatible with other artists using the service.  The matter of whether it's a cover depends on who is playing it.
    }

    // Sanity check: If the song has a by_artist_id, it should not have a by_artist.
    if (song.hasOwnProperty('by_artist_id') && song.hasOwnProperty('by_artist')) {
        throw new Error("Song has both by_artist_id and by_artist.  This is not allowed.");
    }

    // Now, traditionals.
    if (song.hasOwnProperty('traditional')) {
        songPlay['provenance'] = 'traditional';
    }

    // Video game tunes.
    if (song.hasOwnProperty('video_game')) {
        songPlay['provenance'] = 'video_game';
    }
    // Video game tunes.
    if (song.hasOwnProperty('film')) {
        songPlay['provenance'] = 'film';
    }
    // For now, songs that are undocumented will be considered one-offs.
    if (song.hasOwnProperty('undocumented')) {
        songPlay['provenance'] = 'one-off';
    }
} // songPlays loop

// Now, we'll go through each set again and make a chart for song provenance.
for (let [showID, show] of Object.entries(shows)) {
    let show_provenances = {'original': 0, 'traditional': 0, 'cover': 0, 'video_game': 0, 'film': 0, 'one-off': 0};
    for (let [set_number, set] of Object.entries(show['sets'])) {
        let set_provenances = {'original': 0, 'traditional': 0, 'cover': 0, 'video_game': 0, 'film': 0, 'one-off': 0};
        for (let songPlay of Object.values(set['songplays'])) {
            if (songPlay.hasOwnProperty('provenance')) {
                set_provenances[songPlay['provenance']] += 1;
                show_provenances[songPlay['provenance']] += 1;
            } else {
                throw new Error("SongPlay does not have provenance; seems like an impossible state.");
            }
        }
        //////// CHART TIME ////////
        // Set up the canvas using the canvas library
        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const data = {
            labels: ['Originals', 'Traditionals', 'Covers', 'Video Game Tunes'],
            datasets: [
                {
                    label: 'Song Breakdown',
                    data: [set_provenances['original'],
                        set_provenances['traditional'],
                        set_provenances['cover'],
                        set_provenances['video_game']],
                    backgroundColor: [
                        '#2F50D7',
                        'rgb(62,98,32)',
                        'rgb(206,159,6)',
                        'rgb(192, 4, 4)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: false, // Since we're rendering server-side, disable responsiveness
                plugins: {
                    legend: {
                        maxWidth: 100,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 38,
                            },
                            padding: 15,
                            textAlign: 'left',
                            boxWidth: 40,
                        },
                    },
                },
            },
        };
        // Render the chart using Chart.js
        const myChart = new Chart(ctx, config);


        // Save the chart as an image
        const buffer = canvas.toBuffer('image/png');
        let output_file_name = `${chartsDir}//${showID}-set-${set_number}-provenance.png`;

        fs.writeFileSync(output_file_name, buffer);
    } // Set loop

    // Now the chart for the full show.
    // Set up the canvas using the canvas library
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const data = {
        labels: ['Originals', 'Traditionals', 'Covers', 'Video Game Tunes'],
        datasets: [
            {
                label: 'Song Breakdown',
                data: [show_provenances['original'],
                    show_provenances['traditional'],
                    show_provenances['cover'],
                    show_provenances['video_game']],
                backgroundColor: [
                        '#2F50D7',
                        'rgb(62,98,32)',
                        'rgb(206,159,6)',
                        'rgb(192, 4, 4)',
                    ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: false, // Since we're rendering server-side, disable responsiveness
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 38,
                        },
                        textAlign: 'left',
                        boxWidth: 40, // Increase the box width for legend items
                    },
                },
            },
        },
    };
    // Render the chart using Chart.js
    const myChart = new Chart(ctx, config);

    // Save the chart as an image
    const buffer = canvas.toBuffer('image/png');
    let output_file_name = `${chartsDir}//${showID}-full-show-provenance.png`;

    fs.writeFileSync(output_file_name, buffer);
}


export {shows, songs, songsByVideoGame, songsByProvenance};