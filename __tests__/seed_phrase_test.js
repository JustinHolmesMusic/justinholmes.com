import { ethers } from 'ethers';
import { findValidChecksumWords } from '../src/build_logic/seed_phrase_dice.js';
import { wordlist } from '@scure/bip39/wordlists/english';

const typical_test_phrase = "test test test test test test test test test test test junk";

describe('Seed Phrase Generation', () => {
    test('generates correct checksum for our test phrase', () => {
        const words = typical_test_phrase.split(' ');
        const first11 = words.slice(0, 11);
        const knownChecksum = words[11];
        const validChecksums = findValidChecksumWords(first11);
        expect(validChecksums).toContain('junk');
    });

    test('handles edge cases', () => {
        const edgeCases = [
            Array(11).fill(wordlist[0]),  // All 'abandon'
            Array(11).fill(wordlist[wordlist.length - 1])  // All 'zoo'
        ];

        edgeCases.forEach(words => {
            const checksum = findValidChecksumWords(words)[0];
            const fullPhrase = [...words, checksum].join(' ');
            expect(() => ethers.Wallet.fromPhrase(fullPhrase)).not.toThrow();
        });
    });

    test('throws on invalid inputs', () => {
        expect(() => findValidChecksumWords([...Array(10)].map(() => wordlist[0])))
            .toThrow('Expected 11 words; you gave me 10');

        expect(() => findValidChecksumWords([...Array(12)].map(() => wordlist[0])))
            .toThrow('Expected 11 words; you gave me 12');

        expect(() => findValidChecksumWords([...Array(11)].map(() => "notaword")))
            .toThrow('Invalid word');

        expect(() => findValidChecksumWords([...Array(11)].map(() => "")))
            .toThrow('Invalid word');
    });

    test('finds all valid checksum words for test phrase', () => {
        const testBase = Array(11).fill('test');
        const validWords = findValidChecksumWords(testBase);        
        expect(validWords.length).toBe(128);
    });
});


