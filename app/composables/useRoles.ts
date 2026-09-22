import type { RoleRecord } from '~/types/models'

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
