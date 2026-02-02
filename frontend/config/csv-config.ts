// CSV Sources Configuration
// Update these URLs to point to your GitHub-hosted CSV files

export const CSV_SOURCES = {
    // Blocklist CSV URL - Update this with your GitHub URL
    blocklist: process.env.NEXT_PUBLIC_BLOCKLIST_CSV_URL || '',

    // Whitelist CSV URL - Update this with your GitHub URL
    whitelist: process.env.NEXT_PUBLIC_WHITELIST_CSV_URL || ''
};

// Fallback to local example file if no URL is configured
export function getBlocklistUrl(): string {
    return CSV_SOURCES.blocklist || '/blocklists-example.csv';
}

export function getWhitelistUrl(): string {
    return CSV_SOURCES.whitelist || '/whitelists-example.csv';
}

