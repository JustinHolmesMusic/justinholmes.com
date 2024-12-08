import { fetchDiscordVideos } from './discord_video_fetcher.js';
import { deserializeChainData } from './chaindata_db.js';

async function fetchBlueRailroadVideos() {
    const chainData = deserializeChainData();
    const { blueRailroads } = chainData;

    // Get all Discord URLs from the tokens
    const discordUrls = Object.values(blueRailroads)
        .map(token => {
            // Need to extract Discord URL from token.uri
            return token.uri;
        })
        .filter(url => url && url.includes('discordapp.com'));

    // Fetch videos
    const videos = await fetchDiscordVideos(discordUrls);
    return videos;
}

async function testFetch() {
    try {
        const videos = await fetchBlueRailroadVideos();
        console.log('Fetched videos:', videos);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testFetch();