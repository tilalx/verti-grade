export interface NavLink {
    to: string
    icon: string
    label: string
    permission?: string
}

export interface NavItem extends Partial<NavLink> {
    key: string
    icon: string
    label: string
    children?: NavLink[]
}

type Can = (permission: string) => boolean

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
        key: 'logbook',
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

export function visibleNavItems(can: Can): NavItem[] {
    return NAV_ITEMS.map((item) =>
        item.children
            ? { ...item, children: item.children.filter(allowed(can)) }
            : item,
    ).filter((item) =>
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
