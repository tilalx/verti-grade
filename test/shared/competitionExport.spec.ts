import { describe, expect, it } from 'vitest'
import {
    standingsTable,
    startListTable,
    type ExportLabels,
} from '#shared/utils/competitionExport'

const labels: ExportLabels = {
    rank: 'Rank',
    bib: 'Bib',
    name: 'Name',
    tops: 'Tops',
    zones: 'Zones',
    points: 'Points',
    category: 'Category',
    birthYear: 'Born',
    status: 'Status',
    paid: 'Paid',
    yes: 'yes',
    no: 'no',
    anonymous: 'Hidden',
    statuses: { checked_in: 'Checked in', registered: 'Registered' },
}

const categories = [
    {
        id: 'f',
        name: 'Female',
        rows: [
            {
                entry: 'a',
                rank: 1,
                bib: 4,
                name: 'Anna',
                points: 1500,
                tops: 2,
                zones: 2,
            },
            {
                entry: 'b',
                rank: 2,
                bib: 7,
                name: '',
                points: 500,
                tops: 1,
                zones: 1,
            },
        ],
    },
]

describe('standingsTable', () => {
    it('lists points, tops and zones per category', () => {
        expect(standingsTable(categories, 'dynamic', labels)).toEqual({
            headers: ['Rank', 'Bib', 'Name', 'Tops', 'Zones', 'Points'],
            nameColumn: 2,
            rankColumn: true,
            sections: [
                {
                    title: 'Female',
                    rows: [
                        [1, 4, 'Anna', 2, 2, 1500],
                        [2, 7, 'Hidden', 1, 1, 500],
                    ],
                },
            ],
        })
    })

    it('skips categories without results', () => {
        const empty = { id: 'm', name: 'Male', rows: [] }
        expect(
            standingsTable([...categories, empty], 'dynamic', labels).sections,
        ).toHaveLength(1)
    })

    it('drops columns the format does not use', () => {
        expect(standingsTable(categories, 'tops', labels).headers).toEqual([
            'Rank',
            'Bib',
            'Name',
            'Tops',
            'Zones',
        ])
        const lead = standingsTable(
            [
                {
                    ...categories[0]!,
                    rows: [{ ...categories[0]!.rows[0]!, rankPoints: 1.581 }],
                },
            ],
            'lead_height',
            labels,
        )
        expect(lead.headers).toEqual(['Rank', 'Bib', 'Name', 'Points'])
        expect(lead.sections[0]!.rows[0]).toEqual([1, 4, 'Anna', 1.581])
    })
})

describe('startListTable', () => {
    it('groups entries by category in bib order', () => {
        const table = startListTable(
            [
                {
                    bib: 9,
                    display_name: 'Zoe',
                    category: 'f',
                    birth_year: 2000,
                    status: 'registered',
                    paid: false,
                },
                {
                    bib: 2,
                    display_name: 'Ida',
                    category: 'f',
                    birth_year: 1999,
                    status: 'checked_in',
                    paid: true,
                },
            ],
            [
                { id: 'f', name: 'Female' },
                { id: 'm', name: 'Male' },
            ],
            labels,
        )
        expect(table.sections).toHaveLength(1)
        expect(table.headers).toContain('Paid')
        expect(table.sections[0]!.rows).toEqual([
            [2, 'Ida', 1999, 'Checked in', 'yes'],
            [9, 'Zoe', 2000, 'Registered', 'no'],
        ])
    })
})

describe('startListTable without entry fee', () => {
    it('leaves out the paid column', () => {
        const table = startListTable(
            [
                {
                    bib: 1,
                    display_name: 'Ida',
                    category: 'f',
                    birth_year: 1999,
                    status: 'registered',
                    paid: false,
                },
            ],
            [{ id: 'f', name: 'Female' }],
            labels,
            false,
        )
        expect(table.headers).not.toContain('Paid')
        expect(table.sections[0]!.rows[0]).toEqual([
            1,
            'Ida',
            1999,
            'Registered',
        ])
    })
})
