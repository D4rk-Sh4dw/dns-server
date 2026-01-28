import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { LayoutDashboard, Shield, Globe, Settings, Menu } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unified DNS Dashboard',
  description: 'Manage AdGuard Home and Technitium DNS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black min-h-screen flex`}>
        {/* Sidebar */}
        <aside className="w-64 bg-gray-950 border-r border-gray-900 flex-shrink-0 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-900">
            <Shield className="w-6 h-6 text-blue-500 mr-3" />
            <span className="font-bold text-white text-lg">UnifiedDNS</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <NavItem href="/" icon={LayoutDashboard} label="Overview" />

            <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              AdGuard Controls
            </div>
            <NavItem href="/filtering" icon={Shield} label="Filtering & Blocklists" />
            <NavItem href="/services" icon={Menu} label="Service Blocking" />

            <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Technitium Controls
            </div>
            <NavItem href="/zones" icon={Globe} label="Zones & Records" />

            <div className="mt-auto pt-4">
              <NavItem href="/settings" icon={Settings} label="Settings" />
            </div>
          </nav>

          <div className="p-4 border-t border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                AD
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">Admin User</p>
                <p className="text-gray-500 text-xs">admin@local</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-black">
          {children}
        </main>
      </body>
    </html>
  )
}

function NavItem({ href, icon: Icon, label }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
