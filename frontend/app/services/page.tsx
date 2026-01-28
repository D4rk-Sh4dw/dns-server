export default function ServicesPage() {
    const services = [
        { name: 'Instagram', description: 'Block access to Instagram app and website', icon: '📷' },
        { name: 'TikTok', description: 'Block access to TikTok', icon: '🎵' },
        { name: 'Facebook', description: 'Block Facebook and Messenger', icon: 'fb' },
        { name: 'WhatsApp', description: 'Block WhatsApp usage', icon: '💬' },
        { name: 'YouTube', description: 'Block video streaming on YouTube', icon: '▶️' },
    ]

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Service Blocking</h1>
                <p className="text-gray-400">One-click blocking for popular applications and services.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(s => (
                    <div key={s.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">
                                {s.icon}
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{s.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-[150px]">{s.description}</p>
                            </div>
                        </div>
                        <Switch checked={false} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function Switch({ checked }: { checked: boolean }) {
    return (
        <div className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${checked ? 'bg-red-500' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </div>
    )
}
