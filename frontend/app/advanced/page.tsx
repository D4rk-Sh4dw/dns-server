'use client';

import { useState } from 'react';
import { Layers, Shield, Globe } from 'lucide-react';
import PageLayout, { PageHeader } from '../components/PageLayout';

export default function AdvancedPage() {
    const [activeTab, setActiveTab] = useState<'adguard' | 'technitium'>('adguard');

    return (
        <PageLayout
            flush
            noHeaderBorder
            header={
                <PageHeader
                    icon={<Layers className="text-purple-500" size={22} />}
                    title="Advanced Access"
                    subtitle="Direct access to underlying DNS service interfaces. Use with caution."
                    actions={
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
                    }
                />
            }
        >
            <div className="relative w-full h-full bg-white">
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
        </PageLayout>
    );
}
