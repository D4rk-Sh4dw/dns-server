# CSV-Based Filter Lists - Setup Guide

## Overview

The DNS Server Dashboard now supports loading filter lists from CSV files hosted on GitHub. This allows you to manage hundreds of blocklists and whitelists in a centralized CSV file instead of hardcoding them.

## Features

✅ **Load from GitHub CSV** - Automatically fetch and parse filter lists from GitHub  
✅ **Manual CSV Import** - Upload your own CSV files directly in the UI  
✅ **Search & Filter** - Quickly find lists with the search function  
✅ **Fallback Support** - Uses hardcoded lists if CSV fetch fails  
✅ **AdGuard Rule Format** - Supports both CSV and AdGuard rule formats  

## CSV Format

### Blocklist CSV Format

```csv
enabled,url,name,id
true,https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt,AdGuard DNS filter,1
true,https://adaway.org/hosts.txt,AdAway Default Blocklist,2
false,https://example.com/optional-list.txt,Optional List,3
```

**Columns:**
- `enabled` (boolean): `true` or `false` - suggested default state
- `url` (string): Full URL to the filter list
- `name` (string): Display name for the list
- `id` (number): Unique identifier

### Whitelist Format

The whitelist can use either CSV format (same as above) or AdGuard rule format:

```
@@||widgets.trustedshops.com^$important
@@||apple.com^$important
@@||api.segment.io^$important
```

## Setup Instructions

### Step 1: Upload Your Blocklist CSV to GitHub

1. Create a new repository or use an existing one
2. Upload the `blocklists-example.csv` file (located in `frontend/public/`)
3. Get the raw GitHub URL, for example:
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/blocklists.csv
   ```

### Step 2: Configure the CSV URL

**Option A: Environment Variable (Recommended)**

Add to your `.env` or `.env.local` file:

```bash
NEXT_PUBLIC_BLOCKLIST_CSV_URL=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/blocklists.csv
NEXT_PUBLIC_WHITELIST_CSV_URL=https://raw.githubusercontent.com/TSFMarcel/tsf_adguard/refs/heads/main/allow_liste.txt
```

**Option B: Edit Config File**

Edit `frontend/config/csv-config.ts`:

```typescript
export const CSV_SOURCES = {
  blocklist: 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/blocklists.csv',
  whitelist: 'https://raw.githubusercontent.com/TSFMarcel/tsf_adguard/refs/heads/main/allow_liste.txt'
};
```

### Step 3: Restart the Frontend

```bash
cd frontend
npm run dev
```

## Usage

### Browse Predefined Lists

1. Navigate to **Filtering & Blocklists** page
2. Click **"Browse Predefined"** button (in either Blocklists or Whitelists section)
3. Wait for lists to load from GitHub
4. Use the search box to filter lists
5. Click **"Select"** on any list to add it

### Import Custom CSV

1. Click **"Browse Predefined"**
2. Click **"Import CSV"** button
3. Select your CSV file
4. Lists will be added to the current view
5. Select the ones you want to enable

## Example CSV File

An example CSV file with 200+ blocklists has been created at:
```
frontend/public/blocklists-example.csv
```

This file contains all the lists from your YAML configuration.

## Troubleshooting

### Lists Not Loading

- Check browser console for errors
- Verify the GitHub URL is accessible (try opening it in a browser)
- Check that the CSV format is correct
- The system will fall back to hardcoded lists if CSV fetch fails

### Import Fails

- Ensure CSV has the correct format (header row required)
- Check that URLs are valid (must start with http:// or https://)
- Look for error details in the alert message

### Cache Issues

The CSV is cached for 1 hour. To force a refresh:
- Restart the frontend server
- Or wait 1 hour for cache to expire

## Advanced: Custom CSV Sources

You can create your own CSV files with custom filter lists:

1. Create a CSV file with the required format
2. Upload to GitHub (or any public URL)
3. Configure the URL in `csv-config.ts` or environment variables
4. Restart the frontend

## Notes

- The whitelist URL is already configured to use your GitHub repository
- The blocklist CSV URL defaults to the local example file until you configure it
- All CSV data is cached for 1 hour to reduce GitHub API requests
- The parser supports both CSV and AdGuard rule formats automatically
