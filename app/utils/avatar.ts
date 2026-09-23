const AVATAR_COLORS = [
    'primary',
    'secondary',
    'success',
    'info',
    'deep-purple',
    'teal',
    'indigo',
    'pink',
    'cyan',
    'orange',
]

export function avatarColor(name: string | null | undefined): string {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length] ?? 'primary'
}

export function nameInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}
