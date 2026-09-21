/// <reference path="../pb_data/types.d.ts" />

// DSA Art. 16 notice-and-action hooks.
//
// The reports collection is publicly writable (Art. 16(1) requires accepting a
// notice from *any* individual or entity, including anonymous ones), so every
// field that records what the operator decided is stamped server-side here and
// can never be set by the submitter.

onRecordCreateRequest((e) => {
    e.record.set('status', 'open')
    e.record.set('decision', '')
    e.record.set('decision_reason', '')
    e.record.set('decided_at', '')
    e.record.set('decided_by', '')
    e.record.set('receipt_sent', false)
    e.record.set('notified_at', '')

    // Snapshot the reported content so the audit trail survives its deletion.
    let snapshot = ''
    try {
        const id = e.record.get('content_id')
        if (e.record.get('content_type') === 'route') {
            const route = e.app.findRecordById('routes', id)
            snapshot = [route.get('name'), route.get('comment')]
                .filter(Boolean)
                .join(' - ')
        } else {
            snapshot = e.app.findRecordById('ratings', id).get('comment') || ''
        }
    } catch (err) {
        // A notice about already-deleted content is still a valid notice.
        snapshot = ''
    }
    e.record.set('content_snapshot', String(snapshot).slice(0, 5000))

    e.next()
}, 'reports')

// Art. 16(4): confirm receipt to the notifier without undue delay, and alert
// everyone who can act on it.
onRecordAfterCreateSuccess((e) => {
    const utils = require(`${__hooks}/utils/reports.js`)

    // Before the mail block, which returns early when SMTP is off -- and with
    // mail off this queue is the only thing that says a report came in.
    try {
        const notifications = require(`${__hooks}/utils/notifications.js`)
        const snippet = String(e.record.get('content_snapshot') || '').slice(
            0,
            140,
        )

        notifications.push(e.app, {
            users: notifications.usersByPermission(e.app, 'manage_reports'),
            type: 'report_filed',
            params: { snippet: snippet },
            // The queue, not the reported comment: that is where the decide
            // buttons are, and the card links on to the content itself.
            url: '/manage/reports',
        })
    } catch (err) {
        e.app
            .logger()
            .error(
                'reports: failed to queue report_filed notification',
                'report',
                e.record.id,
                'error',
                String(err),
            )
    }

    try {
        if (!utils.mailEnabled(e.app)) {
            e.app
                .logger()
                .warn(
                    'reports: SMTP disabled, Art. 16(4) receipt not sent',
                    'report',
                    e.record.id,
                )
            e.next()
            return
        }

        const appName = e.app.settings().meta.appName
        const summary = utils.reportSummaryHtml(e.app, e.record)

        const receiptSent = utils.send(
            e.app,
            [e.record.get('notifier_email')],
            `We received your report - ${appName}`,
            `<p>Hello ${utils.escapeHtml(e.record.get('notifier_name'))},</p>
             <p>We have received your report and will review it without undue delay.
             You will be informed of the decision and of the ways to challenge it.</p>
             ${summary}
             <p>Reference: ${utils.escapeHtml(e.record.id)}</p>`,
        )

        utils.send(
            e.app,
            utils.alertRecipients(e.app),
            `New content report - ${appName}`,
            `<p>A new report was submitted and is awaiting review.</p>
             ${summary}
             <p><strong>Reported by:</strong> ${utils.escapeHtml(e.record.get('notifier_name'))}
             (${utils.escapeHtml(e.record.get('notifier_email'))})</p>
             <p><a href="${utils.escapeHtml(utils.appUrl(e.app))}/manage/reports">Open the moderation queue</a></p>`,
        )

        if (receiptSent) {
            e.record.set('receipt_sent', true)
            e.app.save(e.record)
        }
    } catch (err) {
        // Never fail the notice because mail is down. receipt_sent stays false,
        // which is what the admin queue surfaces as an undelivered receipt.
        e.app
            .logger()
            .error(
                'reports: receipt/alert mail failed',
                'report',
                e.record.id,
                'error',
                String(err),
            )
    }

    e.next()
}, 'reports')

// Art. 16(5): once a human has decided, tell the notifier what was decided and
// how to challenge it.
onRecordAfterUpdateSuccess((e) => {
    const utils = require(`${__hooks}/utils/reports.js`)

    // Queued before the mail block on purpose: that block returns early when
    // SMTP is off, and a silent queue is exactly what this is here to prevent.
    //
    // Two guards, because neither alone is enough:
    //
    //  - status having just left "open" stops a later edit of an already
    //    decided report from re-queueing.
    //  - a blank notified_at stops the double-fire: the mail block below
    //    re-saves the record to stamp notified_at, which re-enters this hook,
    //    and original() on that second pass still reports the pre-decision
    //    status. With mail off there is no re-save and no second pass, so this
    //    guard costs nothing there.
    try {
        const notifications = require(`${__hooks}/utils/notifications.js`)
        const status = String(e.record.get('status') || '')
        const wasOpen =
            String(e.record.original().get('status') || '') === 'open'
        const freshDecision = utils.isBlankDate(e.record.get('notified_at'))

        if (wasOpen && status && status !== 'open' && freshDecision) {
            // RecordEvent carries no auth, but the moderation UI stamps
            // decided_by (app/pages/manage/reports.vue), so the moderator who
            // decided is skipped rather than told what they just did.
            //
            // A relation reads back as an array in some PocketBase paths even
            // at maxSelect 1, and a bare String() on the wrong shape silently
            // matches nobody -- which is how the decider ended up notified.
            const decidedBy = e.record.get('decided_by')
            const decider = Array.isArray(decidedBy)
                ? String(decidedBy[0] || '')
                : String(decidedBy || '')
            const recipients = notifications
                .usersByPermission(e.app, 'manage_reports')
                .filter((user) => user.id !== decider)

            notifications.push(e.app, {
                users: recipients,
                type:
                    e.record.get('decision') === 'content_removed'
                        ? 'report_decided_removed'
                        : 'report_decided_kept',
                params: {},
                url: '/manage/reports',
            })
        }
    } catch (err) {
        e.app
            .logger()
            .error(
                'reports: failed to queue report_decided notification',
                'report',
                e.record.id,
                'error',
                String(err),
            )
    }

    try {
        const status = e.record.get('status')
        // notified_at guards the re-save below from looping -- via isBlankDate,
        // because an unset date is a truthy object, not an empty string.
        if (
            status === 'open' ||
            !utils.isBlankDate(e.record.get('notified_at'))
        ) {
            e.next()
            return
        }

        if (!utils.mailEnabled(e.app)) {
            e.app
                .logger()
                .warn(
                    'reports: SMTP disabled, Art. 16(5) decision notice not sent',
                    'report',
                    e.record.id,
                )
            e.next()
            return
        }

        const removed = e.record.get('decision') === 'content_removed'
        const outcome = removed
            ? 'The reported content has been removed.'
            : 'The reported content has been kept online.'
        const reason = e.record.get('decision_reason')

        utils.send(
            e.app,
            [e.record.get('notifier_email')],
            `Decision on your report - ${e.app.settings().meta.appName}`,
            `<p>Hello ${utils.escapeHtml(e.record.get('notifier_name'))},</p>
             <p>We have reviewed your report (reference ${utils.escapeHtml(e.record.id)}).</p>
             <p><strong>Decision:</strong> ${utils.escapeHtml(outcome)}</p>
             ${reason ? `<p><strong>Reasoning:</strong><br>${utils.escapeHtml(reason)}</p>` : ''}
             ${utils.redressHtml(e.app)}`,
        )

        e.record.set('notified_at', new DateTime())
        e.app.save(e.record)
    } catch (err) {
        e.app
            .logger()
            .error(
                'reports: decision mail failed',
                'report',
                e.record.id,
                'error',
                String(err),
            )
    }

    e.next()
}, 'reports')

// Lets the admin UI warn that Art. 16(4)/(5) notices are not being delivered.
// Returns a single boolean and no credential of any kind.
routerAdd(
    'GET',
    '/api/mail-status',
    (e) => {
        return e.json(200, { configured: !!e.app.settings().smtp.enabled })
    },
    $apis.requireAuth(),
)
