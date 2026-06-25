import { ReactNode } from 'react';

interface PageLayoutProps {
    children: ReactNode;
    /** Optional content to render into the sticky header (e.g. title, subtitle, actions) */
    header?: ReactNode;
    /** Disable the default page padding in the scroll area (useful when content fills the viewport, e.g. tables) */
    flush?: boolean;
    /** When true, removes the default top border below the sticky header */
    noHeaderBorder?: boolean;
}

/**
 * Consistent full-height page layout used across the app.
 *
 * Renders a sticky header that stays visible while the body scrolls,
 * plus a flex-1 scrollable content area. Mirrors the pattern used by the
 * Live Stream page for a uniform scrolling experience.
 */
export default function PageLayout({ children, header, flush, noHeaderBorder }: PageLayoutProps) {
    return (
        <div className="flex flex-col h-full bg-black min-h-0">
            {header && (
                <div
                    className={`flex-shrink-0 sticky top-0 z-20 bg-gray-950 ${
                        noHeaderBorder ? '' : 'border-b border-gray-800'
                    }`}
                >
                    {header}
                </div>
            )}
            <div className={`flex-1 min-h-0 overflow-y-auto ${flush ? '' : 'p-4 md:p-8'}`}>
                {children}
            </div>
        </div>
    );
}

interface PageHeaderProps {
    icon?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    /** Tightens the vertical padding (matches the compact Stream header) */
    dense?: boolean;
}

/**
 * Sticky page header matching the Live Stream aesthetic.
 * Use as the `header` prop of <PageLayout />.
 */
export function PageHeader({ icon, title, subtitle, actions, dense }: PageHeaderProps) {
    return (
        <div className={`flex items-center justify-between gap-4 ${dense ? 'px-6 py-3' : 'px-4 md:px-6 py-4'}`}>
            <div className="flex items-center gap-3 min-w-0">
                {icon && <div className="flex-shrink-0 text-blue-400">{icon}</div>}
                <div className="min-w-0">
                    <h1 className={`${dense ? 'text-lg' : 'text-xl md:text-2xl'} font-semibold text-white truncate`}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-gray-400 text-xs md:text-sm mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
    );
}
