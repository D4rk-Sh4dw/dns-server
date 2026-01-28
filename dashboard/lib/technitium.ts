// Technitium DNS API Client
// Docs: https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md

export class TechnitiumClient {
    private baseUrl: string;
    private token: string;

    constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    async listZones() {
        // GET /api/zones/list?token=...
    }

    async addRecord(zone: string, record: any) {
        // POST /api/zones/records/add?token=...
    }
}
