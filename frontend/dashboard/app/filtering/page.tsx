export default function FilteringPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Filtering & Blocklists</h1>
                <p className="text-gray-400">Manage global blocking rules and AdGuard blocklists.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Global Switches</h3>
                <div className="flex items-center justify-between py-4 border-b border-gray-800">
                    <div>
                        <div className="text-white font-medium">Safe Search</div>
                        <div className="text-sm text-gray-500">Enforce safe search on Google, Bing, and YouTube</div>
                    </div>
                    <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <div className="text-white font-medium">Phishing Protection</div>
                        <div className="text-sm text-gray-500">Block domains known for phishing and malware</div>
                    </div>
                    <Switch checked={true} />
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white">Blocklists</h3>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Add Blocklist
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Name</th>
                            <th className="px-4 py-3">URL</th>
                            <th className="px-4 py-3">Rules</th>
                            <th className="px-4 py-3 rounded-r-lg">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        <tr className="text-sm">
                            <td className="px-4 py-4 text-white font-medium">AdGuard DNS filter</td>
                            <td className="px-4 py-4 text-gray-500 truncate max-w-xs">https://adguardteam.github.io/Hostlists/AdGuardDNSFilter.txt</td>
                            <td className="px-4 py-4 text-gray-400">45,201</td>
                            <td className="px-4 py-4 text-green-400">Enabled</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function Switch({ checked }: { checked: boolean }) {
    return (
        <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </div>
    )
}
