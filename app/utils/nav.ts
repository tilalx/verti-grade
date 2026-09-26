export function navTestId(to: string): string {
    return to.replace(/^\//, '').replaceAll('/', '-') || 'home'
}

export function safeRedirect(target: unknown): string | null {
    if (typeof target !== 'string') return null
    if (!target.startsWith('/') || /^\/[/\\]/.test(target)) return null
    return target
}
