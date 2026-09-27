export const NEW_ROUTE_WINDOW_DAYS = 14
export const POPULAR_MIN_RATINGS = 2

export interface OverviewRoute {
    id: string
    name: string
    type?: string | null
    grade?: string | null
    grade_system?: string | null
    grade_index?: number | null
    screw_date?: string | null
    wall?: string | null
    location?: string | null
    average_rating?: number | null
    ratings_count?: number | null
}

export interface WallSummary {
    id: string
    name: string
    location: string
    count: number
    easiest: string | null
    hardest: string | null
    newest: string | null
}

const DAY_MS = 86_400_000

function setTime(route: OverviewRoute): number {
    const time = new Date((route.screw_date ?? '').replace(' ', 'T')).getTime()
    return Number.isNaN(time) ? 0 : time
}

export function newRoutes<Route extends OverviewRoute>(
    routes: Route[],
    now: Date,
    days = NEW_ROUTE_WINDOW_DAYS,
): Route[] {
    const since = now.getTime() - days * DAY_MS
    return routes
        .filter((route) => {
            const time = setTime(route)
            return time > since && time <= now.getTime() + DAY_MS
        })
        .sort((a, b) => setTime(b) - setTime(a))
}

export function popularRoutes<Route extends OverviewRoute>(
    routes: Route[],
    limit: number,
): Route[] {
    return routes
        .filter(
            (route) =>
                (route.ratings_count ?? 0) >= POPULAR_MIN_RATINGS &&
                typeof route.average_rating === 'number',
        )
        .sort(
            (a, b) =>
                b.average_rating! - a.average_rating! ||
                (b.ratings_count ?? 0) - (a.ratings_count ?? 0),
        )
        .slice(0, limit)
}

export function gradeSpread(
    routes: OverviewRoute[],
    grades: string[],
): { grade: string; count: number }[] {
    const counts = new Map(grades.map((grade) => [grade, 0]))
    for (const route of routes) {
        if (route.grade && counts.has(route.grade))
            counts.set(route.grade, counts.get(route.grade)! + 1)
    }
    const used = grades.filter((grade) => counts.get(grade)! > 0)
    if (!used.length) return []
    const first = grades.indexOf(used[0]!)
    const last = grades.indexOf(used[used.length - 1]!)
    return grades
        .slice(first, last + 1)
        .map((grade) => ({ grade, count: counts.get(grade)! }))
}

export function wallSummaries(
    walls: {
        id: string
        name: string
        location: string
        sort?: number | null
    }[],
    routes: OverviewRoute[],
): WallSummary[] {
    return [...walls]
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((wall) => {
            const onWall = routes
                .filter((route) => route.wall === wall.id)
                .sort((a, b) => (a.grade_index ?? 0) - (b.grade_index ?? 0))
            const newest = onWall.reduce<OverviewRoute | null>(
                (best, route) =>
                    !best || setTime(route) > setTime(best) ? route : best,
                null,
            )
            return {
                id: wall.id,
                name: wall.name,
                location: wall.location,
                count: onWall.length,
                easiest: onWall[0]?.grade ?? null,
                hardest: onWall.at(-1)?.grade ?? null,
                newest: newest?.screw_date ?? null,
            }
        })
}

export function sentShare(
    routes: OverviewRoute[],
    sentIds: ReadonlySet<string>,
): { sent: number; total: number } {
    return {
        sent: routes.filter((route) => sentIds.has(route.id)).length,
        total: routes.length,
    }
}
