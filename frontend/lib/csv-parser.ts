// CSV Parser for Filter Lists
// Supports both CSV format and AdGuard rule format

export interface FilterEntry {
    enabled: boolean;
    url: string;
    name: string;
    id: number;
}

export interface ParseResult {
    success: boolean;
    data: FilterEntry[];
    errors: string[];
}

/**
 * Fetch CSV content from a URL
 */
export async function fetchCSV(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

/**
 * Parse CSV text into FilterEntry objects
 * Supports both CSV format and AdGuard rule format (for whitelists)
 */
export function parseCSV(csvText: string): ParseResult {
    const errors: string[] = [];
    const data: FilterEntry[] = [];

    // Detect format
    const isAdGuardRules = csvText.trim().startsWith('@@') || csvText.trim().startsWith('||');

    if (isAdGuardRules) {
        // Parse AdGuard rule format (for whitelists)
        return parseAdGuardRules(csvText);
    }

    // Parse CSV format
    const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length === 0) {
        return { success: false, data: [], errors: ['CSV file is empty'] };
    }

    // Check for header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('enabled') && firstLine.includes('url') && firstLine.includes('name');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
        const lineNumber = hasHeader ? index + 2 : index + 1;

        // Skip empty lines and comments
        if (!line || line.startsWith('#') || line.startsWith('//')) {
            return;
        }

        // Parse CSV line (handle both comma and semicolon)
        const delimiter = line.includes(';') ? ';' : ',';
        const parts = line.split(delimiter).map(p => p.trim());

        if (parts.length < 3) {
            errors.push(`Line ${lineNumber}: Invalid format (expected at least 3 columns)`);
            return;
        }

        const [enabledStr, url, name, idStr] = parts;

        // Validate and parse
        const enabled = enabledStr.toLowerCase() === 'true' || enabledStr === '1';

        if (!url || !isValidUrl(url)) {
            errors.push(`Line ${lineNumber}: Invalid URL "${url}"`);
            return;
        }

        if (!name) {
            errors.push(`Line ${lineNumber}: Missing name`);
            return;
        }

        // Generate ID if not provided
        const id = idStr ? parseInt(idStr, 10) : generateId(url);
        if (isNaN(id)) {
            errors.push(`Line ${lineNumber}: Invalid ID "${idStr}"`);
            return;
        }

        data.push({ enabled, url, name, id });
    });

    return {
        success: errors.length === 0,
        data,
        errors
    };
}

/**
 * Parse AdGuard rule format (for whitelists)
 * Converts rules like "@@||domain.com^$important" to filter entries
 */
function parseAdGuardRules(rulesText: string): ParseResult {
    const errors: string[] = [];
    const data: FilterEntry[] = [];

    const lines = rulesText.split('\n').map(line => line.trim()).filter(Boolean);

    lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Skip comments
        if (line.startsWith('!') || line.startsWith('#')) {
            return;
        }

        // Extract domain from AdGuard rule
        // Formats: @@||domain.com^$important or ||domain.com^$important
        const isWhitelist = line.startsWith('@@');
        const match = line.match(/@@?\|\|([^/^$]+)/);

        if (!match) {
            errors.push(`Line ${lineNumber}: Could not parse rule "${line}"`);
            return;
        }

        const domain = match[1];
        const url = `https://${domain}`; // Convert to URL format
        const name = domain; // Use domain as name
        const id = generateId(url);

        data.push({
            enabled: true, // All rules in the file are considered enabled
            url,
            name: isWhitelist ? `Allow: ${name}` : `Block: ${name}`,
            id
        });
    });

    return {
        success: errors.length === 0,
        data,
        errors
    };
}

/**
 * Validate CSV format
 */
export function validateCSV(csvText: string): { valid: boolean; errors: string[] } {
    const result = parseCSV(csvText);
    return {
        valid: result.success && result.data.length > 0,
        errors: result.errors
    };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Generate a unique ID from a URL
 */
function generateId(url: string): number {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Fetch and parse CSV from URL in one call
 */
export async function fetchAndParseCSV(url: string): Promise<ParseResult> {
    try {
        const csvText = await fetchCSV(url);
        return parseCSV(csvText);
    } catch (error) {
        return {
            success: false,
            data: [],
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}
