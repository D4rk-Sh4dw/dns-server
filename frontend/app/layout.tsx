'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { LayoutDashboard, Shield, Globe, Settings, Menu, FileText, X, Users, Wifi, Network, Layers, LogOut, Cloud } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n-context'

import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black min-h-screen flex flex-col lg:flex-row shadow-2xl`}>
        <Providers>
          {pathname !== '/login' && (
            <>
              {/* Mobile Header */}
              <header className="lg:hidden h-16 flex items-center justify-between px-4 bg-gray-950 border-b border-gray-900 sticky top-0 z-50">
                <div className="flex items-center">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
                  <span className="font-bold text-white text-lg">UnifiedDNS</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </header>

              {/* Backdrop for mobile */}
              {isMobileMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {/* Sidebar */}
              <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-gray-900 flex-shrink-0 flex flex-col
          transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
                <div className="h-16 hidden lg:flex items-center px-6 border-b border-gray-900">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-3" />
                  <span className="font-bold text-white text-lg">UnifiedDNS</span>
                </div>

                <SidebarContent pathname={pathname} />

                <div className="p-4 border-t border-gray-900">
                  <LanguageSwitcher />
                  <AuthUserSection />
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-black min-h-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

function NavItem({ href, icon: Icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
        ? 'bg-blue-600/10 text-blue-400'
        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
        }`}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  const { t } = useTranslation();

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      <NavItem href="/" icon={LayoutDashboard} label={t('nav.overview')} active={pathname === '/'} />

      <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {t('nav.adguard_controls')}
      </div>
      <NavItem href="/filtering" icon={Shield} label={t('nav.filtering')} active={pathname === '/filtering'} />
      <NavItem href="/forwarding" icon={Network} label={t('nav.forwarding')} active={pathname === '/forwarding'} />
      <NavItem href="/services" icon={Menu} label={t('nav.service_blocking')} active={pathname === '/services'} />
      <NavItem href="/clients" icon={Users} label={t('nav.client_management')} active={pathname === '/clients'} />
      <NavItem href="/logs" icon={FileText} label={t('nav.query_log')} active={pathname === '/logs'} />


      <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {t('nav.technitium_controls')}
      </div>
      <NavItem href="/zones" icon={Globe} label={t('nav.zones_records')} active={pathname.startsWith('/zones')} />
      <NavItem href="/cloudflare" icon={Cloud} label="Cloudflare" active={pathname.startsWith('/cloudflare')} />

      <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {t('nav.system')}
      </div>
      <NavItem href="/dhcp" icon={Wifi} label={t('nav.dhcp')} active={pathname === '/dhcp'} />
      <NavItem href="/advanced" icon={Layers} label={t('nav.advanced')} active={pathname === '/advanced'} />
      <NavItem href="/settings" icon={Settings} label={t('nav.settings')} active={pathname === '/settings'} />
    </nav>
  )
}

function AdminUserLabel() {
  const { t } = useTranslation();
  return <>{t('user.admin')}</>
}

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex bg-gray-900 rounded-lg p-1 mb-2">
      <button
        onClick={() => setLanguage('en')}
        className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('de')}
        className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-medium transition-colors ${language === 'de' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
      >
        DE
      </button>
    </div>
  )
}

function AuthUserSection() {
  const { t } = useTranslation();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true';

  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
          AD
        </div>
        <div className="text-sm">
          <p className="text-white font-medium"><AdminUserLabel /></p>
          <p className="text-gray-500 text-xs">admin@local</p>
        </div>
      </div>
      {!authDisabled && (
        <button
          onClick={() => {
            import('next-auth/react').then(({ signOut }) => {
              signOut({ redirect: false }).then(() => {
                window.location.href = '/login';
              });
            });
          }}
          className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}
