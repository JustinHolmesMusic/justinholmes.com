function replacer(key, value) {
    // If the key starts with "_", return undefined
    if (key.startsWith('_')) {
        return undefined;
    }
    if (typeof value === 'bigint') {
        return value.toString();
    } else {
        return value
    }
}
export function stringify(obj) {
    return JSON.stringify(obj, replacer, 2);
}