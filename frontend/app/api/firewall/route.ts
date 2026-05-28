import { NextResponse } from 'next/server';
import * as adguard from '@/lib/adguard';

// GET /api/firewall
// Returns all DNS rules: conditional forwarding + rewrites
export async function GET() {
    try {
        const [dnsInfo, rewrites, clients] = await Promise.all([
            adguard.getDnsConfig(),
            adguard.getRewrites().catch(() => []),
            adguard.getClients().catch(() => []),
        ]);

        // Parse conditional forwarding rules from upstream_dns
        const upstreams: string[] = dnsInfo.upstream_dns || [];
        const forwardRules = [];

        for (let i = 0; i < upstreams.length; i++) {
            const upstream = upstreams[i];
            // Check if it's a conditional forwarding rule: [/${domain}/]server1 server2
            const match = upstream.match(/^\[\/(.+?)\/\](.+)$/);
            if (match) {
                const domains = match[1].split('/').filter(Boolean);
                const servers = match[2].trim().split(/\s+/);
                forwardRules.push({
                    id: `fwd_${i}`,
                    type: 'forward',
                    domains,
                    servers,
                    raw: upstream,
                    index: i,
                });
            }
        }

        // Parse rewrites
        const rewriteRules = (rewrites || []).map((r: any, idx: number) => ({
            id: `rw_${idx}`,
            type: 'rewrite',
            domain: r.domain,
            answer: r.answer,
            recordType: r.type || 'A',
        }));

        // Parse client-specific upstreams
        const clientRules = (clients || [])
            .filter((c: any) => c.upstreams && c.upstreams.length > 0)
            .map((c: any, idx: number) => ({
                id: `client_${idx}`,
                type: 'client',
                clientName: c.name,
                clientIds: c.ids || [],
                servers: c.upstreams,
            }));

        return NextResponse.json({
            forwardRules,
            rewriteRules,
            clientRules,
            upstreams,
        });
    } catch (error) {
        console.error('Firewall API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch firewall rules' },
            { status: 500 }
        );
    }
}

// POST /api/firewall
// Actions: addForward, removeForward, addRewrite, removeRewrite, reorder, simulate
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'addForward': {
                const { domains, servers } = body;
                if (!domains?.length || !servers?.length) {
                    return NextResponse.json(
                        { error: 'Domains and servers are required' },
                        { status: 400 }
                    );
                }
                const domainStr = domains.join('/');
                const serverStr = servers.join(' ');
                const rule = `[/${domainStr}/]${serverStr}`;

                const dnsInfo = await adguard.getDnsConfig();
                const currentUpstreams: string[] = dnsInfo.upstream_dns || [];

                // Add at the beginning (highest priority)
                const newUpstreams = [rule, ...currentUpstreams];
                await adguard.updateDnsConfig({ upstream_dns: newUpstreams });

                return NextResponse.json({ success: true, rule });
            }

            case 'removeForward': {
                const { index } = body;
                const dnsInfo = await adguard.getDnsConfig();
                const currentUpstreams: string[] = [...(dnsInfo.upstream_dns || [])];

                if (index >= 0 && index < currentUpstreams.length) {
                    currentUpstreams.splice(index, 1);
                    await adguard.updateDnsConfig({ upstream_dns: currentUpstreams });
                }

                return NextResponse.json({ success: true });
            }

            case 'reorder': {
                const { rules } = body;
                if (!Array.isArray(rules)) {
                    return NextResponse.json(
                        { error: 'Rules array is required' },
                        { status: 400 }
                    );
                }
                await adguard.updateDnsConfig({ upstream_dns: rules });
                return NextResponse.json({ success: true });
            }

            case 'addRewrite': {
                const { domain, answer, type } = body;
                if (!domain || !answer) {
                    return NextResponse.json(
                        { error: 'Domain and answer are required' },
                        { status: 400 }
                    );
                }
                await adguard.addRewrite(domain, answer, type || 'A');
                return NextResponse.json({ success: true });
            }

            case 'removeRewrite': {
                const { domain, answer, type } = body;
                await adguard.deleteRewrite(domain, answer, type || 'A');
                return NextResponse.json({ success: true });
            }

            case 'simulate': {
                const { domain } = body;
                if (!domain) {
                    return NextResponse.json(
                        { error: 'Domain is required' },
                        { status: 400 }
                    );
                }
                const result = await adguard.checkHost(domain);
                return NextResponse.json({ success: true, result });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Firewall API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
