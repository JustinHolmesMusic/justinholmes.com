export function stringify(obj) {
    // Custom replacer function to handle BigInt
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2);
}