export function slugify(text) {
  return text
    .toString()                    // Convert to string
    .normalize('NFKD')             // Normalize to decompose combined characters
    .toLowerCase()                 // Convert to lowercase
    .trim()                        // Trim leading and trailing whitespace
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')      // Remove all non-word characters except for hyphens
    .replace(/\-\-+/g, '-');       // Replace multiple hyphens with a single hyphen
}