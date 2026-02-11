import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle, Info, Check } from 'lucide-react';
import { DHCPScope } from '@/lib/technitium';
import { useTranslation } from '@/lib/i18n-context';

interface TechnitiumScopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scope: any) => Promise<void>;
    existingScope?: any;
}

const InputField = ({ label, name, type = 'text', placeholder = '', help = '', value, onChange }: any) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
        />
        {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
);

const Checkbox = ({ label, name, help = '', checked, onChange }: any) => (
    <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-gray-800'}`}>
                {checked && <Check size={14} className="text-white" />}
            </div>
            <input
                type="checkbox"
                className="hidden"
                checked={checked || false}
                onChange={(e) => onChange(name, e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{label}</span>
        </label>
        {help && <p className="text-xs text-gray-500 mt-1 pl-8">{help}</p>}
    </div>
);

export default function TechnitiumScopeModal({ isOpen, onClose, onSave, existingScope }: TechnitiumScopeModalProps) {
    const { t } = useTranslation();
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

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const tabs = [
        { id: 'general', label: t('dhcp.tab_general') },
        { id: 'dns', label: t('dhcp.tab_dns') },
        { id: 'network', label: t('dhcp.tab_network') },
        { id: 'advanced', label: t('dhcp.tab_advanced') }
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white max-w-[500px] truncate">
                        {existingScope ? t('dhcp.scope_modal_title_edit', [existingScope.name]) : t('dhcp.scope_modal_title_create')}
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
                                    <InputField label={t('dhcp.scope_name')} name="name" placeholder={t('dhcp.scope_name_placeholder')} help={t('dhcp.scope_name_help')} value={formData.name} onChange={handleChange} />
                                </div>
                                <InputField label={t('dhcp.start_ip')} name="startAddress" placeholder="192.168.1.100" value={formData.startAddress} onChange={handleChange} />
                                <InputField label={t('dhcp.end_ip')} name="endAddress" placeholder="192.168.1.200" value={formData.endAddress} onChange={handleChange} />
                                <InputField label={t('dhcp.mask')} name="subnetMask" placeholder="255.255.255.0" value={formData.subnetMask} onChange={handleChange} />
                                <InputField label={t('dhcp.gateway')} name="gateway" placeholder="192.168.1.1" value={formData.gateway} onChange={handleChange} />
                                <InputField label={t('dhcp.lease_time')} name="leaseTime" type="number" placeholder="86400" help={t('dhcp.lease_time_help')} value={formData.leaseTime} onChange={handleChange} />
                                <InputField label={t('dhcp.offer_delay')} name="offerDelay" type="number" placeholder="0" help={t('dhcp.offer_delay_help')} value={formData.offerDelay} onChange={handleChange} />

                                <div className="md:col-span-2 pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">{t('dhcp.ping_check')}</h4>
                                    <Checkbox label={t('dhcp.enable_ping_check')} name="pingCheckEnabled" help={t('dhcp.ping_check_help')} checked={formData.pingCheckEnabled} onChange={handleChange} />
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField label={t('dhcp.timeout')} name="pingCheckTimeout" type="number" value={formData.pingCheckTimeout} onChange={handleChange} />
                                        <InputField label={t('dhcp.retries')} name="pingCheckRetries" type="number" value={formData.pingCheckRetries} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'dns' && (
                            <div className="space-y-6">
                                <InputField label={t('dhcp.domain_name')} name="domainName" placeholder="home.arpa" help={t('dhcp.domain_name_help')} value={formData.domainName} onChange={handleChange} />

                                <div className="pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">{t('dhcp.dns_updates')}</h4>
                                    <Checkbox label={t('dhcp.enable_dns_updates')} name="dnsUpdatesEnabled" help={t('dhcp.dns_updates_help')} checked={formData.dnsUpdatesEnabled} onChange={handleChange} />
                                    <Checkbox label={t('dhcp.overwrite_records')} name="dnsOverwriteDynamicLeaseEnabled" help={t('dhcp.overwrite_records_help')} checked={formData.dnsOverwriteDynamicLeaseEnabled} onChange={handleChange} />
                                    <InputField label="DNS TTL (seconds)" name="dnsTtl" type="number" value={formData.dnsTtl} onChange={handleChange} />
                                </div>

                                <div className="pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-4">{t('dhcp.dns_servers')}</h4>
                                    <p className="text-xs text-gray-500 mb-4">{t('dhcp.dns_servers_help')}</p>
                                    <InputField label={t('dhcp.custom_dns')} name="dnsServers" placeholder={t('dhcp.dns_servers_placeholder')} help={t('dhcp.dns_servers_input_help')} value={formData.dnsServers} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label={t('dhcp.ntp_servers')} name="ntpServers" placeholder="e.g., 192.168.1.1" help={t('dhcp.ntp_servers_help')} value={formData.ntpServers} onChange={handleChange} />
                                <InputField label={t('dhcp.boot_file')} name="bootFileName" placeholder="pxelinux.0" help={t('dhcp.boot_file_help')} value={formData.bootFileName} onChange={handleChange} />
                                <InputField label={t('dhcp.next_server')} name="bootstrapServerAddress" placeholder="192.168.1.50" help={t('dhcp.next_server_help')} value={formData.bootstrapServerAddress} onChange={handleChange} />
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-4">
                                <Checkbox label={t('dhcp.reserved_only')} name="allowOnlyReservedLeaseAllocations" help={t('dhcp.reserved_only_help')} checked={formData.allowOnlyReservedLeaseAllocations} onChange={handleChange} />
                                <Checkbox label={t('dhcp.block_macs')} name="blockLocallyAdministeredMacAddresses" help={t('dhcp.block_macs_help')} checked={formData.blockLocallyAdministeredMacAddresses} onChange={handleChange} />
                                <Checkbox label={t('dhcp.ignore_client_id')} name="ignoreClientIdentifier" help={t('dhcp.ignore_client_id_help')} checked={formData.ignoreClientIdentifier} onChange={handleChange} />
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                        <Save size={18} />
                        {existingScope ? t('common.save_changes') : t('dhcp.create_scope')}
                    </button>
                </div>
            </div>
        </div>
    );
}
