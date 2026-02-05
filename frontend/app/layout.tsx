'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { LayoutDashboard, Shield, Globe, Settings, Menu, FileText, X, Users, Wifi, Network, Layers, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

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
                  <Shield className="w-6 h-6 text-blue-500 mr-2" />
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
                  <Shield className="w-6 h-6 text-blue-500 mr-3" />
                  <span className="font-bold text-white text-lg">UnifiedDNS</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  <NavItem href="/" icon={LayoutDashboard} label="Overview" active={pathname === '/'} />

                  <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    AdGuard Controls
                  </div>
                  <NavItem href="/filtering" icon={Shield} label="Filtering & Blocklists" active={pathname === '/filtering'} />
                  <NavItem href="/forwarding" icon={Network} label="Forwarding / Zones" active={pathname === '/forwarding'} />
                  <NavItem href="/services" icon={Menu} label="Service Blocking" active={pathname === '/services'} />
                  <NavItem href="/clients" icon={Users} label="Client Management" active={pathname === '/clients'} />
                  <NavItem href="/logs" icon={FileText} label="Query Log" active={pathname === '/logs'} />
                  <NavItem href="/dhcp" icon={Wifi} label="DHCP Server" active={pathname === '/dhcp'} />

                  <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Technitium Controls
                  </div>
                  <NavItem href="/zones" icon={Globe} label="Zones & Records" active={pathname.startsWith('/zones')} />

                  <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    System
                  </div>
                  <NavItem href="/advanced" icon={Layers} label="Advanced Access" active={pathname === '/advanced'} />

                  <div className="mt-auto pt-4 border-t border-gray-900/50">
                    <NavItem href="/settings" icon={Settings} label="Settings" active={pathname === '/settings'} />
                  </div>
                </nav>

                <div className="p-4 border-t border-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        AD
                      </div>
                      <div className="text-sm">
                        <p className="text-white font-medium">Admin User</p>
                        <p className="text-gray-500 text-xs">admin@local</p>
                      </div>
                    </div>
                    <button
                      onClick={() => import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/login' }))}
                      className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
                      title="Log Out"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
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
