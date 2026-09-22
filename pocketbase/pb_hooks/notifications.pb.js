/// <reference path="../pb_data/types.d.ts" />

const READ_RETENTION_DAYS = 30
const MAX_RETENTION_DAYS = 90

cronAdd('notificationRetention', '23 3 * * *', () => {
    function cutoff(days) {
        return new Date(Date.now() - days * 86400000)
            .toISOString()
            .replace('T', ' ')
    }

    try {
        const result = $app
            .db()
            .newQuery(
                'DELETE FROM notifications WHERE (`read` = TRUE AND created < {:readCutoff}) OR created < {:maxCutoff}',
            )
            .bind({
                readCutoff: cutoff(READ_RETENTION_DAYS),
                maxCutoff: cutoff(MAX_RETENTION_DAYS),
            })
            .execute()

        let removed = -1
        try {
            removed = result.rowsAffected()
        } catch (err) {}

        $app.logger().info(
            'notifications: pruned expired entries',
            'rows',
            removed,
        )
    } catch (err) {
        $app.logger().error('notifications: prune failed', 'error', String(err))
    }
})
