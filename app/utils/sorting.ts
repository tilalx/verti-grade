export interface SortOption {
    key: string
    order?: 'asc' | 'desc' | string
}

/**
 * Converts a VDataTable sortBy array to a PocketBase sort string.
 * Falls back to `defaultSort` when the array is empty or absent.
 * `keyMap` translates table column keys to PocketBase field names.
 */
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
