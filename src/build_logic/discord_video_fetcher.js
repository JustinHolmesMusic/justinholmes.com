import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fetchedVideosDir } from './constants.js';

dotenv.config();

function parseDiscordUrl(url) {
    // Discord URLs format: https://discord.com/channels/SERVER_ID/CHANNEL_ID/MESSAGE_ID
    const parts = url.split('/');
    return {
        serverId: parts[parts.length - 3],
        channelId: parts[parts.length - 2],
        messageId: parts[parts.length - 1]
    };
}

async function downloadVideo(videoUrl, outputPath) {
    const response = await fetch(videoUrl);
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
}

export async function fetchDiscordVideos(messageUrls) {
    const client = new Client({
        intents: [
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
        ]
    });

    try {
        await client.login(process.env.DISCORD_BOT_TOKEN);

        const videos = [];

        for (const url of messageUrls) {
            const { channelId, messageId } = parseDiscordUrl(url);
            const videoFileName = `${messageId}.mp4`;
            const videoPath = path.join(fetchedVideosDir, videoFileName);

            // Check if we already have this video
            if (fs.existsSync(videoPath)) {
                videos.push({
                    originalUrl: url,
                    localPath: videoPath,
                    fileName: videoFileName
                });
                continue;
            }
            let message;
            let videoAttachment;

            try {
                const channel = await client.channels.fetch(channelId);
                message = await channel.messages.fetch(messageId);

                videoAttachment = message.attachments.find(
                    attachment => attachment.contentType?.startsWith('video/')
                );

            } catch (messageError) {
                console.warn(`Failed to fetch message from ${url}:`, messageError);
                continue;
            }
            try {
                if (videoAttachment) {
                    await downloadVideo(videoAttachment.url, videoPath);
                    videos.push({
                        originalUrl: url,
                        localPath: videoPath,
                        fileName: videoFileName,
                        timestamp: message.createdTimestamp
                    });
                } else {
                    console.warn(`No video found in message ${url}`);
                    continue;
                }
            } catch (messageError) {
                console.warn(`Found message, but had problems fetching video from ${url}:`, messageError);
            }
        }

        await client.destroy();
        return videos;
    } catch (error) {
        console.error('Error fetching Discord videos:', error);
        throw error;
    }
}