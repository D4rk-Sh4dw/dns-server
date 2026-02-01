export const PREDEFINED_BLOCKLISTS = [
    {
        name: "AdGuard DNS Filter",
        url: "https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt",
        description: "AdGuard's official filter that blocks ads, tracking, and phishing."
    },
    {
        name: "AdAway Default Blocklist",
        url: "https://adguardteam.github.io/HostlistsRegistry/assets/filter_2.txt",
        description: "Mobile-focused blocklist from the AdAway project."
    },
    {
        name: "Steven Black's Unified Hosts",
        url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
        description: "Consolidated hosts from multiple well-curated sources."
    },
    {
        name: "OISD Basic",
        url: "https://abp.oisd.nl/basic/",
        description: "A very well maintained, high quality blocklist (Basic version)."
    },
    {
        name: "Peter Lowe's List",
        url: "https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext",
        description: "Classic list focusing on adservers and trackers."
    }
];

export const PREDEFINED_WHITELISTS = [
    {
        name: "Official AdGuard Whitelist",
        url: "https://adguardteam.github.io/HostlistsRegistry/assets/filter_22.txt",
        description: "Commonly false-positive domains that should be unblocked."
    },
    {
        name: "Anudeep's Whitelist",
        url: "https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/whitelist.txt",
        description: "Comprehensive whitelist to prevent breakage of common services."
    }
];
