import { fetchDiscordVideos } from './discord_video_fetcher.js';

// Test URL - replace with an actual Discord message URL from your server
const testUrls = [
    'https://discord.com/channels/1126841404056948806/1126841404056948809/1202000078152138752'
];

async function testFetch() {
    try {
        const videos = await fetchDiscordVideos(testUrls);
        console.log('Fetched videos:', videos);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testFetch();