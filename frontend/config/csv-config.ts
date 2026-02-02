// CSV Sources Configuration
// Update these URLs to point to your GitHub-hosted CSV files

export const CSV_SOURCES = {
    // Blocklist CSV URL - Update this with your GitHub URL
    // Example format: https://raw.githubusercontent.com/USER/REPO/main/blocklists.csv
    blocklist: process.env.NEXT_PUBLIC_BLOCKLIST_CSV_URL || '',

    // Whitelist URL (AdGuard rule format)
    whitelist: process.env.NEXT_PUBLIC_WHITELIST_CSV_URL || 'https://raw.githubusercontent.com/TSFMarcel/tsf_adguard/refs/heads/main/allow_liste.txt'
};

// Fallback to local example file if no URL is configured
export function getBlocklistUrl(): string {
    return CSV_SOURCES.blocklist || '/blocklists-example.csv';
}

export function getWhitelistUrl(): string {
    return CSV_SOURCES.whitelist;
}
