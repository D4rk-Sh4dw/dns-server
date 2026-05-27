export type Language = 'en' | 'de';

export type TranslationKeys =
    | 'overview.title'
    | 'nav.overview'
    | 'nav.adguard_controls'
    | 'nav.filtering'
    | 'nav.forwarding'
    | 'nav.service_blocking'
    | 'nav.client_management'
    | 'nav.query_log'
    | 'nav.technitium_controls'
    | 'nav.zones_records'
    | 'nav.system'
    | 'nav.dhcp'
    | 'nav.advanced'
    | 'nav.settings'
    | 'user.admin'
    | 'user.logout'
    | 'app.title'
    | 'settings.title'
    | 'settings.subtitle'
    | 'settings.system_status'
    | 'settings.refresh'
    | 'settings.adguard'
    | 'settings.adguard_desc'
    | 'settings.connected'
    | 'settings.error'
    | 'settings.technitium'
    | 'settings.technitium_desc'
    | 'settings.dhcp'
    | 'settings.dhcp_desc'
    | 'settings.active'
    | 'settings.waiting'
    | 'settings.backup_restore'
    | 'settings.export_config'
    | 'settings.export_desc'
    | 'settings.download_backup'
    | 'settings.import_config'
    | 'settings.import_desc'
    | 'settings.warning'
    | 'settings.select_file'
    | 'dashboard.title'
    | 'dashboard.subtitle'
    | 'dashboard.total_queries'
    | 'dashboard.threats_blocked'
    | 'dashboard.protection'
    | 'dashboard.performance'
    | 'dashboard.last_24h'
    | 'dashboard.blocked'
    | 'dashboard.active'
    | 'dashboard.disabled'
    | 'dashboard.status_ok'
    | 'dashboard.status_error'
    | 'dashboard.avg_time'
    | 'dashboard.dns_traffic'
    | 'dashboard.queries_per_hour'
    | 'dashboard.top_queried'
    | 'dashboard.top_blocked'
    | 'dashboard.top_clients'
    | 'dashboard.infra_status'
    | 'dashboard.operational'
    | 'dashboard.disconnected'
    | 'dashboard.primary_dns'
    | 'dashboard.recursive_resolver'
    | 'dashboard.dashboard_api'
    | 'dashboard.no_records'
    | 'dashboard.unknown'
    | 'dashboard.upstream_response_times'
    | 'dashboard.upstream_server'
    | 'dashboard.upstream_avg_time'
    | 'dashboard.upstream_queries'
    | 'dashboard.ms'
    // Filtering
    | 'filtering.title'
    | 'filtering.subtitle'
    | 'filtering.global_rules'
    | 'filtering.client_rules'
    | 'filtering.protection_settings'
    | 'filtering.dns_protection'
    | 'filtering.dns_protection_desc'
    | 'filtering.parental_control'
    | 'filtering.parental_control_desc'
    | 'filtering.safe_browsing'
    | 'filtering.safe_browsing_desc'
    | 'filtering.safe_search'
    | 'filtering.safe_search_desc'
    | 'filtering.global_custom_rules'
    | 'filtering.global_custom_rules_desc'
    | 'filtering.add_rule'
    | 'filtering.syntax_examples'
    | 'filtering.filter_blocklists'
    | 'filtering.filter_blocklists_desc'
    | 'filtering.allow_whitelists'
    | 'filtering.allow_whitelists_desc'
    | 'filtering.refresh_lists'
    | 'filtering.browse_predefined'
    | 'filtering.import_csv'
    | 'filtering.add_list'
    | 'filtering.add_whitelist'
    | 'filtering.add_blocklist'
    | 'filtering.edit_list'
    | 'filtering.name'
    | 'filtering.url'
    | 'filtering.cancel'
    | 'filtering.add'
    | 'filtering.save'
    | 'filtering.add_custom_rule'
    | 'filtering.browse_whitelists'
    | 'filtering.browse_blocklists'
    | 'filtering.search_lists'
    | 'filtering.select_all_available'
    | 'filtering.deselect_all'
    | 'filtering.loading_lists'
    | 'filtering.failed_load_csv'
    | 'filtering.showing_fallback'
    | 'filtering.added'
    | 'filtering.select'
    | 'filtering.selected'
    | 'filtering.no_results'
    | 'filtering.lists_selected'
    | 'filtering.clear_selection'
    | 'filtering.add_selected_lists'
    | 'filtering.adding'
    | 'filtering.upload_csv_desc'
    | 'filtering.click_upload'
    | 'filtering.drag_drop'
    | 'filtering.supports_csv'
    | 'filtering.parsing_csv'
    | 'filtering.found_lists'
    | 'filtering.selected_import'
    | 'filtering.select_all'
    | 'filtering.upload_different'
    | 'filtering.import_lists'
    | 'filtering.client_selector_label'
    | 'filtering.choose_client'
    | 'filtering.configure_new_client'
    | 'filtering.new_client_desc'
    | 'filtering.client_name'
    | 'filtering.ip_address'
    | 'filtering.mac_address'
    | 'filtering.create_client'
    | 'filtering.blocked_domains'
    | 'filtering.blocked_domains_desc'
    | 'filtering.allowed_domains'
    | 'filtering.allowed_domains_desc'
    | 'filtering.no_blocked_domains'
    | 'filtering.no_allowed_domains'
    | 'filtering.select_client_msg'
    | 'filtering.temporarily_disable'
    | 'filtering.stay_off'
    | 'filtering.protection_paused'
    | 'filtering.enable_now'
    | 'filtering.configured_clients'
    | 'filtering.recognized_devices'
    | 'filtering.no_clients_found'
    | 'filtering.suggested'
    | 'filtering.optional'
    | 'filtering.failed_pause_timer'
    | 'filtering.failed_update_protection'
    | 'filtering.action_failed'
    // Forwarding
    | 'forwarding.title'
    | 'forwarding.subtitle'
    | 'forwarding.adguard_upstreams'
    | 'forwarding.adguard_upstreams_desc'
    | 'forwarding.save_changes'
    | 'forwarding.predefined_providers'
    | 'forwarding.ip_or_url'
    | 'forwarding.upstream_placeholder'
    | 'forwarding.no_upstreams'
    | 'forwarding.save_upstream_error'
    | 'forwarding.fetch_data_error'
    | 'forwarding.technitium_zones'
    | 'forwarding.technitium_zones_desc'
    | 'forwarding.technitium_controls'
    | 'forwarding.domain_zone'
    | 'forwarding.type'
    | 'forwarding.target_forwarder'
    | 'forwarding.status'
    | 'forwarding.managed_by'
    | 'forwarding.ad_domain'
    | 'forwarding.technitium_zone'
    | 'forwarding.local'
    | 'forwarding.no_zones'
    // Services
    | 'services.title'
    | 'services.subtitle'
    | 'services.pause_blocking'
    | 'services.time_zone'
    | 'services.start_time'
    | 'services.end_time'
    | 'services.days'
    | 'services.save_schedule'
    | 'services.saving'
    | 'services.schedule_saved'
    | 'services.blocked_services'
    | 'services.filter_services'
    | 'services.no_services_found'
    // Clients
    | 'clients.title'
    | 'clients.subtitle'
    | 'clients.add_client'
    | 'clients.search_placeholder'
    | 'clients.failed_load'
    | 'clients.no_clients'
    | 'clients.edit_client'
    | 'clients.add_new_client'
    | 'clients.basic_info'
    | 'clients.client_name'
    | 'clients.identifiers'
    | 'clients.tags'
    | 'clients.protection_settings'
    | 'clients.global_settings'
    | 'clients.use_global'
    | 'clients.dns_filtering'
    | 'clients.safe_browsing'
    | 'clients.parental_control'
    | 'clients.safe_search'
    | 'clients.whitelist'
    | 'clients.whitelist_desc'
    | 'clients.no_whitelist'
    | 'clients.create_first'
    | 'clients.blocklist'
    | 'clients.blocklist_desc'
    | 'clients.no_blocklist'
    | 'clients.blocked_services'
    | 'clients.blocked_services_desc'
    | 'clients.use_global_blocked'
    | 'clients.use_global_blocked_desc'
    | 'clients.block_all'
    | 'clients.unblock_all'
    | 'clients.delete_client'
    | 'clients.delete_confirm'
    // Logs
    | 'logs.title'
    | 'logs.subtitle'
    | 'logs.clear_logs'
    | 'logs.clear_confirm'
    | 'logs.search_placeholder'
    | 'logs.all_queries'
    | 'logs.blocked'
    | 'logs.blocked_services'
    | 'logs.blocked_threats'
    | 'logs.blocked_parental'
    | 'logs.processed'
    | 'logs.filtered'
    | 'logs.rewritten'
    | 'logs.safe_search'
    | 'logs.time'
    | 'logs.status'
    | 'logs.client'
    | 'logs.domain'
    | 'logs.answer_upstream'
    | 'logs.no_logs'
    | 'logs.load_more'
    | 'logs.client_details'
    | 'logs.ip_address'
    | 'logs.hostname'
    | 'logs.proto'
    | 'logs.response_info'
    | 'logs.whitelist_global'
    | 'logs.block_global'
    | 'logs.elapsed'
    | 'logs.upstream'
    | 'logs.client_operations'
    | 'logs.unconfigured_client'
    | 'logs.no_client_ip'
    | 'logs.create_client'
    | 'logs.create_client_desc'
    | 'logs.detected_hostname'
    | 'logs.select_client'
    | 'logs.block_client'
    | 'logs.whitelist_client'
    | 'logs.question'
    | 'logs.matched_rules'
    | 'logs.list_id'
    | 'logs.answer'
    | 'logs.type'
    | 'logs.value'
    | 'logs.ttl'
    | 'logs.view_json'
    // Zones
    | 'zones.title'
    | 'zones.subtitle'
    | 'zones.search_placeholder'
    | 'zones.reset_cache'
    | 'zones.refresh'
    | 'zones.add_zone'
    | 'zones.error'
    | 'zones.zone_domain'
    | 'zones.type'
    | 'zones.target'
    | 'zones.status'
    | 'zones.actions'
    | 'zones.active_directory'
    | 'zones.reverse_dns'
    | 'zones.primary'
    | 'zones.internal'
    | 'zones.active'
    | 'zones.pending'
    | 'zones.delete_zone_confirm'
    | 'zones.delete_ad_confirm'
    | 'zones.no_zones_match'
    | 'zones.no_zones_configured'
    | 'zones.loading'
    | 'zones.add_dns_zone'
    | 'zones.custom_zone'
    | 'zones.custom_zone_desc'
    | 'zones.ad_domain'
    | 'zones.ad_domain_desc'
    | 'zones.reverse_dns_desc'
    | 'zones.ad_domain_name'
    | 'zones.subnet'
    | 'zones.zone_name'
    | 'zones.will_create_zone'
    | 'zones.dc_ips'
    | 'zones.dc_ips_desc'
    | 'zones.zone_type'
    | 'zones.upstream_provider'
    | 'zones.select_provider'
    | 'zones.forwarder_ip'
    | 'zones.protocol'
    | 'zones.forwarder_desc'
    | 'zones.ad_mode_desc'
    | 'zones.custom_mode_desc'
    | 'zones.conditional_forwarder_desc'
    | 'zones.manual_records_desc'
    | 'zones.forwarding_notice'
    | 'zones.creating'
    | 'zones.add_ad_domain'
    | 'zones.create_zone'
    | 'zones.cache_cleared'
    | 'zones.cache_clear_error'
    | 'zones.cache_clear_confirm'
    | 'zones.enter_dc_ip'
    | 'zones.enter_forwarder_ip'
    | 'zones.failed_create'
    | 'zones.failed_delete'
    | 'zones.technitium_docker'
    | 'zones.technitium_docker'
    // DHCP
    | 'dhcp.title'
    | 'dhcp.subtitle'
    | 'dhcp.technitium_leases'
    | 'dhcp.adguard_dhcp'
    | 'dhcp.opnsense_discovery'
    | 'dhcp.create_scope'
    | 'dhcp.static_lease'
    | 'dhcp.ip_range'
    | 'dhcp.gateway'
    | 'dhcp.mask'
    | 'dhcp.dns_servers'
    | 'dhcp.lease_time'
    | 'dhcp.active_leases'
    | 'dhcp.available'
    | 'dhcp.hostname'
    | 'dhcp.ip'
    | 'dhcp.mac'
    | 'dhcp.type'
    | 'dhcp.expires'
    | 'dhcp.actions'
    | 'dhcp.unknown'
    | 'dhcp.no_leases'
    | 'dhcp.opnsense_no_leases'
    | 'dhcp.opnsense_not_configured'
    | 'dhcp.add_static'
    | 'dhcp.scope_name'
    | 'dhcp.start_ip'
    | 'dhcp.end_ip'
    | 'dhcp.description'
    | 'dhcp.enable_scope'
    | 'dhcp.disable_scope'
    | 'dhcp.delete_scope'
    | 'dhcp.scope_modal_title_create'
    | 'dhcp.scope_modal_title_edit'
    | 'dhcp.tab_general'
    | 'dhcp.tab_dns'
    | 'dhcp.tab_network'
    | 'dhcp.tab_advanced'
    | 'dhcp.ping_check'
    | 'dhcp.enable_ping_check'
    | 'dhcp.timeout'
    | 'dhcp.retries'
    | 'dhcp.domain_name'
    | 'dhcp.dns_updates'
    | 'dhcp.enable_dns_updates'
    | 'dhcp.overwrite_records'
    | 'dhcp.ntp_servers'
    | 'dhcp.boot_file'
    | 'dhcp.next_server'
    | 'dhcp.reserved_only'
    | 'dhcp.block_macs'
    | 'dhcp.ignore_client_id'
    | 'dhcp.delete_scope_confirm'
    | 'dhcp.delete_lease_confirm'
    | 'dhcp.offer_delay'
    | 'dhcp.custom_dns'
    | 'dhcp.create_first_scope'
    | 'dhcp.create_first_scope_desc'
    | 'dhcp.adguard_status'
    | 'dhcp.server_disabled'
    | 'dhcp.enable_dhcp_desc'
    | 'dhcp.sync_dns'
    | 'dhcp.no_description'
    | 'dhcp.scope_name_placeholder'
    | 'dhcp.scope_name_help'
    | 'dhcp.lease_time_help'
    | 'dhcp.offer_delay_help'
    | 'dhcp.ping_check_help'
    | 'dhcp.domain_name_help'
    | 'dhcp.dns_updates_help'
    | 'dhcp.overwrite_records_help'
    | 'dhcp.dns_servers_help'
    | 'dhcp.dns_servers_placeholder'
    | 'dhcp.dns_servers_input_help'
    | 'dhcp.ntp_servers_help'
    | 'dhcp.boot_file_help'
    | 'dhcp.next_server_help'
    | 'dhcp.reserved_only_help'
    | 'dhcp.block_macs_help'
    | 'dhcp.ignore_client_id_help'
    // Common
    | 'common.save_changes'
    | 'common.error'
    | 'common.cancel'
    | 'common.add'
    | 'common.save'
    | 'common.delete'
    | 'common.retry'
    | 'common.loading'
    | 'common.optional';

export const translations: Record<Language, Record<string, string>> = {
    en: {
        'app.title': 'UnifiedDNS',
        'overview.title': 'Overview',
        'nav.overview': 'Overview',
        'nav.adguard_controls': 'AdGuard Controls',
        'nav.filtering': 'Filtering & Blocklists',
        'nav.forwarding': 'Forwarding / Zones',
        'nav.service_blocking': 'Service Blocking',
        'nav.client_management': 'Client Management',
        'nav.query_log': 'Query Log',
        'nav.technitium_controls': 'Technitium Controls',
        'nav.zones_records': 'Zones & Records',
        'nav.system': 'System',
        'nav.dhcp': 'DHCP Server',
        'nav.advanced': 'Advanced Access',
        'nav.settings': 'Settings',
        'user.admin': 'Admin User',
        'user.logout': 'Log Out',
        'settings.title': 'System Settings',
        'settings.subtitle': 'Manage global configurations and integrations.',
        'settings.system_status': 'System Status',
        'settings.refresh': 'Refresh Status',
        'settings.adguard': 'AdGuard Home',
        'settings.adguard_desc': 'Recursive DNS & Filtering',
        'settings.connected': 'Connected',
        'settings.error': 'Error',
        'settings.technitium': 'Technitium DNS',
        'settings.technitium_desc': 'Authoritative DNS',
        'settings.dhcp': 'DHCP Server',
        'settings.dhcp_desc': 'Technitium DHCP',
        'settings.active': 'Active',
        'settings.waiting': 'Waiting...',
        'settings.backup_restore': 'Backup & Restore',
        'settings.export_config': 'Export Configuration',
        'settings.export_desc': 'Download a backup of AdGuard and Technitium configurations.',
        'settings.download_backup': 'Download Backup',
        'settings.import_config': 'Import Configuration',
        'settings.import_desc': 'Restore configuration from a previous backup file.',
        'settings.warning': 'Warning: This will overwrite current settings and restart services.',
        'settings.select_file': 'Select Backup File',
        // Dashboard
        'dashboard.title': 'Network Overview',
        'dashboard.subtitle': 'Real-time status of your unified DNS infrastructure.',
        'dashboard.total_queries': 'Total Queries',
        'dashboard.threats_blocked': 'Threats Blocked',
        'dashboard.protection': 'Protection',
        'dashboard.performance': 'Performance',
        'dashboard.last_24h': 'Last 24h',
        'dashboard.blocked': 'blocked',
        'dashboard.active': 'Active',
        'dashboard.disabled': 'Disabled',
        'dashboard.status_ok': 'All systems go',
        'dashboard.status_error': 'Action required',
        'dashboard.avg_time': 'Avg processing time',
        'dashboard.dns_traffic': 'DNS Traffic (24h)',
        'dashboard.queries_per_hour': 'Queries per hour',
        'dashboard.top_queried': 'Top Queried Domains',
        'dashboard.top_blocked': 'Top Blocked Domains',
        'dashboard.top_clients': 'Top Clients',
        'dashboard.infra_status': 'Infrastructure Status',
        'dashboard.operational': 'Operational',
        'dashboard.disconnected': 'Disconnected',
        'dashboard.primary_dns': 'Primary DNS / Filter',
        'dashboard.recursive_resolver': 'Recursive Resolver',
        'dashboard.dashboard_api': 'Dashboard API',
        'dashboard.no_records': 'No records found',
        'dashboard.unknown': 'Unknown',
        'dashboard.upstream_response_times': 'Upstream Response Times',
        'dashboard.upstream_server': 'Server',
        'dashboard.upstream_avg_time': 'Avg Time',
        'dashboard.upstream_queries': 'Queries',
        'dashboard.ms': 'ms',
        // Filtering
        'filtering.title': 'Filtering & Access Control',
        'filtering.subtitle': 'Manage global lists, per-client rules, and DNS forwarding.',
        'filtering.global_rules': 'Global Rules',
        'filtering.client_rules': 'Client Rules',
        'filtering.protection_settings': 'Protection Settings',
        'filtering.dns_protection': 'DNS Protection',
        'filtering.dns_protection_desc': 'Enable DNS filtering and blocking',
        'filtering.parental_control': 'Parental Control',
        'filtering.parental_control_desc': 'Block adult content',
        'filtering.safe_browsing': 'Safe Browsing',
        'filtering.safe_browsing_desc': 'Block malware and phishing domains',
        'filtering.safe_search': 'Safe Search',
        'filtering.safe_search_desc': 'Enforce safe search on search engines',
        'filtering.global_custom_rules': 'Global Custom Rules',
        'filtering.global_custom_rules_desc': 'Manually block or allow domains for everyone.',
        'filtering.add_rule': 'Add Rule',
        'filtering.syntax_examples': 'Syntax Examples',
        'filtering.filter_blocklists': 'Filter Blocklists',
        'filtering.filter_blocklists_desc': 'DNS requests matching these lists will be blocked.',
        'filtering.allow_whitelists': 'Allow Whitelists',
        'filtering.allow_whitelists_desc': 'Domains matching these lists will always be allowed.',
        'filtering.refresh_lists': 'Refresh lists',
        'filtering.browse_predefined': 'Browse Predefined',
        'filtering.import_csv': 'Import CSV',
        'filtering.add_list': 'Add List',
        'filtering.add_whitelist': 'Add Whitelist',
        'filtering.add_blocklist': 'Add Blocklist',
        'filtering.edit_list': 'Edit List',
        'filtering.name': 'Name',
        'filtering.url': 'URL',
        'filtering.cancel': 'Cancel',
        'filtering.add': 'Add',
        'filtering.save': 'Save',
        'filtering.add_custom_rule': 'Add Custom Rule',
        'filtering.browse_whitelists': 'Browse Whitelists',
        'filtering.browse_blocklists': 'Browse Blocklists',
        'filtering.search_lists': 'Search lists...',
        'filtering.select_all_available': 'Select All Available',
        'filtering.deselect_all': 'Deselect All',
        'filtering.loading_lists': 'Loading lists from GitHub...',
        'filtering.failed_load_csv': 'Failed to load CSV',
        'filtering.showing_fallback': 'Showing fallback lists instead.',
        'filtering.added': 'Added',
        'filtering.select': 'Select',
        'filtering.selected': 'Selected',
        'filtering.no_results': 'No results found',
        'filtering.lists_selected': 'list(s) selected',
        'filtering.clear_selection': 'Clear Selection',
        'filtering.add_selected_lists': 'Add Selected Lists',
        'filtering.adding': 'Adding...',
        'filtering.upload_csv_desc': 'Upload a CSV file containing filter lists. The CSV should have columns: enabled,url,name,id',
        'filtering.click_upload': 'Click to upload CSV file',
        'filtering.drag_drop': 'or drag and drop',
        'filtering.supports_csv': 'Supports .csv and .txt files',
        'filtering.parsing_csv': 'Parsing CSV...',
        'filtering.found_lists': 'Found lists',
        'filtering.selected_import': 'selected for import',
        'filtering.select_all': 'Select All',
        'filtering.upload_different': 'Upload Different File',
        'filtering.import_lists': 'Import List(s)',
        'filtering.client_selector_label': 'Select Client to Manage',
        'filtering.choose_client': 'Choose a Client',
        'filtering.configure_new_client': 'Configure New Client',
        'filtering.new_client_desc': 'This device was detected on your network but not yet configured as a client. Create a client entry to manage its filtering rules.',
        'filtering.client_name': 'Client Name',
        'filtering.ip_address': 'IP Address',
        'filtering.mac_address': 'MAC Address',
        'filtering.create_client': 'Create Client',
        'filtering.blocked_domains': 'Blocked Domains',
        'filtering.blocked_domains_desc': 'Domains strictly blocked for',
        'filtering.allowed_domains': 'Allowed Domains',
        'filtering.allowed_domains_desc': 'Domains allowed for',
        'filtering.no_blocked_domains': 'No blocked domains',
        'filtering.no_allowed_domains': 'No allowed domains',
        'filtering.select_client_msg': 'Select a client to manage their specific rules.',
        'filtering.temporarily_disable': 'Temporarily disable for:',
        'filtering.stay_off': 'Stay Off',
        'filtering.protection_paused': 'Protection paused:',
        'filtering.enable_now': 'Enable Now',
        'filtering.configured_clients': 'Configured Clients',
        'filtering.recognized_devices': 'Recognized Devices (Create New)',
        'filtering.no_clients_found': 'No clients or devices found',
        'filtering.suggested': 'Suggested',
        'filtering.optional': 'Optional',
        'filtering.failed_pause_timer': 'Failed to set pause timer. Please try again.',
        'filtering.failed_update_protection': 'Failed to update protection setting:',
        'filtering.action_failed': 'Action failed:',

        // Forwarding
        'forwarding.title': 'Forwarding & Upstreams',
        'forwarding.subtitle': 'Manage global AdGuard upstream servers and view forwarding zones.',
        'forwarding.adguard_upstreams': 'AdGuard Upstream Servers',
        'forwarding.adguard_upstreams_desc': 'Default DNS servers used for resolving non-local queries.',
        'forwarding.save_changes': 'Save Changes',
        'forwarding.predefined_providers': 'Predefined Providers...',
        'forwarding.ip_or_url': 'IP Address or URL (e.g. 1.1.1.1)',
        'forwarding.upstream_placeholder': 'IP Address or URL (e.g. 1.1.1.1)',
        'forwarding.no_upstreams': 'No upstream servers configured. DNS resolution might fail.',
        'forwarding.save_upstream_error': 'Failed to save upstream servers.',
        'forwarding.fetch_data_error': 'Failed to fetch data.',
        'forwarding.technitium_zones': 'Technitium Zones (Read-Only)',
        'forwarding.technitium_zones_desc': 'These zones are managed via',
        'forwarding.technitium_controls': 'Technitium Controls > Zones & Records',
        'forwarding.domain_zone': 'Domain / Zone',
        'forwarding.type': 'Type',
        'forwarding.target_forwarder': 'Target Forwarder',
        'forwarding.status': 'Status',
        'forwarding.managed_by': 'Managed By',
        'forwarding.ad_domain': 'AD Domain',
        'forwarding.technitium_zone': 'Technitium Zone',
        'forwarding.local': 'Local',
        'forwarding.no_zones': 'No forwarding zones configured.',

        // Services
        'services.title': 'Service Blocking',
        'services.subtitle': 'Block popular applications and configure pause schedules.',
        'services.pause_blocking': 'Pause Service Blocking',
        'services.time_zone': 'Time Zone',
        'services.start_time': 'Pause Start Time',
        'services.end_time': 'Pause End Time',
        'services.days': 'Days of Week',
        'services.save_schedule': 'Save Schedule',
        'services.saving': 'Saving...',
        'services.schedule_saved': 'Schedule saved!',
        'services.blocked_services': 'Blocked Services',
        'services.filter_services': 'Filter services...',
        'services.no_services_found': 'No services found for',

        // DHCP
        'dhcp.title': 'DHCP Server',
        'dhcp.subtitle': 'Manage network address assignments and leases.',
        'dhcp.technitium_leases': 'Technitium Leases',
        'dhcp.adguard_dhcp': 'AdGuard DHCP',
        'dhcp.opnsense_discovery': 'OPNsense Discovery',
        'dhcp.create_scope': 'Create Scope',
        'dhcp.static_lease': 'Static Lease',
        'dhcp.ip_range': 'IP Range',
        'dhcp.gateway': 'Gateway',
        'dhcp.mask': 'Subnet Mask',
        'dhcp.dns_servers': 'DNS Servers',
        'dhcp.lease_time': 'Lease Time',
        'dhcp.active_leases': 'Active Leases',
        'dhcp.available': 'Available',
        'dhcp.hostname': 'Hostname',
        'dhcp.ip': 'IP Address',
        'dhcp.mac': 'MAC Address',
        'dhcp.type': 'Type',
        'dhcp.expires': 'Expires',
        'dhcp.actions': 'Actions',
        'dhcp.unknown': 'Unknown',
        'dhcp.no_leases': 'No leases found matching your search.',
        'dhcp.opnsense_no_leases': 'No leases found in OPNsense.',
        'dhcp.opnsense_not_configured': 'OPNsense is not configured in Settings.',
        'dhcp.add_static': 'Add Static Lease',
        'dhcp.scope_name': 'Scope Name',
        'dhcp.start_ip': 'Starting Address',
        'dhcp.end_ip': 'Ending Address',
        'dhcp.description': 'Description',
        'dhcp.enable_scope': 'Enable Scope',
        'dhcp.disable_scope': 'Disable Scope',
        'dhcp.delete_scope': 'Delete Scope',
        'dhcp.scope_modal_title_create': 'Create New DHCP Scope',
        'dhcp.scope_modal_title_edit': 'Edit Scope: {0}',
        'dhcp.tab_general': 'General',
        'dhcp.tab_dns': 'DNS & Domain',
        'dhcp.tab_network': 'Network & Boot',
        'dhcp.tab_advanced': 'Advanced',
        'dhcp.ping_check': 'Ping Check',
        'dhcp.enable_ping_check': 'Enable Ping Check',
        'dhcp.timeout': 'Timeout (ms)',
        'dhcp.retries': 'Retries',
        'dhcp.domain_name': 'Domain Name',
        'dhcp.dns_updates': 'DNS Updates',
        'dhcp.enable_dns_updates': 'Enable DNS Updates',
        'dhcp.overwrite_records': 'Overwrite Existing A Records',
        'dhcp.ntp_servers': 'NTP Servers',
        'dhcp.boot_file': 'Boot File Name',
        'dhcp.next_server': 'Next Server (TFTP)',
        'dhcp.reserved_only': 'Allow Only Reserved Leases',
        'dhcp.block_macs': 'Block Locally Administered MACs',
        'dhcp.ignore_client_id': 'Ignore Client Identifier',
        'dhcp.delete_scope_confirm': 'Are you sure you want to delete scope "{0}"?',
        'dhcp.delete_lease_confirm': 'Remove static lease for {0}?',
        'dhcp.offer_delay': 'Offer Delay (ms)',
        'dhcp.custom_dns': 'Custom DNS Server IPs',
        'dhcp.create_first_scope': 'Create First Scope',
        'dhcp.create_first_scope_desc': 'Define a subnet range to start serving IP addresses.',
        'dhcp.adguard_status': 'AdGuard DHCP Status',
        'dhcp.server_disabled': 'Server is disabled',
        'dhcp.enable_dhcp_desc': 'The DHCP server must be enabled for AdGuard to manage your network addresses.',
        'dhcp.sync_dns': 'Sync to Technitium DNS',
        'dhcp.no_description': 'No description',
        'dhcp.scope_name_placeholder': "Currently 'Default' is standard",
        'dhcp.scope_name_help': 'Unique name for this scope.',
        'dhcp.lease_time_help': '86400 = 1 day',
        'dhcp.offer_delay_help': 'Delay before sending DHCPOFFER.',
        'dhcp.ping_check_help': 'Check if IP is in use before assigning.',
        'dhcp.domain_name_help': 'Domain name assigned to clients (Option 15).',
        'dhcp.dns_updates_help': 'Automatically update Forward/Reverse DNS entries.',
        'dhcp.overwrite_records_help': 'Allow overwriting existing DNS A records.',
        'dhcp.dns_servers_help': "Leave empty to use this servers own IP address.",
        'dhcp.dns_servers_placeholder': 'e.g. 1.1.1.1 (comma separated)',
        'dhcp.dns_servers_input_help': 'Option 6',
        'dhcp.ntp_servers_help': 'Option 42',
        'dhcp.boot_file_help': 'Option 67',
        'dhcp.next_server_help': 'Option 66 / siaddr',
        'dhcp.reserved_only_help': 'Block dynamic allocation for unknown clients.',
        'dhcp.block_macs_help': 'Reject randomized MAC addresses.',
        'dhcp.ignore_client_id_help': 'Use MAC address as identifier instead of Option 61.',

        // Clients
        'clients.title': 'Client Management',
        'clients.subtitle': 'Configure DNS policies and protection settings per device.',
        'clients.add_client': 'Add Client',
        'clients.search_placeholder': 'Search by name or IP/MAC address...',
        'clients.failed_load': 'Failed to load clients',
        'clients.no_clients': 'No clients found',
        'clients.edit_client': 'Edit Client',
        'clients.add_new_client': 'Add New Client',
        'clients.basic_info': 'Basic Information',
        'clients.client_name': 'Client Name',
        'clients.identifiers': 'Identifiers (IP, MAC, CIDR)',
        'clients.tags': 'Tags',
        'clients.protection_settings': 'Protection Settings',
        'clients.global_settings': 'Global Settings',
        'clients.use_global': 'Inherit from global rules',
        'clients.dns_filtering': 'DNS Filtering',
        'clients.safe_browsing': 'Safe Browsing',
        'clients.parental_control': 'Parental Control',
        'clients.safe_search': 'Safe Search',
        'clients.whitelist': 'Whitelist',
        'clients.whitelist_desc': 'Always allow these domains',
        'clients.no_whitelist': 'No domains in whitelist',
        'clients.create_first': 'Create your first rule',
        'clients.blocklist': 'Blocklist',
        'clients.blocklist_desc': 'Always block these domains',
        'clients.no_blocklist': 'No domains in blocklist',
        'clients.blocked_services': 'Blocked Services',
        'clients.blocked_services_desc': 'Block specific applications for this client',
        'clients.use_global_blocked': 'Use Global Blocked Services',
        'clients.use_global_blocked_desc': 'Inherit blocked services from global settings',
        'clients.block_all': 'Block All',
        'clients.unblock_all': 'Unblock All',
        'clients.delete_client': 'Delete Client',
        'clients.delete_confirm': 'Are you sure you want to delete this client?',

        // Logs
        'logs.title': 'Query Log',
        'logs.subtitle': 'Real-time DNS query log and analysis.',
        'logs.clear_logs': 'Clear Logs',
        'logs.clear_confirm': 'Are you sure you want to clear the query log?',
        'logs.search_placeholder': 'Search domains, clients, or IPs...',
        'logs.all_queries': 'All Queries',
        'logs.blocked': 'Blocked',
        'logs.blocked_services': 'Blocked Services',
        'logs.blocked_threats': 'Blocked Threats',
        'logs.blocked_parental': 'Blocked Parental',
        'logs.processed': 'Processed',
        'logs.filtered': 'Filtered',
        'logs.rewritten': 'Rewritten',
        'logs.safe_search': 'Safe Search',
        'logs.time': 'Time',
        'logs.status': 'Status',
        'logs.client': 'Client',
        'logs.domain': 'Domain',
        'logs.answer_upstream': 'Answer / Upstream',
        'logs.no_logs': 'No logs found matching your criteria.',
        'logs.load_more': 'Load More Logs',
        'logs.client_details': 'Client Details',
        'logs.ip_address': 'IP Address',
        'logs.hostname': 'Hostname',
        'logs.proto': 'Proto',
        'logs.response_info': 'Response Info',
        'logs.whitelist_global': 'Whitelist Global',
        'logs.block_global': 'Block Global',
        'logs.elapsed': 'Elapsed',
        'logs.upstream': 'Upstream',
        'logs.client_operations': 'Client Operations',
        'logs.unconfigured_client': 'Unconfigured Client',
        'logs.no_client_ip': 'No client IP found',
        'logs.create_client': 'Create Client',
        'logs.create_client_desc': 'Create a new client for this IP to manage specific rules.',
        'logs.detected_hostname': 'Detected Hostname',
        'logs.select_client': 'Select Client',
        'logs.block_client': 'Block Client',
        'logs.whitelist_client': 'Whitelist Client',
        'logs.question': 'Question',
        'logs.matched_rules': 'Matched Rules',
        'logs.list_id': 'List ID',
        'logs.answer': 'Answer',
        'logs.type': 'Type',
        'logs.value': 'Value',
        'logs.ttl': 'TTL',
        'logs.view_json': 'View Raw JSON',

        // Zones
        'zones.title': 'DNS Zones',
        'zones.subtitle': 'Manage DNS zones and Active Directory domain forwarding.',
        'zones.search_placeholder': 'Search zones, IPs...',
        'zones.reset_cache': 'Reset Cache',
        'zones.refresh': 'Refresh Zones',
        'zones.add_zone': 'Add Zone',
        'zones.error': 'Error',
        'zones.zone_domain': 'Zone / Domain',
        'zones.type': 'Type',
        'zones.target': 'Target',
        'zones.status': 'Status',
        'zones.actions': 'Actions',
        'zones.active_directory': 'Active Directory',
        'zones.reverse_dns': 'Reverse DNS',
        'zones.primary': 'Primary',
        'zones.internal': 'Internal',
        'zones.active': 'Active',
        'zones.pending': 'Pending',
        'zones.delete_zone_confirm': 'Delete zone "{0}"?\n\nThis will:\n• Delete the zone from Technitium\n• Remove the forwarding rule from AdGuard',
        'zones.delete_ad_confirm': 'Delete AD forwarding for "{0}"?\n\nThis will remove the forwarding rule from AdGuard.',
        'zones.no_zones_match': 'No zones match your search.',
        'zones.no_zones_configured': 'No zones configured. Click "Add Zone" to get started.',
        'zones.loading': 'Loading zones...',
        'zones.add_dns_zone': 'Add DNS Zone',
        'zones.custom_zone': 'Custom Zone',
        'zones.custom_zone_desc': 'Create zone in Technitium (Primary or Conditional)',
        'zones.ad_domain': 'Active Directory',
        'zones.ad_domain_desc': 'Forward to existing DC DNS servers',
        'zones.reverse_dns_desc': 'PTR Lookup Helper (in-addr.arpa)',
        'zones.ad_domain_name': 'AD Domain Name',
        'zones.subnet': 'Subnet (e.g. 192.168.1.0)',
        'zones.zone_name': 'Zone Name',
        'zones.will_create_zone': 'Will create zone: ',
        'zones.dc_ips': 'Domain Controller IPs',
        'zones.dc_ips_desc': 'Comma-separated list of DC IP addresses with DNS role',
        'zones.zone_type': 'Zone Type',
        'zones.upstream_provider': 'Upstream Provider',
        'zones.select_provider': 'Select a provider...',
        'zones.forwarder_ip': 'Forwarder IP',
        'zones.protocol': 'Protocol',
        'zones.forwarder_desc': 'DNS server to forward queries to when records are not found locally',
        'zones.ad_mode_desc': 'Active Directory Mode:',
        'zones.custom_mode_desc': 'Custom Zone Mode:',
        'zones.conditional_forwarder_desc': 'Local records will be resolved, unknown records forwarded to ',
        'zones.manual_records_desc': 'You can add A, CNAME, TXT records manually.',
        'zones.forwarding_notice': 'AdGuard forwards {0} to Technitium.',
        'zones.creating': 'Creating...',
        'zones.add_ad_domain': 'Add AD Domain',
        'zones.create_zone': 'Create Zone',
        'zones.cache_cleared': 'DNS Cache cleared successfully!',
        'zones.cache_clear_error': 'Error clearing cache',
        'zones.cache_clear_confirm': 'Are you sure you want to clear the AdGuard DNS cache? This can help resolve DNS issues but may temporarily slow down initial queries.',
        'zones.enter_dc_ip': 'Please enter at least one Domain Controller IP',
        'zones.enter_forwarder_ip': 'Please enter a Forwarder IP for Conditional Forwarder zone',
        'zones.failed_create': 'Failed to create zone',
        'zones.failed_delete': 'Failed to delete zone',
        'zones.technitium_docker': 'Technitium (docker)',

        // Common
        'common.save_changes': 'Save Changes',
        'common.error': 'An error occurred. Please try again.',
        'common.cancel': 'Cancel',
        'common.add': 'Add',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.retry': 'Retry',
        'common.loading': 'Loading...',
        'common.optional': 'Optional',
    },
    de: {
        'app.title': 'UnifiedDNS',
        'overview.title': 'Übersicht',
        'nav.overview': 'Übersicht',
        'nav.adguard_controls': 'AdGuard Steuerung',
        'nav.filtering': 'Filter & Blocklisten',
        'nav.forwarding': 'Weiterleitung / Zonen',
        'nav.service_blocking': 'Dienste blockieren',
        'nav.client_management': 'Client-Verwaltung',
        'nav.query_log': 'Abfrageprotokoll',
        'nav.technitium_controls': 'Technitium Steuerung',
        'nav.zones_records': 'Zonen & Einträge',
        'nav.system': 'System',
        'nav.dhcp': 'DHCP-Server',
        'nav.advanced': 'Erweiterter Zugriff',
        'nav.settings': 'Einstellungen',
        'user.admin': 'Administrator',
        'user.logout': 'Abmelden',
        'settings.title': 'Systemeinstellungen',
        'settings.subtitle': 'Verwalten Sie globale Konfigurationen und Integrationen.',
        'settings.system_status': 'Systemstatus',
        'settings.refresh': 'Status aktualisieren',
        'settings.adguard': 'AdGuard Home',
        'settings.adguard_desc': 'Rekursives DNS & Filterung',
        'settings.connected': 'Verbunden',
        'settings.error': 'Fehler',
        'settings.technitium': 'Technitium DNS',
        'settings.technitium_desc': 'Autoritatives DNS',
        'settings.dhcp': 'DHCP-Server',
        'settings.dhcp_desc': 'Technitium DHCP',
        'settings.active': 'Aktiv',
        'settings.waiting': 'Warten...',
        'settings.backup_restore': 'Sichern & Wiederherstellen',
        'settings.export_config': 'Konfiguration exportieren',
        'settings.export_desc': 'Laden Sie ein Backup der AdGuard- und Technitium-Konfigurationen herunter.',
        'settings.download_backup': 'Backup herunterladen',
        'settings.import_config': 'Konfiguration importieren',
        'settings.import_desc': 'Stellen Sie die Konfiguration aus einer vorherigen Backup-Datei wieder her.',
        'settings.warning': 'Warnung: Dies überschreibt die aktuellen Einstellungen und startet die Dienste neu.',
        'settings.select_file': 'Backup-Datei auswählen',
        // Dashboard
        'dashboard.title': 'Netzwerk-Übersicht',
        'dashboard.subtitle': 'Echtzeit-Status Ihrer DNS-Infrastruktur.',
        'dashboard.total_queries': 'Gesamtanfragen',
        'dashboard.threats_blocked': 'Bedrohungen blockiert',
        'dashboard.protection': 'Schutz',
        'dashboard.performance': 'Leistung',
        'dashboard.last_24h': 'Letzte 24h',
        'dashboard.blocked': 'blockiert',
        'dashboard.active': 'Aktiv',
        'dashboard.disabled': 'Deaktiviert',
        'dashboard.status_ok': 'Alles in Ordnung',
        'dashboard.status_error': 'Handlung erforderlich',
        'dashboard.avg_time': 'Durchschn. Verarbeitungszeit',
        'dashboard.dns_traffic': 'DNS-Traffic (24h)',
        'dashboard.queries_per_hour': 'Anfragen pro Stunde',
        'dashboard.top_queried': 'Meistgefragte Domains',
        'dashboard.top_blocked': 'Blockierte Domains',
        'dashboard.top_clients': 'Top Clients',
        'dashboard.infra_status': 'Infrastruktur-Status',
        'dashboard.operational': 'Betriebsbereit',
        'dashboard.disconnected': 'Getrennt',
        'dashboard.primary_dns': 'Primärer DNS / Filter',
        'dashboard.recursive_resolver': 'Rekursiver Resolver',
        'dashboard.dashboard_api': 'Dashboard API',
        'dashboard.no_records': 'Keine Einträge gefunden',
        'dashboard.unknown': 'Unbekannt',
        'dashboard.upstream_response_times': 'Upstream-Antwortzeiten',
        'dashboard.upstream_server': 'Server',
        'dashboard.upstream_avg_time': 'Durchschn. Zeit',
        'dashboard.upstream_queries': 'Anfragen',
        'dashboard.ms': 'ms',
        // Filtering
        'filtering.title': 'Filterung & Zugriffskontrolle',
        'filtering.subtitle': 'Verwalten Sie globale Listen, Client-Regeln und DNS-Weiterleitung.',
        'filtering.global_rules': 'Globale Regeln',
        'filtering.client_rules': 'Client-Regeln',
        'filtering.protection_settings': 'Schutzeinstellungen',
        'filtering.dns_protection': 'DNS-Schutz',
        'filtering.dns_protection_desc': 'DNS-Filterung und Blockierung aktivieren',
        'filtering.parental_control': 'Kindersicherung',
        'filtering.parental_control_desc': 'Nicht jugendfreie Inhalte blockieren',
        'filtering.safe_browsing': 'Sicheres Surfen',
        'filtering.safe_browsing_desc': 'Malware- und Phishing-Domains blockieren',
        'filtering.safe_search': 'Sichere Suche',
        'filtering.safe_search_desc': 'Sichere Suche auf Suchmaschinen erzwingen',
        'filtering.global_custom_rules': 'Globale Benutzerregeln',
        'filtering.global_custom_rules_desc': 'Domains manuell für alle blockieren oder zulassen.',
        'filtering.add_rule': 'Regel hinzufügen',
        'filtering.syntax_examples': 'Syntax-Beispiele',
        'filtering.filter_blocklists': 'Filter-Blocklisten',
        'filtering.filter_blocklists_desc': 'DNS-Anfragen, die diesen Listen entsprechen, werden blockiert.',
        'filtering.allow_whitelists': 'Zulassungslisten (Whitelists)',
        'filtering.allow_whitelists_desc': 'Domains, die diesen Listen entsprechen, werden immer zugelassen.',
        'filtering.refresh_lists': 'Listen aktualisieren',
        'filtering.browse_predefined': 'Vordefinierte durchsuchen',
        'filtering.import_csv': 'CSV importieren',
        'filtering.add_list': 'Liste hinzufügen',
        'filtering.add_whitelist': 'Whitelist hinzufügen',
        'filtering.add_blocklist': 'Blocklist hinzufügen',
        'filtering.edit_list': 'Liste bearbeiten',
        'filtering.name': 'Name',
        'filtering.url': 'URL',
        'filtering.cancel': 'Abbrechen',
        'filtering.add': 'Hinzufügen',
        'filtering.save': 'Speichern',
        'filtering.add_custom_rule': 'Benutzerregel hinzufügen',
        'filtering.browse_whitelists': 'Whitelists durchsuchen',
        'filtering.browse_blocklists': 'Blocklists durchsuchen',
        'filtering.search_lists': 'Listen durchsuchen...',
        'filtering.select_all_available': 'Alle verfügbaren auswählen',
        'filtering.deselect_all': 'Alle abwählen',
        'filtering.loading_lists': 'Lade Listen von GitHub...',
        'filtering.failed_load_csv': 'CSV konnte nicht geladen werden',
        'filtering.showing_fallback': 'Zeige stattdessen Fallback-Listen.',
        'filtering.added': 'Hinzugefügt',
        'filtering.select': 'Auswählen',
        'filtering.selected': 'Ausgewählt',
        'filtering.no_results': 'Keine Ergebnisse gefunden',
        'filtering.lists_selected': 'Liste(n) ausgewählt',
        'filtering.clear_selection': 'Auswahl aufheben',
        'filtering.add_selected_lists': 'Ausgewählte Listen hinzufügen',
        'filtering.adding': 'Hinzufügen...',
        'filtering.upload_csv_desc': 'Laden Sie eine CSV-Datei mit Filterlisten hoch. Spalten: enabled,url,name,id',
        'filtering.click_upload': 'Klicken zum Hochladen',
        'filtering.drag_drop': 'oder Drag & Drop',
        'filtering.supports_csv': 'Unterstützt .csv und .txt',
        'filtering.parsing_csv': 'Verarbeite CSV...',
        'filtering.found_lists': 'Gefundene Listen',
        'filtering.selected_import': 'für Import ausgewählt',
        'filtering.select_all': 'Alle auswählen',
        'filtering.upload_different': 'Andere Datei hochladen',
        'filtering.import_lists': 'Liste(n) importieren',
        'filtering.client_selector_label': 'Client zur Verwaltung auswählen',
        'filtering.choose_client': 'Client wählen',
        'filtering.configure_new_client': 'Neuen Client konfigurieren',
        'filtering.new_client_desc': 'Dieses Gerät wurde im Netzwerk erkannt, ist aber noch kein Client. Erstellen Sie einen Eintrag, um Regeln festzulegen.',
        'filtering.client_name': 'Client-Name',
        'filtering.ip_address': 'IP-Adresse',
        'filtering.mac_address': 'MAC-Adresse',
        'filtering.create_client': 'Client erstellen',
        'filtering.blocked_domains': 'Blockierte Domains',
        'filtering.blocked_domains_desc': 'Domains strikt blockiert für',
        'filtering.allowed_domains': 'Erlaubte Domains',
        'filtering.allowed_domains_desc': 'Domains erlaubt für (umgeht Blocklisten)',
        'filtering.no_blocked_domains': 'Keine blockierten Domains',
        'filtering.no_allowed_domains': 'Keine erlaubten Domains',
        'filtering.select_client_msg': 'Wählen Sie einen Client, um dessen Regeln zu verwalten.',
        'filtering.temporarily_disable': 'Vorübergehend deaktivieren für:',
        'filtering.stay_off': 'Aus bleiben',
        'filtering.protection_paused': 'Schutz pausiert:',
        'filtering.enable_now': 'Jetzt aktivieren',
        'filtering.configured_clients': 'Konfigurierte Clients',
        'filtering.recognized_devices': 'Erkannte Geräte (Neu erstellen)',
        'filtering.no_clients_found': 'Keine Clients oder Geräte gefunden',
        'filtering.suggested': 'Empfohlen',
        'filtering.optional': 'Optional',
        'filtering.failed_pause_timer': 'Pause-Timer konnte nicht gesetzt werden. Bitte versuchen Sie es erneut.',
        'filtering.failed_update_protection': 'Schutzeinstellung konnte nicht aktualisiert werden:',
        'filtering.action_failed': 'Aktion fehlgeschlagen:',

        // Forwarding
        'forwarding.title': 'Weiterleitung & Upstreams',
        'forwarding.subtitle': 'Verwalten Sie globale AdGuard Upstream-Server und Zonen.',
        'forwarding.adguard_upstreams': 'AdGuard Upstream-Server',
        'forwarding.adguard_upstreams_desc': 'Standard-DNS-Server für externe Abfragen.',
        'forwarding.save_changes': 'Änderungen speichern',
        'forwarding.predefined_providers': 'Vordefinierte Anbieter...',
        'forwarding.ip_or_url': 'IP-Adresse oder URL (z.B. 1.1.1.1)',
        'forwarding.upstream_placeholder': 'IP-Adresse oder URL (z.B. 1.1.1.1)',
        'forwarding.no_upstreams': 'Keine Upstream-Server konfiguriert. DNS-Auflösung könnte fehlschlagen.',
        'forwarding.save_upstream_error': 'Upstream-Server konnten nicht gespeichert werden.',
        'forwarding.fetch_data_error': 'Daten konnten nicht geladen werden.',
        'forwarding.technitium_zones': 'Technitium Zonen (Schreibgeschützt)',
        'forwarding.technitium_zones_desc': 'Diese Zonen werden verwaltet über',
        'forwarding.technitium_controls': 'Technitium Steuerung > Zonen & Einträge',
        'forwarding.domain_zone': 'Domain / Zone',
        'forwarding.type': 'Typ',
        'forwarding.target_forwarder': 'Ziel / Forwarder',
        'forwarding.status': 'Status',
        'forwarding.managed_by': 'Verwaltet von',
        'forwarding.ad_domain': 'AD Domain',
        'forwarding.technitium_zone': 'Technitium Zone',
        'forwarding.local': 'Lokal',
        'forwarding.no_zones': 'Keine Weiterleitungszonen konfiguriert.',

        // Services
        'services.title': 'Dienste blockieren',
        'services.subtitle': 'Blockieren Sie beliebte Anwendungen und konfigurieren Sie Pausenzeiten.',
        'services.pause_blocking': 'Dienstblockierung pausieren',
        'services.time_zone': 'Zeitzone',
        'services.start_time': 'Pausen-Startzeit',
        'services.end_time': 'Pausen-Endzeit',
        'services.days': 'Wochentage',
        'services.save_schedule': 'Zeitplan speichern',
        'services.saving': 'Speichern...',
        'services.schedule_saved': 'Zeitplan gespeichert!',
        'services.blocked_services': 'Blockierte Dienste',
        'services.filter_services': 'Dienste filtern...',
        'services.no_services_found': 'Keine Dienste gefunden für',

        // DHCP
        'dhcp.title': 'DHCP-Server',
        'dhcp.subtitle': 'Verwalten Sie Netzwerkadresszuweisungen und Leases.',
        'dhcp.technitium_leases': 'Technitium Leases',
        'dhcp.adguard_dhcp': 'AdGuard DHCP',
        'dhcp.opnsense_discovery': 'OPNsense Erkennung',
        'dhcp.create_scope': 'Bereich erstellen',
        'dhcp.static_lease': 'Statische Lease',
        'dhcp.ip_range': 'IP-Bereich',
        'dhcp.gateway': 'Gateway',
        'dhcp.mask': 'Subnetzmaske',
        'dhcp.dns_servers': 'DNS-Server',
        'dhcp.lease_time': 'Lease-Zeit',
        'dhcp.active_leases': 'Aktive Leases',
        'dhcp.available': 'Verfügbar',
        'dhcp.hostname': 'Hostname',
        'dhcp.ip': 'IP-Adresse',
        'dhcp.mac': 'MAC-Adresse',
        'dhcp.type': 'Typ',
        'dhcp.expires': 'Läuft ab',
        'dhcp.actions': 'Aktionen',
        'dhcp.unknown': 'Unbekannt',
        'dhcp.no_leases': 'Keine Leases gefunden.',
        'dhcp.opnsense_no_leases': 'Keine Leases in OPNsense gefunden.',
        'dhcp.opnsense_not_configured': 'OPNsense ist in den Einstellungen nicht konfiguriert.',
        'dhcp.add_static': 'Statische Lease hinzufügen',
        'dhcp.scope_name': 'Bereichsname',
        'dhcp.start_ip': 'Start-Adresse',
        'dhcp.end_ip': 'End-Adresse',
        'dhcp.description': 'Beschreibung',
        'dhcp.enable_scope': 'Bereich aktivieren',
        'dhcp.disable_scope': 'Bereich deaktivieren',
        'dhcp.delete_scope': 'Bereich löschen',
        'dhcp.scope_modal_title_create': 'Neuen DHCP-Bereich erstellen',
        'dhcp.scope_modal_title_edit': 'Bereich bearbeiten: {0}',
        'dhcp.tab_general': 'Allgemein',
        'dhcp.tab_dns': 'DNS & Domain',
        'dhcp.tab_network': 'Netzwerk & Boot',
        'dhcp.tab_advanced': 'Erweitert',
        'dhcp.ping_check': 'Ping-Check',
        'dhcp.enable_ping_check': 'Ping-Check aktivieren',
        'dhcp.timeout': 'Timeout (ms)',
        'dhcp.retries': 'Wiederholungen',
        'dhcp.domain_name': 'Domain-Name',
        'dhcp.dns_updates': 'DNS-Updates',
        'dhcp.enable_dns_updates': 'DNS-Updates aktivieren',
        'dhcp.overwrite_records': 'Vorhandene A-Records überschreiben',
        'dhcp.ntp_servers': 'NTP-Server',
        'dhcp.boot_file': 'Boot-Dateiname',
        'dhcp.next_server': 'Nächster Server (TFTP)',
        'dhcp.reserved_only': 'Nur reservierte Leases zulassen',
        'dhcp.block_macs': 'Lokal verwaltete MACs blockieren',
        'dhcp.ignore_client_id': 'Client-Identifier ignorieren',
        'dhcp.delete_scope_confirm': 'Möchten Sie den Bereich "{0}" wirklich löschen?',
        'dhcp.delete_lease_confirm': 'Statische Lease für {0} entfernen?',
        'dhcp.offer_delay': 'Angebotsverzögerung (ms)',
        'dhcp.custom_dns': 'Benutzerdefinierte DNS-Server-IPs',
        'dhcp.create_first_scope': 'Ersten Bereich erstellen',
        'dhcp.create_first_scope_desc': 'Definieren Sie einen Subnetzbereich, um IP-Adressen bereitzustellen.',
        'dhcp.adguard_status': 'AdGuard DHCP Status',
        'dhcp.server_disabled': 'Server ist deaktiviert',
        'dhcp.enable_dhcp_desc': 'Der DHCP-Server muss aktiviert sein, damit AdGuard Ihre Netzwerkadressen verwalten kann.',
        'dhcp.sync_dns': 'Sync zu Technitium DNS',
        'dhcp.no_description': 'Keine Beschreibung',
        'dhcp.scope_name_placeholder': "Aktuell ist 'Default' Standard",
        'dhcp.scope_name_help': 'Eindeutiger Name für diesen Bereich.',
        'dhcp.lease_time_help': '86400 = 1 Tag',
        'dhcp.offer_delay_help': 'Verzögerung vor dem Senden von DHCPOFFER.',
        'dhcp.ping_check_help': 'Prüfen, ob IP verwendet wird, bevor zugewiesen wird.',
        'dhcp.domain_name_help': 'Domain-Name, der Clients zugewiesen wird (Option 15).',
        'dhcp.dns_updates_help': 'Forward/Reverse DNS-Einträge automatisch aktualisieren.',
        'dhcp.overwrite_records_help': 'Überschreiben vorhandener DNS A-Einträge zulassen.',
        'dhcp.dns_servers_help': "Leer lassen, um die eigene IP-Adresse dieses Servers zu verwenden.",
        'dhcp.dns_servers_placeholder': 'z.B. 1.1.1.1 (kommagetrennt)',
        'dhcp.dns_servers_input_help': 'Option 6',
        'dhcp.ntp_servers_help': 'Option 42',
        'dhcp.boot_file_help': 'Option 67',
        'dhcp.next_server_help': 'Option 66 / siaddr',
        'dhcp.reserved_only_help': 'Dynamische Zuweisung für unbekannte Clients blockieren.',
        'dhcp.block_macs_help': 'Zufällige MAC-Adressen ablehnen.',
        'dhcp.ignore_client_id_help': 'MAC-Adresse als Identifikator anstelle von Option 61 verwenden.',

        // Clients
        'clients.title': 'Client-Verwaltung',
        'clients.subtitle': 'Konfigurieren Sie DNS-Richtlinien und Schutzeinstellungen pro Gerät.',
        'clients.add_client': 'Client hinzufügen',
        'clients.search_placeholder': 'Suche nach Name oder IP/MAC-Adresse...',
        'clients.failed_load': 'Clients konnten nicht geladen werden',
        'clients.no_clients': 'Keine Clients gefunden',
        'clients.edit_client': 'Client bearbeiten',
        'clients.add_new_client': 'Neuen Client hinzufügen',
        'clients.basic_info': 'Basis-Informationen',
        'clients.client_name': 'Client-Name',
        'clients.identifiers': 'Identifikatoren (IP, MAC, CIDR)',
        'clients.tags': 'Tags',
        'clients.protection_settings': 'Schutzeinstellungen',
        'clients.global_settings': 'Globale Einstellungen',
        'clients.use_global': 'Von serverweiten Regeln erben',
        'clients.dns_filtering': 'DNS-Filterung',
        'clients.safe_browsing': 'Safe Browsing',
        'clients.parental_control': 'Kindersicherung',
        'clients.safe_search': 'Sichere Suche',
        'clients.whitelist': 'Client Whitelist',
        'clients.whitelist_desc': 'Domänen, die speziell für diesen Client erlaubt sind.',
        'clients.no_whitelist': 'Keine benutzerdefinierten erlaubten Domänen für diesen Client.',
        'clients.create_first': 'Bitte erstellen Sie zuerst den Client, um spezifische Regeln hinzuzufügen.',
        'clients.blocklist': 'Client Blocklist',
        'clients.blocklist_desc': 'Domänen, die speziell für diesen Client blockiert sind.',
        'clients.no_blocklist': 'Keine benutzerdefinierten blockierten Domänen für diesen Client.',
        'clients.blocked_services': 'Blockierte Dienste',
        'clients.blocked_services_desc': 'Dienste, die den serverweiten Regeln entsprechen, werden standardmäßig blockiert',
        'clients.use_global_blocked': 'Globale blockierte Dienste verwenden',
        'clients.use_global_blocked_desc': 'Serverweite Liste blockierter Dienste verwenden',
        'clients.block_all': 'Alle blockieren',
        'clients.unblock_all': 'Alle freigeben',
        'clients.delete_client': 'Client löschen',
        'clients.delete_confirm': 'Client löschen',

        // Logs
        'logs.title': 'Abfrageprotokoll',
        'logs.subtitle': 'Echtzeit-DNS-Abfrageinspektion.',
        'logs.clear_logs': 'Protokolle löschen',
        'logs.clear_confirm': 'Sind Sie sicher, dass Sie das Abfrageprotokoll löschen möchten?',
        'logs.search_placeholder': 'Suche nach Domain, Client-IP oder Antwort...',
        'logs.all_queries': 'Alle Abfragen',
        'logs.blocked': 'Blockiert',
        'logs.blocked_services': 'Blockierte Dienste',
        'logs.blocked_threats': 'Blockierte Bedrohungen',
        'logs.blocked_parental': 'Durch Kindersicherung blockiert',
        'logs.processed': 'Verarbeitet',
        'logs.filtered': 'Gefiltert',
        'logs.rewritten': 'Umgeschrieben',
        'logs.safe_search': 'Sichere Suche',
        'logs.time': 'Zeit',
        'logs.status': 'Status',
        'logs.client': 'Client',
        'logs.domain': 'Domain',
        'logs.answer_upstream': 'Antwort / Upstream',
        'logs.no_logs': 'Keine Protokolle gefunden, die Ihren Kriterien entsprechen.',
        'logs.load_more': 'Mehr Protokolle laden',
        'logs.client_details': 'Client-Details',
        'logs.ip_address': 'IP-Adresse',
        'logs.hostname': 'Hostname',
        'logs.proto': 'Proto',
        'logs.response_info': 'Antwort-Info',
        'logs.whitelist_global': 'Global zulassen',
        'logs.block_global': 'Global blockieren',
        'logs.elapsed': 'Dauer',
        'logs.upstream': 'Upstream',
        'logs.client_operations': 'Client-Operationen',
        'logs.unconfigured_client': 'Nicht konfigurierter Client',
        'logs.no_client_ip': 'Kein Client entspricht IP',
        'logs.create_client': 'Client erstellen',
        'logs.create_client_desc': 'Erstellt einen neuen Client mit IP',
        'logs.detected_hostname': 'Erkannter Hostname',
        'logs.select_client': 'Client auswählen',
        'logs.block_client': 'Für Client blockieren',
        'logs.whitelist_client': 'Für Client zulassen',
        'logs.question': 'Frage',
        'logs.matched_rules': 'Übereinstimmende Regeln',
        'logs.list_id': 'Listen-ID',
        'logs.answer': 'Antwort',
        'logs.type': 'Typ',
        'logs.value': 'Wert',
        'logs.ttl': 'TTL',
        'logs.view_json': 'Raw JSON anzeigen',

        // Zones
        'zones.title': 'DNS-Zonen',
        'zones.subtitle': 'Verwalten Sie DNS-Zonen und Active Directory-Domain-Weiterleitungen.',
        'zones.search_placeholder': 'Zonen, IPs suchen...',
        'zones.reset_cache': 'Cache zurücksetzen',
        'zones.refresh': 'Zonen aktualisieren',
        'zones.add_zone': 'Zone hinzufügen',
        'zones.error': 'Fehler',
        'zones.zone_domain': 'Zone / Domain',
        'zones.type': 'Typ',
        'zones.target': 'Ziel',
        'zones.status': 'Status',
        'zones.actions': 'Aktionen',
        'zones.active_directory': 'Active Directory',
        'zones.reverse_dns': 'Reverse DNS',
        'zones.primary': 'Primär',
        'zones.internal': 'Intern',
        'zones.active': 'Aktiv',
        'zones.pending': 'Ausstehend',
        'zones.delete_zone_confirm': 'Zone "{0}" löschen?\n\nDies wird:\n• Die Zone aus Technitium löschen\n• Die Weiterleitungsregel aus AdGuard entfernen',
        'zones.delete_ad_confirm': 'AD-Weiterleitung für "{0}" löschen?\n\nDies wird die Weiterleitungsregel aus AdGuard entfernen.',
        'zones.no_zones_match': 'Keine Zonen entsprechen Ihrer Suche.',
        'zones.no_zones_configured': 'Keine Zonen konfiguriert. Klicken Sie auf "Zone hinzufügen", um zu beginnen.',
        'zones.loading': 'Lade Zonen...',
        'zones.add_dns_zone': 'DNS-Zone hinzufügen',
        'zones.custom_zone': 'Benutzerdefinierte Zone',
        'zones.custom_zone_desc': 'Zone in Technitium erstellen (Primär oder Bedingt)',
        'zones.ad_domain': 'Active Directory',
        'zones.ad_domain_desc': 'Weiterleitung an vorhandene DC DNS-Server',
        'zones.reverse_dns_desc': 'PTR-Lookup-Helfer (in-addr.arpa)',
        'zones.ad_domain_name': 'AD Domain-Name',
        'zones.subnet': 'Subnetz (z.B. 192.168.1.0)',
        'zones.zone_name': 'Zonen-Name',
        'zones.will_create_zone': 'Erstellt Zone: ',
        'zones.dc_ips': 'Domain Controller IPs',
        'zones.dc_ips_desc': 'Kommagetrennte Liste von DC-IP-Adressen mit DNS-Rolle',
        'zones.zone_type': 'Zonen-Typ',
        'zones.upstream_provider': 'Upstream-Anbieter',
        'zones.select_provider': 'Anbieter auswählen...',
        'zones.forwarder_ip': 'Forwarder IP',
        'zones.protocol': 'Protokoll',
        'zones.forwarder_desc': 'DNS-Server, an den Anfragen weitergeleitet werden, wenn keine lokalen Einträge gefunden werden',
        'zones.ad_mode_desc': 'Active Directory Modus:',
        'zones.custom_mode_desc': 'Benutzerdefinierter Zonen-Modus:',
        'zones.conditional_forwarder_desc': 'Lokale Einträge werden aufgelöst, unbekannte Einträge weitergeleitet an ',
        'zones.manual_records_desc': 'Sie können A, CNAME, TXT Einträge manuell hinzufügen.',
        'zones.forwarding_notice': 'AdGuard leitet {0} an Technitium weiter.',
        'zones.creating': 'Erstelle...',
        'zones.add_ad_domain': 'AD Domain hinzufügen',
        'zones.create_zone': 'Zone erstellen',
        'zones.cache_cleared': 'DNS-Cache erfolgreich gelöscht!',
        'zones.cache_clear_error': 'Fehler beim Löschen des Caches',
        'zones.cache_clear_confirm': 'Sind Sie sicher, dass Sie den AdGuard DNS-Cache leeren möchten? Dies kann bei DNS-Problemen helfen, aber anfängliche Abfragen vorübergehend verlangsamen.',
        'zones.enter_dc_ip': 'Bitte geben Sie mindestens eine Domain Controller IP ein',
        'zones.enter_forwarder_ip': 'Bitte geben Sie eine Forwarder IP für die bedingte Weiterleitungszone ein',
        'zones.failed_create': 'Zone konnte nicht erstellt werden',
        'zones.failed_delete': 'Zone konnte nicht gelöscht werden',
        'zones.technitium_docker': 'Technitium (docker)',

        // Common
        'common.save_changes': 'Save Changes',
        'common.error': 'Error',
        'common.cancel': 'Cancel',
        'common.add': 'Add',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.retry': 'Retry',
        'common.loading': 'Laden...',
        'common.optional': 'Optional',
    },
};
