import { jest } from '@jest/globals';
import { Collection } from 'discord.js';

const mockFs = {
    existsSync: jest.fn(() => false),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn()
};

const mockMessage = {
    attachments: new Collection([
        ['video', { url: 'http://example.com/video.mp4', contentType: 'video/mp4' }]
    ]),
    createdTimestamp: Date.now()
};

const mockChannel = {
    messages: {
        fetch: jest.fn(() => Promise.resolve(mockMessage))
    }
};

const mockClient = {
    login: jest.fn(),
    channels: {
        fetch: jest.fn(() => Promise.resolve(mockChannel))
    },
    destroy: jest.fn()
};

jest.unstable_mockModule('fs', () => ({
    default: mockFs
}));

jest.unstable_mockModule('discord.js', () => ({
    Client: jest.fn(() => mockClient),
    GatewayIntentBits: {
        MessageContent: 1,
        Guilds: 2,
        GuildMessages: 3
    }
}));

jest.unstable_mockModule('node-fetch', () => ({
    default: jest.fn(() => Promise.resolve({
        buffer: () => Promise.resolve(Buffer.from('video data'))
    }))
}));

// Import AFTER mocking
const { fetchDiscordVideos } = await import('../src/build_logic/discord_video_fetcher.js');

describe('Discord Video Fetcher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('downloads new video if not exists', async () => {
        const testUrl = 'https://discord.com/channels/server/channel/message';

        await fetchDiscordVideos([testUrl]);

        expect(mockFs.existsSync).toHaveBeenCalled();
        expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
});