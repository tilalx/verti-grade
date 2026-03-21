export interface SortOption {
    key: string
    order?: 'asc' | 'desc' | string
}

/**
 * Converts a VDataTable sortBy array to a PocketBase sort string.
 * Falls back to `defaultSort` when the array is empty or absent.
 */
export function toPbSort(sortByArr: SortOption[], defaultSort = '-created'): string {
    if (!Array.isArray(sortByArr) || !sortByArr.length) {
        return defaultSort
    }
    return sortByArr
        .map((sort) => (sort.order === 'desc' ? `-${sort.key}` : sort.key))
        .join(',')
}
