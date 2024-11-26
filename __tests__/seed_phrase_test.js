import { ethers } from 'ethers';
import { generateChecksumWord } from '../src/build_logic/seed_phrase_dice.js';
import { wordlist } from '@scure/bip39/wordlists/english';


// Multiple known good phrases for testing
const knownGoodPhrases = [
    "announce room limb pattern dry unit scale effort smooth jazz weasel alcohol",
    // Add more known good phrases here
];

describe('Seed Phrase Generation', () => {
    test('generates correct checksum for known phrases', () => {
        knownGoodPhrases.forEach((phrase, i) => {
            const words = phrase.split(' ');
            const first11 = words.slice(0, 11);
            const knownChecksum = words[11];
            
            expect(generateChecksumWord(first11)).toBe(knownChecksum);
        });
    });

    test('handles edge cases', () => {
        const edgeCases = [
            Array(11).fill(wordlist[0]),  // All 'abandon'
            Array(11).fill(wordlist[wordlist.length-1])  // All 'zoo'
        ];

        edgeCases.forEach(words => {
            const checksum = generateChecksumWord(words);
            const fullPhrase = [...words, checksum].join(' ');
            expect(() => ethers.Wallet.fromPhrase(fullPhrase)).not.toThrow();
        });
    });

    test('throws on invalid inputs', () => {
        expect(() => generateChecksumWord([...Array(10)].map(() => wordlist[0])))
            .toThrow('Expected 11 words; you gave me 10');
        
        expect(() => generateChecksumWord([...Array(12)].map(() => wordlist[0])))
            .toThrow('Expected 11 words; you gave me 12');
        
        expect(() => generateChecksumWord([...Array(11)].map(() => "notaword")))
            .toThrow('Invalid word');
        
        expect(() => generateChecksumWord([...Array(11)].map(() => "")))
            .toThrow('Invalid word');
    });
});


