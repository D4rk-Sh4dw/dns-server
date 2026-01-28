import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function ZonesPage() {
    const zones = [
        { name: 'lan.local', type: 'Primary', records: 12, serial: '2023102701' },
        { name: 'iot.local', type: 'Primary', records: 45, serial: '2023102705' },
        { name: '10.in-addr.arpa', type: 'Primary', records: 8, serial: '2023102701' },
    ]

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Authoritative Zones</h1>
                    <p className="text-gray-400">Manage local DNS zones via Technitium.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Plus size={18} />
                    Create Zone
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950/50">
                        <tr>
                            <th className="px-6 py-4">Zone Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Serial</th>
                            <th className="px-6 py-4">Records</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {zones.map(z => (
                            <tr key={z.name} className="group hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 text-white font-medium">
                                    <Link href={`/zones/${z.name}`} className="hover:text-blue-400 hover:underline">
                                        {z.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{z.type}</td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{z.serial}</td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{z.records} records</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-4">Edit</button>
                                    <button className="text-red-400 hover:text-red-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
