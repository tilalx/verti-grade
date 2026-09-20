import type { RoleRecord } from '~/types/models'

/**
 * The role list, fetched once per page load. Every caller shares the same
 * useAsyncData key, so the page and the user dialogs that all render a role
 * picker resolve to one request instead of one each — and it resolves during
 * SSR, so the pickers are populated on first paint.
 *
 * Read-only by contract: the data is shared, so callers that need to mutate a
 * role record must work on their own copy.
 */
export function useRoles() {
    const pb = usePocketbase()

    return useAsyncData<RoleRecord[]>(
        'roles',
        () =>
            pb.collection('roles').getFullList<RoleRecord>({
                sort: 'name',
                requestKey: 'rolesList',
            }),
        { default: () => [] },
    )
}
