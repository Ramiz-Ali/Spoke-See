// Default list of words to filter
const DEFAULT_FILTERED_WORDS: { [key: string]: string } = {
  // Add your default word mappings here
  "darn": "oh my",
  "gosh": "goodness",
  "heck": "oh dear",
};

// Function to escape special characters in strings for regex
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Create a regex pattern for matching whole words only
const createWordBoundaryPattern = (word: string) => {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
};

export const filterText = (
  text: string,
  customReplacements: { word: string; replacement: string }[],
  mode: 'replace' | 'censor' = 'replace'
): string => {
  // Combine default and custom replacements
  const allReplacements = {
    ...DEFAULT_FILTERED_WORDS,
    ...Object.fromEntries(customReplacements.map(({ word, replacement }) => [word, replacement]))
  };

  let filteredText = text;

  // Process each word
  Object.entries(allReplacements).forEach(([word, replacement]) => {
    const pattern = createWordBoundaryPattern(word);
    
    if (mode === 'censor') {
      // Replace with asterisks matching the word length
      filteredText = filteredText.replace(pattern, '*'.repeat(word.length));
    } else {
      // Replace with the specified replacement
      filteredText = filteredText.replace(pattern, replacement);
    }
  });

  return filteredText;
};