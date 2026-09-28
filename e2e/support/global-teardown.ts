import { adminClient, authAsSuperuser, sweepTestData } from './seed'
import { restoreSnapshot } from './state-snapshot'

export default async function globalTeardown() {
    const pb = adminClient()
    await authAsSuperuser(pb)
    await sweepTestData(pb, 'e2e-w')
    for (const notification of await pb
        .collection('notifications')
        .getFullList({ filter: 'user.email ~ "@gripello.test"', fields: 'id' }))
        await pb.collection('notifications').delete(notification.id)
    await restoreSnapshot(pb)
}
