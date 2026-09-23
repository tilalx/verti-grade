import { describe, expect, it, vi } from 'vitest'
import {
    resolveApplicationUrl,
    resolveExportColumns,
    resolveRouteIds,
} from '../../server/utils/export'

vi.mock('h3', async () => {
    return {
        getQuery: (event: any) => event.query ?? {},
        readBody: async (event: any) => {
            if (event.body === undefined) {
                throw new Error('no body')
            }
            return event.body
        },
        getRequestURL: () => new URL('https://request.example/manage/routes'),
    }
})

const eventWith = (body: unknown, query: Record<string, string> = {}) => ({
    body,
    query,
    context: {} as Record<string, unknown>,
})

describe('resolveExportColumns', () => {
    it('falls back to every column but the QR code when none are requested', async () => {
        const columns = await resolveExportColumns(eventWith({ ids: ['a'] }))

        expect(columns.map((column) => column.key)).toEqual([
            'color',
            'name',
            'difficulty',
            'anchor_point',
            'comment',
            'creator',
            'location',
            'type',
            'screw_date',
        ])
    })

    it('renders the columns in the requested order', async () => {
        const columns = await resolveExportColumns(
            eventWith({ columns: ['qr', 'difficulty', 'name'] }),
        )

        expect(columns.map((column) => column.key)).toEqual([
            'qr',
            'difficulty',
            'name',
        ])
    })

    it('drops unknown and duplicate keys', async () => {
        const columns = await resolveExportColumns(
            eventWith({ columns: ['name', '__proto__', 'nope', 'name'] }),
        )

        expect(columns.map((column) => column.key)).toEqual(['name'])
    })

    it('merges the difficulty sign into a numeric cell format', async () => {
        const [difficulty] = await resolveExportColumns(
            eventWith({ columns: ['difficulty'] }),
        )

        // Numeric value plus a display-only suffix: sorts as 6 < 10, reads "6 +".
        expect(
            difficulty.value!({ difficulty: 6, difficulty_sign: true }),
        ).toBe(6)
        expect(
            difficulty.numFmt!({ difficulty: 6, difficulty_sign: true }),
        ).toBe('0" +"')
        expect(
            difficulty.numFmt!({ difficulty: 5, difficulty_sign: null }),
        ).toBeNull()
        // Non-numeric grades keep the merged text instead.
        expect(
            difficulty.value!({ difficulty: 'VI', difficulty_sign: '-' }),
        ).toBe('VI-')
    })

    it('prefers client labels over the default headers', async () => {
        const columns = await resolveExportColumns(
            eventWith({ columns: ['name'], labels: { name: 'Nombre' } }),
        )

        expect(columns[0].header).toBe('Nombre')
    })

    it('ignores blank or non-string labels', async () => {
        const columns = await resolveExportColumns(
            eventWith({ columns: ['name'], labels: { name: '  ' } }),
        )

        expect(columns[0].header).toBe('Name')
    })

    it('renders creator values regardless of the stored shape', async () => {
        const columns = await resolveExportColumns(
            eventWith({ columns: ['creator'] }),
        )

        expect(columns[0].value!({ creator: 'Max, Moritz' })).toBe(
            'Max, Moritz',
        )
        expect(columns[0].value!({ creator: ['Max', 'Moritz'] })).toBe(
            'Max, Moritz',
        )
        expect(columns[0].value!({ creator: null })).toBe('')
    })
})

describe('resolveRouteIds', () => {
    it('reads ids from the body and reuses the cached body afterwards', async () => {
        const event = eventWith({ ids: [' a ', '', 'b'], columns: ['name'] })

        expect(await resolveRouteIds(event)).toEqual(['a', 'b'])

        // second read must not consume the stream again
        event.body = undefined
        expect((await resolveExportColumns(event))[0].key).toBe('name')
    })

    it('falls back to the comma-separated query parameter', async () => {
        expect(
            await resolveRouteIds(eventWith(undefined, { id: 'a, b ,' })),
        ).toEqual(['a', 'b'])
    })
})

describe('resolveApplicationUrl', () => {
    it('prefers the configured URL and strips trailing slashes', () => {
        expect(
            resolveApplicationUrl({} as never, {
                application_url: 'https://dav.example//',
            }),
        ).toBe('https://dav.example')
    })

    it('falls back to the request origin', () => {
        expect(resolveApplicationUrl({} as never, {})).toBe(
            'https://request.example',
        )
    })
})
