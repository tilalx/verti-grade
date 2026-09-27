export function normalizeHexColor(color: unknown): string {
    const match = /^#?([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?$/.exec(
        typeof color === 'string' ? color.trim() : '',
    )
    return match ? `#${match[1]!.toUpperCase()}` : '#9E9E9E'
}
