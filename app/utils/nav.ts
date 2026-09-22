export function navTestId(to: string): string {
    return to.replace(/^\//, '').replaceAll('/', '-') || 'home'
}
