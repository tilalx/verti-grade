import PocketBase from 'pocketbase'
import type { Page } from '@playwright/test'

export const LOCATIONS = ['Hall A', 'Hall B'] as const
export const TYPES = ['Route', 'Boulder'] as const

export interface SeededUser {
    id: string
    email: string
    password: string
    role: 'admin' | 'routesetter' | 'user'
}

export async function authAsSuperuser(pb: PocketBase) {
    const email = process.env.PB_SUPERUSER_EMAIL || 'e2e-super@verti-grade.test'
    const password = process.env.PB_SUPERUSER_PASSWORD || 'e2e-superuser-pw-123'
    await pb.collection('_superusers').authWithPassword(email, password)
}

export async function getRoleIds(pb: PocketBase) {
    const roles = await pb.collection('roles').getFullList({ requestKey: null })
    const byName: Record<string, string> = {}
    for (const r of roles) byName[r.name] = r.id
    return byName
}

export async function ensureUser(
    pb: PocketBase,
    roleId: string,
    role: SeededUser['role'],
    prefix: string,
): Promise<SeededUser> {
    const email = `${prefix}-${role}@verti-grade.test`
    const password = 'E2ePassw0rd!'

    let record
    try {
        record = await pb
            .collection('users')
            .getFirstListItem(`email = "${email}"`, { requestKey: null })
    } catch {
        record = await pb.collection('users').create({
            email,
            emailVisibility: true,
            password,
            passwordConfirm: password,
            verified: true,
            username: `${prefix}${role}`,
            firstname: 'E2E',
            name: role,
            role: roleId,
        })
    }

    return { id: record.id, email, password, role }
}

export async function ensureLocations(pb: PocketBase) {
    const idByName: Record<string, string> = {}
    for (const name of LOCATIONS) {
        let record
        try {
            record = await pb
                .collection('locations')
                .getFirstListItem(pb.filter('name = {:name}', { name }), {
                    requestKey: null,
                })
        } catch {
            record = await pb.collection('locations').create({ name })
        }
        idByName[name] = record.id
    }
    return idByName
}

export async function locationId(page: Page, name: string) {
    const response = await page.request.get(
        '/api/collections/locations/records',
        { params: { filter: `name = "${name}"` } },
    )
    const { items } = await response.json()
    return items[0].id as string
}

function randomDifficulty() {
    return 1 + Math.floor(Math.random() * 10)
}

export async function seedRoutes(pb: PocketBase, prefix: string, count = 60) {
    const locationIds = await ensureLocations(pb)
    const locationFor = (index: number) =>
        locationIds[LOCATIONS[index % LOCATIONS.length]]

    const existing = await pb.collection('routes').getFullList({
        filter: `name ~ "${prefix}-route-"`,
        requestKey: null,
    })
    for (const route of existing) {
        const index = Number(route.name.split('-').pop())
        if (route.location !== locationFor(index)) {
            await pb
                .collection('routes')
                .update(route.id, { location: locationFor(index) })
        }
    }
    if (existing.length >= count) return existing

    const created = [...existing]
    for (let i = existing.length; i < count; i++) {
        const route = await pb.collection('routes').create({
            name: `${prefix}-route-${i}`,
            difficulty: randomDifficulty(),
            difficulty_sign: i % 3 === 0 ? true : i % 3 === 1 ? false : null,
            anchor_point: 1 + (i % 40),
            location: locationFor(i),
            type: TYPES[i % TYPES.length],
            comment: `Seed comment ${i}`,
            creator: [`Setter ${1 + (i % 5)}`],
            screw_date: new Date(Date.now() - i * 86_400_000)
                .toISOString()
                .slice(0, 10),
            color: '#F44336',
            archived: i % 10 === 0,
        })
        created.push(route)
    }
    return created
}

export async function seedRatings(
    pb: PocketBase,
    prefix: string,
    routes: { id: string }[],
    count = 40,
) {
    const existing = await pb.collection('ratings').getFullList({
        filter: `comment ~ "${prefix}-rating-"`,
        requestKey: null,
    })
    if (existing.length >= count) return existing

    const created = [...existing]
    for (let i = existing.length; i < count; i++) {
        const route = routes[i % routes.length]
        const rating = await pb.collection('ratings').create({
            route_id: route.id,
            rating: 1 + (i % 5),
            difficulty: randomDifficulty(),
            difficulty_sign: null,
            comment: `${prefix}-rating-${i}`,
        })
        created.push(rating)
    }
    return created
}
