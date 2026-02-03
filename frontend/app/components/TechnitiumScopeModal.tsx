import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle, Info, Check } from 'lucide-react';
import { DHCPScope } from '@/lib/technitium';

interface TechnitiumScopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scope: any) => Promise<void>;
    existingScope?: any;
}

export default function TechnitiumScopeModal({ isOpen, onClose, onSave, existingScope }: TechnitiumScopeModalProps) {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState<Partial<DHCPScope>>({
        name: '',
        description: '',
        enabled: true,
        startAddress: '',
        endAddress: '',
        subnetMask: '255.255.255.0',
        gateway: '',
        leaseTime: 86400, // 1 day default
        pingCheckEnabled: true,
        pingCheckTimeout: 1000,
        pingCheckRetries: 2,
        domainName: 'home',
        dnsUpdatesEnabled: true,
        dnsOverwriteDynamicLeaseEnabled: false,
        dnsTtl: 900,
        dnsServers: [], // Use this DNS server
        ntpServers: [],
        allowOnlyReservedLeaseAllocations: false,
        blockLocallyAdministeredMacAddresses: false,
        ignoreClientIdentifier: false
    });

    useEffect(() => {
        if (existingScope) {
            setFormData({ ...existingScope });
        } else {
            // Reset to defaults
            setFormData({
                name: '',
                description: '',
                enabled: true,
                startAddress: '192.168.1.100',
                endAddress: '192.168.1.200',
                subnetMask: '255.255.255.0',
                gateway: '192.168.1.1',
                leaseTime: 86400,
                pingCheckEnabled: true,
                pingCheckTimeout: 1000,
                pingCheckRetries: 2,
                domainName: 'lan',
                dnsUpdatesEnabled: true,
                dnsOverwriteDynamicLeaseEnabled: false,
                dnsTtl: 900,
                dnsServers: [],
                ntpServers: [],
                allowOnlyReservedLeaseAllocations: false,
                blockLocallyAdministeredMacAddresses: false,
                ignoreClientIdentifier: false
            });
        }
    }, [existingScope, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'dns', label: 'DNS & Domain' },
        { id: 'network', label: 'Network & Boot' },
        { id: 'advanced', label: 'Advanced' }
    ];

    const InputField = ({ label, name, type = 'text', placeholder = '', help = '' }: any) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
                type={type}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={placeholder}
                value={(formData as any)[name] || ''}
                onChange={(e) => setFormData({ ...formData, [name]: type === 'number' ? Number(e.target.value) : e.target.value })}
            />
            {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
        </div>
    );

    const Checkbox = ({ label, name, help = '' }: any) => (
        <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${(formData as any)[name] ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-gray-800'}`}>
                    {(formData as any)[name] && <Check size={14} className="text-white" />}
                </div>
                <input
                    type="checkbox"
                    className="hidden"
                    checked={(formData as any)[name] || false}
                    onChange={(e) => setFormData({ ...formData, [name]: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{label}</span>
            </label>
            {help && <p className="text-xs text-gray-500 mt-1 pl-8">{help}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white max-w-[500px] truncate">
                        {existingScope ? `Edit Scope: ${existingScope.name}` : 'Create New DHCP Scope'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-gray-800 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <InputField label="Scope Name" name="name" placeholder="Currently 'Default' is standard" help="Unique name for this scope." />
                                </div>
                                <InputField label="Starting Address" name="startAddress" placeholder="192.168.1.100" />
                                <InputField label="Ending Address" name="endAddress" placeholder="192.168.1.200" />
                                <InputField label="Subnet Mask" name="subnetMask" placeholder="255.255.255.0" />
                                <InputField label="Default Gateway" name="gateway" placeholder="192.168.1.1" />
                                <InputField label="Lease Time (seconds)" name="leaseTime" type="number" placeholder="86400" help="86400 = 1 day" />
                                <InputField label="Offer Delay (ms)" name="offerDelay" type="number" placeholder="0" help="Delay before sending DHCPOFFER." />

                                <div className="md:col-span-2 pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">Ping Check</h4>
                                    <Checkbox label="Enable Ping Check" name="pingCheckEnabled" help="Check if IP is in use before assigning." />
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField label="Timeout (ms)" name="pingCheckTimeout" type="number" />
                                        <InputField label="Retries" name="pingCheckRetries" type="number" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'dns' && (
                            <div className="space-y-6">
                                <InputField label="Domain Name" name="domainName" placeholder="home.arpa" help="Domain name assigned to clients (Option 15)." />

                                <div className="pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">DNS Updates</h4>
                                    <Checkbox label="Enable DNS Updates" name="dnsUpdatesEnabled" help="Automatically update Forward/Reverse DNS entries." />
                                    <Checkbox label="Overwrite Existing A Records" name="dnsOverwriteDynamicLeaseEnabled" help="Allow overwriting existing DNS A records." />
                                    <InputField label="DNS TTL (seconds)" name="dnsTtl" type="number" />
                                </div>

                                <div className="pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">DNS Servers</h4>
                                    <p className="text-xs text-gray-500 mb-4">Leave empty to use this server's own IP address.</p>
                                    <InputField label="Custom DNS Server IPs" name="dnsServers" placeholder="e.g. 1.1.1.1 (comma separated)" help="Option 6" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="NTP Servers" name="ntpServers" placeholder="e.g., 192.168.1.1" help="Option 42" />
                                <InputField label="Boot File Name" name="bootFileName" placeholder="pxelinux.0" help="Option 67" />
                                <InputField label="Next Server (TFTP)" name="bootstrapServerAddress" placeholder="192.168.1.50" help="Option 66 / siaddr" />
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-4">
                                <Checkbox label="Allow Only Reserved Leases" name="allowOnlyReservedLeaseAllocations" help="Block dynamic allocation for unknown clients." />
                                <Checkbox label="Block Locally Administered MACs" name="blockLocallyAdministeredMacAddresses" help="Reject randomized MAC addresses." />
                                <Checkbox label="Ignore Client Identifier" name="ignoreClientIdentifier" help="Use MAC address as identifier instead of Option 61." />
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                        <Save size={18} />
                        {existingScope ? 'Save Changes' : 'Create Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
