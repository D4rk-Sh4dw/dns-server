'use client'

import { SessionProvider } from "next-auth/react"
import { I18nProvider } from "@/lib/i18n-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <SessionProvider>{children}</SessionProvider>
        </I18nProvider>
    )
}
