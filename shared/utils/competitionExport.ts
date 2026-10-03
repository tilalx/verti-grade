import type { CategoryStanding } from './competitionResults'
import type { ScoringFormat } from './competitionScoring'

export type ExportCell = string | number

export interface ExportSection {
    title: string
    rows: ExportCell[][]
}

export interface ExportTable {
    headers: string[]
    nameColumn: number
    rankColumn: boolean
    sections: ExportSection[]
}

export interface ExportLabels {
    rank: string
    bib: string
    name: string
    tops: string
    zones: string
    points: string
    category: string
    birthYear: string
    status: string
    paid: string
    yes: string
    no: string
    anonymous: string
    statuses: Record<string, string>
}

export function standingsTable(
    categories: CategoryStanding[],
    format: ScoringFormat,
    labels: ExportLabels,
): ExportTable {
    const showPoints = format !== 'tops'
    const showTopsZones = format !== 'lead_height'
    const headers = [
        labels.rank,
        labels.bib,
        labels.name,
        ...(showTopsZones ? [labels.tops, labels.zones] : []),
        ...(showPoints ? [labels.points] : []),
    ]
    return {
        headers,
        nameColumn: 2,
        rankColumn: true,
        sections: categories
            .filter((category) => category.rows.length)
            .map((category) => ({
                title: category.name,
                rows: category.rows.map((row) => [
                    row.rank,
                    row.bib,
                    row.name || labels.anonymous,
                    ...(showTopsZones ? [row.tops, row.zones] : []),
                    ...(showPoints ? [row.rankPoints ?? row.points] : []),
                ]),
            })),
    }
}

export function startListTable(
    entries: {
        bib: number
        display_name: string
        category: string
        birth_year: number
        status: string
        paid: boolean
    }[],
    categories: { id: string; name: string }[],
    labels: ExportLabels,
    withPaid = true,
): ExportTable {
    return {
        headers: [
            labels.bib,
            labels.name,
            labels.birthYear,
            labels.status,
            ...(withPaid ? [labels.paid] : []),
        ],
        nameColumn: 1,
        rankColumn: false,
        sections: categories
            .map((category) => ({
                title: category.name,
                rows: entries
                    .filter((entry) => entry.category === category.id)
                    .sort((a, b) => a.bib - b.bib)
                    .map((entry) => [
                        entry.bib,
                        entry.display_name,
                        entry.birth_year,
                        labels.statuses[entry.status] ?? entry.status,
                        ...(withPaid
                            ? [entry.paid ? labels.yes : labels.no]
                            : []),
                    ]),
            }))
            .filter((section) => section.rows.length),
    }
}
