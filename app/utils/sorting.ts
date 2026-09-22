export interface SortOption {
    key: string
    order?: 'asc' | 'desc' | string
}

export function toPbSort(
    sortByArr: SortOption[],
    defaultSort = '-created',
    keyMap: Record<string, string> = {},
): string {
    if (!Array.isArray(sortByArr) || !sortByArr.length) {
        return defaultSort
    }
    return sortByArr
        .map((sort) => {
            const key = keyMap[sort.key] ?? sort.key
            return sort.order === 'desc' ? `-${key}` : key
        })
        .join(',')
}
