/// <reference path="../pb_data/types.d.ts" />

// The verification and email-change templates still pointed at the PocketBase
// superuser panel (/_/#/auth/...), so a regular user clicking either link
// landed in an admin UI they cannot use. 1773763351 already did this for the
// password reset template; these two were missed.
const APP_VERIFY = '{APP_URL}/auth/confirm-verification/{TOKEN}'
const PB_VERIFY = '{APP_URL}/_/#/auth/confirm-verification/{TOKEN}'
const APP_EMAIL_CHANGE = '{APP_URL}/auth/confirm-email-change/{TOKEN}'
const PB_EMAIL_CHANGE = '{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}'

function retarget(app, verifyUrl, emailChangeUrl) {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    unmarshal(
        {
            verificationTemplate: {
                body: `<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>`,
            },
            confirmEmailChangeTemplate: {
                body: `<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="${emailChangeUrl}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn't ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>`,
            },
        },
        collection,
    )

    return app.save(collection)
}

migrate(
    (app) => retarget(app, APP_VERIFY, APP_EMAIL_CHANGE),
    (app) => retarget(app, PB_VERIFY, PB_EMAIL_CHANGE),
)
