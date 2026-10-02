export interface NavLink {
    to: string
    icon: string
    label: string
    permission?: string
}

export interface NavItem extends Partial<NavLink> {
    key: string
    signedIn?: boolean
    icon: string
    label: string
    children?: NavLink[]
}

type Can = (permission: string) => boolean

export const BOTTOM_NAV: NavLink[] = [
    { to: '/map', icon: 'i-lucide-map', label: 'routes.map' },
    { to: '/scan', icon: 'i-lucide-scan-qr-code', label: 'routes.scan' },
    {
        to: '/logbook',
        icon: 'i-lucide-book-check',
        label: 'routes.logbook',
    },
    { to: '/account', icon: 'i-lucide-layout-grid', label: 'routes.me' },
]

export const NAV_ITEMS: NavItem[] = [
    {
        key: 'home',
        to: '/',
        icon: 'i-lucide-house',
        label: 'routes.home',
    },
    {
        key: 'list',
        to: '/routes',
        icon: 'i-lucide-list',
        label: 'routes.list',
    },
    {
        key: 'map',
        to: '/map',
        icon: 'i-lucide-map',
        label: 'routes.map',
    },
    {
        key: 'logbook',
        signedIn: true,
        to: '/logbook',
        icon: 'i-lucide-book-check',
        label: 'routes.logbook',
    },
    {
        key: 'manage',
        icon: 'i-lucide-sliders-horizontal',
        label: 'nav.manage',
        children: [
            {
                to: '/manage/routes',
                icon: 'i-lucide-waypoints',
                label: 'routes.dashboard',
                permission: 'manage_routes',
            },
            {
                to: '/manage/map',
                icon: 'i-lucide-map-pinned',
                label: 'routes.mapPlacement',
                permission: 'manage_routes',
            },
            {
                to: '/manage/inventory',
                icon: 'i-lucide-package',
                label: 'routes.inventory',
                permission: 'run_inventory',
            },
            {
                to: '/manage/tasks',
                icon: 'i-lucide-list-checks',
                label: 'routes.tasks',
                permission: 'manage_tasks',
            },
            {
                to: '/manage/analytics',
                icon: 'i-lucide-chart-line',
                label: 'routes.analytics',
                permission: 'view_analytics',
            },
        ],
    },
    {
        key: 'moderation',
        icon: 'i-lucide-shield-check',
        label: 'nav.moderation',
        children: [
            {
                to: '/manage/comments',
                icon: 'i-lucide-message-square',
                label: 'routes.comments',
                permission: 'manage_comments',
            },
            {
                to: '/manage/reports',
                icon: 'i-lucide-flag',
                label: 'routes.reports',
                permission: 'manage_reports',
            },
        ],
    },
    {
        key: 'admin',
        icon: 'i-lucide-shield-user',
        label: 'nav.admin',
        children: [
            {
                to: '/admin/users',
                icon: 'i-lucide-users-round',
                label: 'routes.users',
                permission: 'manage_users',
            },
            {
                to: '/admin/map',
                icon: 'i-lucide-land-plot',
                label: 'routes.mapEditor',
                permission: 'manage_settings',
            },
            {
                to: '/admin/settings',
                icon: 'i-lucide-settings',
                label: 'routes.settings',
                permission: 'manage_settings',
            },
        ],
    },
]

const allowed = (can: Can) => (link: { permission?: string }) =>
    !link.permission || can(link.permission)

export function visibleNavItems(can: Can, signedIn = true): NavItem[] {
    return NAV_ITEMS.filter((item) => signedIn || !item.signedIn)
        .map((item) =>
            item.children
                ? { ...item, children: item.children.filter(allowed(can)) }
                : item,
        )
        .filter((item) =>
            item.children ? item.children.length > 0 : allowed(can)(item),
        )
}

export function staffSections(
    can: Can,
): { key: string; label: string; links: NavLink[] }[] {
    return NAV_ITEMS.filter((item) => item.children)
        .map((group) => ({
            key: group.key,
            label: group.label,
            links: group.children!.filter(allowed(can)),
        }))
        .filter((section) => section.links.length > 0)
}

export function pageLinks(signedIn: boolean): NavLink[] {
    const inBottomNav = new Set(BOTTOM_NAV.map((link) => link.to))
    return NAV_ITEMS.filter(
        (item) =>
            item.to &&
            !item.children &&
            !item.permission &&
            (signedIn || !item.signedIn) &&
            !inBottomNav.has(item.to),
    ) as NavLink[]
}
