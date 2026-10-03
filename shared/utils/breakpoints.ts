export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const

export function viewportBucket(width: number) {
    return Object.values(BREAKPOINTS).filter((min) => width >= min).length
}
