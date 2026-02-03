'use client';

import { useState } from 'react';
import { Layers, Shield, Globe } from 'lucide-react';

export default function AdvancedPage() {
    const [activeTab, setActiveTab] = useState<'adguard' | 'technitium'>('adguard');

    return (
        <div className="flex flex-col h-full bg-black text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="text-purple-500" />
                        Advanced Access
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Direct access to underlying DNS service interfaces. Use with caution.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setActiveTab('adguard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'adguard'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <Shield size={16} />
                        AdGuard Home
                    </button>
                    <button
                        onClick={() => setActiveTab('technitium')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'technitium'
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <Globe size={16} />
                        Technitium DNS
                    </button>
                </div>
            </div>

            {/* Content Area - Full height iframe */}
            <div className="flex-1 relative overflow-hidden bg-white">
                {activeTab === 'adguard' && (
                    <iframe
                        src="/adguard/"
                        title="AdGuard Home"
                        className="absolute inset-0 w-full h-full border-0"
                        allow="clipboard-write"
                    />
                )}

                {activeTab === 'technitium' && (
                    <iframe
                        src="/technitium/"
                        title="Technitium DNS"
                        className="absolute inset-0 w-full h-full border-0"
                        allow="clipboard-write"
                    />
                )}
            </div>
        </div>
    );
}
