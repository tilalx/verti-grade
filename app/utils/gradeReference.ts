export type ReferenceLabels = [label: string, index: number][]
export type ReferenceBand = [label: string, from: number, to: number]

export const CLIMBER_LEVELS = [
    'lower',
    'intermediate',
    'advanced',
    'elite',
    'higherElite',
] as const

function levelBands(boundaries: number[]): ReferenceBand[] {
    const edges = [0.5, ...boundaries, 32.5]
    return CLIMBER_LEVELS.map((level, i) => [level, edges[i]!, edges[i + 1]!])
}

export const MALE_LEVELS = levelBands([9.5, 17.5, 23.5, 27.5])
export const FEMALE_LEVELS = levelBands([9.5, 14.5, 20.5, 26.5])

export const BRITISH_TECH_LANES: ReferenceBand[][] = [
    [
        ['3', 1.6, 5.6],
        ['5a', 7.6, 10.2],
        ['5c', 10.5, 14.4],
        ['6b', 14.7, 21.4],
        ['7a', 21.8, 28.2],
    ],
    [
        ['2', 0.6, 2.5],
        ['4', 3.6, 8.4],
        ['5b', 9.7, 12.3],
        ['6a', 12.7, 17.3],
        ['6c', 17.8, 24.5],
        ['7b', 26.6, 32.5],
    ],
]

export const EWBANK: ReferenceLabels = [
    ['4', 1],
    ['6', 2.1],
    ['8', 3.4],
    ['10', 4.7],
    ['12', 6],
    ['14', 7.4],
    ['16', 8.7],
    ['18', 10],
    ['19', 11.3],
    ['20', 12.8],
    ['21', 14.2],
    ['22', 15.6],
    ['23', 17],
    ...Array.from(
        { length: 15 },
        (_, i) => [String(24 + i), 18.2 + i] as [string, number],
    ),
]

export const BRAZILIAN: ReferenceLabels = [
    ['I sup', 1],
    ['II', 2],
    ['II sup', 3],
    ['III', 4],
    ['IV', 5],
    ['V', 6.5],
    ['V sup', 8.5],
    ['VI', 10.5],
    ['VI sup', 12.5],
    ['7a', 14.3],
    ['7b', 15.5],
    ['7c', 16.8],
    ['8a', 18],
    ['8b', 19],
    ['8c', 20],
    ['9a', 20.9],
    ['9b', 21.9],
    ['9c', 23],
    ['10a', 24],
    ['10b', 25],
    ['10c', 26],
    ['11a', 27],
    ['11b', 28],
    ['11c', 29],
    ['12a', 30],
    ['12b', 31],
    ['12c', 32],
]

export const METRIC_UIAA: Record<string, string> = {
    '1': '1.00',
    '2': '2.00',
    '3': '3.00',
    '3+': '3.50',
    '4': '4.00',
    '4+': '4.33',
    '5-': '4.66',
    '5': '5.00',
    '5+': '5.33',
    '6-': '5.66',
    '6': '6.00',
    '6+': '6.33',
    '7-': '6.66',
    '7': '7.00',
    '7+': '7.33',
    '8-': '7.66',
    '8': '8.00',
    '8+': '8.33',
    '9-': '8.66',
    '9': '9.00',
    '9+': '9.33',
    '10-': '9.66',
    '10': '10.00',
    '10+': '10.33',
    '11-': '10.66',
    '11': '11.00',
    '11+': '11.33',
    '12-': '11.66',
    '12': '12.00',
}

export const WATTS: ReferenceLabels = Array.from({ length: 27 }, (_, i) => [
    (i * 0.25).toFixed(2),
    6 + i,
])
