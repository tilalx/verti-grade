import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { PB_URL } from '../../support/map'

test('deleting an account keeps its audit trail and records the deletion', async ({
    root,
    createUser,
}) => {
    const leaver = await createUser()

    const client = new PocketBase(PB_URL)
    await client
        .collection('users')
        .authWithPassword(leaver.email, leaver.password)
    const loginFilter = root.filter('action = "login" && record_id = {:id}', {
        id: leaver.id,
    })
    await expect
        .poll(() =>
            root
                .collection('audit_logs')
                .getList(1, 1, { filter: loginFilter, requestKey: null })
                .then((page) => page.totalItems),
        )
        .toBe(1)

    await client.collection('users').delete(leaver.id)

    const loginRows = await root
        .collection('audit_logs')
        .getFullList({ filter: loginFilter, requestKey: null })
    expect(loginRows).toHaveLength(1)
    expect(loginRows[0]!.actor).toBe('')
    expect(loginRows[0]!.actor_label).toBe(leaver.email)

    const deleteRow = await root
        .collection('audit_logs')
        .getFirstListItem(
            root.filter(
                'action = "delete" && collection_name = "users" && record_id = {:id}',
                { id: leaver.id },
            ),
            { requestKey: null },
        )
    expect(deleteRow.actor).toBe('')
    expect(deleteRow.actor_label).toBe(leaver.email)
})
