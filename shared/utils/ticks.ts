export const TICK_TYPES = ['flash', 'top', 'attempt'] as const
export type TickType = (typeof TICK_TYPES)[number]

export function tickDay(date: string | null | undefined): string {
    return (date ?? '').slice(0, 10)
}

export function tickDate(day: string): string {
    return `${day} 12:00:00.000Z`
}

export function groupTicksByDay<T extends { date: string }>(
    ticks: T[],
): { day: string; ticks: T[] }[] {
    const days = new Map<string, T[]>()
    for (const tick of ticks) {
        const day = tickDay(tick.date)
        days.set(day, [...(days.get(day) ?? []), tick])
    }
    return [...days.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([day, dayTicks]) => ({ day, ticks: dayTicks }))
}
