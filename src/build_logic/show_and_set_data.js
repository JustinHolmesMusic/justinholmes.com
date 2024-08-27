import {fileURLToPath} from "url";
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            songsByProvenance['original'].push(songPlay);
        } else {
            // This is a cover of another cryptograss artist!  Awesome.
            // TODO: Someday we'll handle this.  But for now, we'll throw an error.
            throw new Error("Need to add support for covers of other cryptograss artists."); // TODO
        }
    }

    // Songs with explicit artist name (ie, an artist not in our data ecosystem).
    if (song.hasOwnProperty('by_artist')) {
        songPlay['provenance'] = 'cover';
        songsByProvenance['cover'].push(songPlay);
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
} // songPlays loop


export {shows, songs};