/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for the DSA Art. 16 report hooks.
//
// PocketBase runs every hook handler in a pooled goja runtime that cannot see
// the enclosing file scope, so handlers must require() this module from inside
// the handler body rather than closing over top-level helpers.

const REASON_LABELS = {
    hate_speech: 'Hate speech',
    harassment: 'Harassment',
    violence_threat: 'Threat of violence',
    sexual_content: 'Sexual content',
    personal_data: 'Personal data',
    ip_infringement: 'Intellectual property infringement',
    spam_fraud: 'Spam or fraud',
    other: 'Other',
}

// Report text is attacker-controlled and anonymous. It is rendered into an HTML
// mail that lands in a moderator's inbox, so it must be escaped, not trusted.
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function reasonLabel(reason) {
    return REASON_LABELS[reason] || reason || 'Other'
}

/**
 * True when a date field carries no value.
 *
 * PocketBase hands back a DateTime OBJECT for an unset date, and an object is
 * truthy in JS -- so `if (record.get('notified_at'))` reads as "already
 * notified" on a report nobody has ever notified. That is what silently
 * suppressed every Art. 16(5) decision notice.
 */
function isBlankDate(value) {
    if (!value) return true
    if (typeof value.isZero === 'function') return value.isZero()
    return String(value) === ''
}

function mailEnabled(app) {
    return !!app.settings().smtp.enabled
}

function appUrl(app) {
    return (app.settings().meta.appURL || '').replace(/\/+$/, '')
}

function contactEmail(app) {
    try {
        return (
            app
                .findRecordById('settings', 'settings_123456')
                .get('contact_email') || ''
        )
    } catch (err) {
        return ''
    }
}

// Every user whose role grants manage_reports, plus the configured public
// contact address. Deduplicated, blanks dropped.
//
// The lookup itself lives in utils/notifications.js so the mail path and the
// in-app queue cannot disagree about who the moderators are.
function alertRecipients(app) {
    const notifications = require(`${__hooks}/utils/notifications.js`)
    const addresses = []

    for (const user of notifications.usersByPermission(app, 'manage_reports')) {
        const address = user.get('email')
        if (address) addresses.push(address)
    }

    const contact = contactEmail(app)
    if (contact) addresses.push(contact)

    return addresses.filter((address, i) => addresses.indexOf(address) === i)
}

function send(app, recipients, subject, html) {
    const targets = (recipients || []).filter(Boolean)
    if (!targets.length) return false

    const message = new MailerMessage({
        from: {
            address: app.settings().meta.senderAddress,
            name: app.settings().meta.senderName,
        },
        to: targets.map((address) => ({ address })),
        subject: subject,
        html: html,
    })

    app.newMailClient().send(message)
    return true
}

function reportSummaryHtml(app, record) {
    const base = appUrl(app)
    const url = record.get('content_url') || ''
    const absolute = url.startsWith('http') ? url : base + url

    return `
        <p><strong>Reason:</strong> ${escapeHtml(reasonLabel(record.get('reason')))}</p>
        <p><strong>Reported content:</strong> <a href="${escapeHtml(absolute)}">${escapeHtml(absolute)}</a></p>
        <p><strong>Explanation:</strong><br>${escapeHtml(record.get('explanation'))}</p>
        <p><strong>Content at the time of the report:</strong><br>${escapeHtml(record.get('content_snapshot')) || '<em>unavailable</em>'}</p>
    `
}

// Art. 16(5): the decision notice must tell the notifier how to challenge it.
function redressHtml(app) {
    const contact = contactEmail(app)
    const contactLine = contact
        ? `<li>Contacting the operator directly at <a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>.</li>`
        : ''

    return `
        <p><strong>How to challenge this decision</strong></p>
        <ul>
            <li>Out-of-court dispute settlement before a certified body under Article 21 of the Digital Services Act.</li>
            <li>Judicial remedy before the competent court.</li>
            ${contactLine}
        </ul>
    `
}

module.exports = {
    isBlankDate,
    escapeHtml,
    reasonLabel,
    mailEnabled,
    appUrl,
    contactEmail,
    alertRecipients,
    send,
    reportSummaryHtml,
    redressHtml,
}
