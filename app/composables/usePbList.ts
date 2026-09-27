import type { Ref } from 'vue'
import { isAbortError } from '~/utils/errors'

interface PbListQuery {
    filter?: string
    sort?: string
    expand?: string
    fields?: string
}

interface PbListOptions<TRecord, TItem> {
    perPage: number
    requestKey: string
    query: () => PbListQuery
    map?: (record: TRecord) => TItem
}

export function usePbList<TRecord, TItem = TRecord>(
    collection: string,
    options: PbListOptions<TRecord, TItem>,
) {
    const pb = usePocketbase()
    const { t } = useI18n()
    const { error: notifyError } = useNotification()

    const items = ref([]) as Ref<TItem[]>
    const totalItems = ref(0)
    const page = ref(1)
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref<unknown>(null)
    const hasMore = computed(() => items.value.length < totalItems.value)

    const toItem = (record: TRecord) =>
        options.map ? options.map(record) : (record as unknown as TItem)

    async function fetchPage(target: number, busy: Ref<boolean>) {
        busy.value = true
        error.value = null
        try {
            const result = await pb
                .collection(collection)
                .getList<TRecord>(target, options.perPage, {
                    ...options.query(),
                    requestKey: options.requestKey,
                })
            const mapped = result.items.map(toItem)
            items.value = target === 1 ? mapped : [...items.value, ...mapped]
            totalItems.value = result.totalItems
            page.value = target
        } catch (err) {
            if (isAbortError(err)) return
            error.value = err
            console.error(`Failed to fetch ${collection}:`, err)
            notifyError(t('notifications.error.generic'))
        } finally {
            busy.value = false
        }
    }

    function refresh() {
        items.value = []
        return fetchPage(1, loading)
    }

    async function loadMore() {
        if (loading.value || loadingMore.value || !hasMore.value) return
        await fetchPage(page.value + 1, loadingMore)
    }

    async function prefetch(key: string) {
        const { data } = await useAsyncData(key, async () => {
            await refresh()
            return { items: items.value, totalItems: totalItems.value }
        })
        if (data.value) {
            items.value = data.value.items as TItem[]
            totalItems.value = data.value.totalItems
        }
    }

    return {
        items,
        totalItems,
        loading,
        loadingMore,
        hasMore,
        error,
        refresh,
        loadMore,
        prefetch,
    }
}
