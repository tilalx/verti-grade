/// <reference path="../pb_data/types.d.ts" />

// Notifications are written by whichever hook raises them (see
// pb_hooks/utils/notifications.js); this file only keeps the queue from
// growing without bound.
//
// One DELETE rather than fetch-and-delete, so the cost does not grow with the
// size of the backlog -- same shape as the audit retention prune.
//
// Fixed windows rather than a settings field: read items are spent, and an
// unread item nobody has looked at in three months is not news any more.
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
        } catch (err) {
            // Driver did not report a count; the prune still ran.
        }

        $app.logger().info(
            'notifications: pruned expired entries',
            'rows',
            removed,
        )
    } catch (err) {
        $app.logger().error('notifications: prune failed', 'error', String(err))
    }
})
