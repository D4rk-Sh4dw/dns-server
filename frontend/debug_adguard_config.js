// const { getDnsConfig, setDnsConfig } = require('./lib/adguard');

// Mock fetch for node environment if needed, or rely on existing implementation if it works in node
// Since the project uses next.js, the lib files might use 'fetch' which is available in Node 18+

async function debugAdGuard() {
    console.log('--- Fetching Current Config ---');
    try {
        const config = await getDnsConfig();
        console.log('Current Config Keys:', Object.keys(config));
        console.log('use_private_ptr_resolvers:', config.use_private_ptr_resolvers);
        console.log('local_ptr_upstreams:', config.local_ptr_upstreams);
        console.log('resolve_clients:', config.resolve_clients);

        console.log('\n--- Attempting Update ---');
        const update = {
            use_private_ptr_resolvers: true,
            local_ptr_upstreams: ['172.25.0.101']
        };
        console.log('Sending update:', update);

        // We'll simulate what updateDnsConfig does: merge and send
        // But for this test let's just try to send these specific fields mixed with current config
        // to see if the API accepts them.

        // Note: verify_backup_paths.js was deleted so I can't rely on it being there.
        // I need to make sure I can import the lib. 
        // Since it's TS, I can't run it directly with node unless I use ts-node or compile.
        // I will write this as a small JS script that mimics the fetch calls directly to avoid TS complexity.

    } catch (e) {
        console.error('Error:', e);
    }
}

// Re-writing as pure JS with fetch for simplicity in running
const ADGUARD_URL = 'http://127.0.0.1:3000'; // Assuming dashboard port, wait, adguard is on 3000? NO.
// docker-compose says:
// adguard: ports 3001:3000/tcp. Internal 3000.
// Dashboard is 3000.
// AdGuard container is dns-adguard.
// From HOST machine (where I run this script via agent), AdGuard is at localhost:3001
const URL = 'http://127.0.0.1:3001';
const USER = 'admin';
const PASS = 'admin123';

const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');

async function run() {
    try {
        console.log(`Connecting to ${URL}...`);

        // 1. GET Config
        const res = await fetch(`${URL}/control/dns_info`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!res.ok) throw new Error(`GET failed: ${res.status} ${await res.text()}`);
        const config = await res.json();

        console.log('--- Current Config State ---');
        console.log('use_private_ptr_resolvers:', config.use_private_ptr_resolvers);
        console.log('resolve_clients:', config.resolve_clients);
        console.log('local_ptr_upstreams:', config.local_ptr_upstreams);

        // 2. PUT Config Update
        console.log('\n--- Attempting to Enable ---');
        // Construct body compatible with what we think logic is
        const newBody = {
            ...config, // Send everything back
            use_private_ptr_resolvers: true,
            local_ptr_upstreams: ['172.25.0.101'],
            resolve_clients: true
        };

        const updateRes = await fetch(`${URL}/control/dns_config`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBody)
        });

        if (!updateRes.ok) throw new Error(`UPDATE failed: ${updateRes.status} ${await updateRes.text()}`);
        console.log('Update Success.');

        // 3. Verify
        const verifyRes = await fetch(`${URL}/control/dns_info`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        const verifyConfig = await verifyRes.json();

        console.log('\n--- Config After Update ---');
        console.log('use_private_ptr_resolvers:', verifyConfig.use_private_ptr_resolvers);
        console.log('resolve_clients:', verifyConfig.resolve_clients);
        console.log('local_ptr_upstreams:', verifyConfig.local_ptr_upstreams);

        if (verifyConfig.use_private_ptr_resolvers !== true) {
            console.error('FAIL: use_private_ptr_resolvers did not persist!');
        } else {
            console.log('PASS: use_private_ptr_resolvers persisted.');
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

run();
