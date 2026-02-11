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
    | 'dashboard.unknown';

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
    },
};
