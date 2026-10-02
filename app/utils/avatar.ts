const AVATAR_COLORS = [
    'var(--ui-primary)',
    'var(--ui-secondary)',
    'var(--ui-success)',
    'var(--ui-info)',
    '#673ab7',
    '#009688',
    '#3f51b5',
    '#e91e63',
    '#00bcd4',
    '#ff9800',
]

export function avatarColor(name: string | null | undefined): string {
    if (!name) return 'var(--ui-primary)'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length] ?? 'var(--ui-primary)'
}

export function nameInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}
