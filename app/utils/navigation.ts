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
    { to: '/map', icon: 'mdi-map-outline', label: 'routes.map' },
    { to: '/scan', icon: 'mdi-qrcode-scan', label: 'routes.scan' },
    {
        to: '/logbook',
        icon: 'mdi-notebook-check-outline',
        label: 'routes.logbook',
    },
    { to: '/account', icon: 'mdi-account-circle-outline', label: 'routes.me' },
]

export const NAV_ITEMS: NavItem[] = [
    {
        key: 'home',
        to: '/',
        icon: 'mdi-home-outline',
        label: 'routes.home',
    },
    {
        key: 'map',
        to: '/map',
        icon: 'mdi-map-outline',
        label: 'routes.map',
    },
    {
        key: 'list',
        to: '/routes',
        icon: 'mdi-format-list-bulleted',
        label: 'routes.list',
    },
    {
        key: 'logbook',
        signedIn: true,
        to: '/logbook',
        icon: 'mdi-notebook-check-outline',
        label: 'routes.logbook',
    },
    {
        key: 'routes',
        to: '/manage/routes',
        icon: 'mdi-map-marker-path',
        label: 'routes.dashboard',
        permission: 'manage_routes',
    },
    {
        key: 'manage',
        icon: 'mdi-tune-variant',
        label: 'nav.manage',
        children: [
            {
                to: '/manage/map',
                icon: 'mdi-map-marker-radius-outline',
                label: 'routes.mapPlacement',
                permission: 'manage_routes',
            },
            {
                to: '/manage/inventory',
                icon: 'mdi-package-variant-closed',
                label: 'routes.inventory',
                permission: 'run_inventory',
            },
            {
                to: '/manage/comments',
                icon: 'mdi-comment-outline',
                label: 'routes.comments',
                permission: 'manage_comments',
            },
            {
                to: '/manage/reports',
                icon: 'mdi-flag-outline',
                label: 'routes.reports',
                permission: 'manage_reports',
            },
            {
                to: '/manage/analytics',
                icon: 'mdi-chart-line',
                label: 'routes.analytics',
                permission: 'view_analytics',
            },
        ],
    },
    {
        key: 'admin',
        icon: 'mdi-shield-account-outline',
        label: 'nav.admin',
        children: [
            {
                to: '/admin/users',
                icon: 'mdi-account-group-outline',
                label: 'routes.users',
                permission: 'manage_users',
            },
            {
                to: '/admin/settings',
                icon: 'mdi-cog-outline',
                label: 'routes.settings',
                permission: 'manage_settings',
            },
            {
                to: '/admin/map',
                icon: 'mdi-floor-plan',
                label: 'routes.mapEditor',
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
    const staffLinks = NAV_ITEMS.filter(
        (item) => !item.children && item.permission,
    ) as NavLink[]
    return NAV_ITEMS.filter((item) => item.children)
        .map((group) => ({
            key: group.key,
            label: group.label,
            links: [
                ...(group.key === 'manage' ? staffLinks : []),
                ...group.children!,
            ].filter(allowed(can)),
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
