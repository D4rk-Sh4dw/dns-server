// AdGuard Home API Client
// Docs: https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi

export class AdGuardClient {
    private baseUrl: string;
    private auth: string;

    constructor(baseUrl: string, username?: string, password?: string) {
        this.baseUrl = baseUrl;
        // Basic Auth
        this.auth = `Basic ${btoa((username || "") + ":" + (password || ""))}`;
    }

    async getStatus() {
        // GET /control/status
    }

    async toggleSafeSearch(enabled: boolean) {
        // POST /control/safesearch/enable
    }

    async getQueryStats() {
        // GET /control/stats
    }
}
