/// <reference path="../pb_data/types.d.ts" />

// SMTP from the environment.
//
// PocketBase keeps mail settings in the database, reachable only through the
// superuser panel at /_/ -- so a fresh deployment sends no mail until somebody
// logs in there and fills the form, and nothing in the repo can prove the mail
// paths work. Reading them from env at boot makes the config deployable
// (docker-compose, CI) and lets the e2e stack point at a catcher.
//
// Opt-in: with PB_SMTP_HOST unset nothing is touched, so an existing install
// configured through the panel keeps whatever it has.
onBootstrap((e) => {
    e.next()

    const host = $os.getenv('PB_SMTP_HOST')
    if (!host) return

    try {
        const settings = $app.settings()

        settings.smtp.enabled = true
        settings.smtp.host = host
        settings.smtp.port = parseInt($os.getenv('PB_SMTP_PORT') || '587', 10)
        settings.smtp.username = $os.getenv('PB_SMTP_USERNAME') || ''
        settings.smtp.password = $os.getenv('PB_SMTP_PASSWORD') || ''
        // Anything but an explicit "false" enforces TLS: a misspelled value
        // must not silently downgrade a production connection to plaintext.
        settings.smtp.tls = $os.getenv('PB_SMTP_TLS') !== 'false'

        // Links in every template interpolate {APP_URL}, and the sender
        // identity rides on meta -- all three are useless at their defaults
        // (http://localhost:8090, "Acme", support@example.com).
        const appUrl = $os.getenv('PB_APP_URL')
        if (appUrl) settings.meta.appURL = appUrl

        const senderAddress = $os.getenv('PB_SENDER_ADDRESS')
        if (senderAddress) settings.meta.senderAddress = senderAddress

        const senderName = $os.getenv('PB_SENDER_NAME')
        if (senderName) settings.meta.senderName = senderName

        // {APP_NAME} is interpolated into every subject line and signature;
        // left alone it signs the mail "Acme".
        const appName = $os.getenv('PB_APP_NAME')
        if (appName) settings.meta.appName = appName

        $app.save(settings)
        $app.logger().info('smtp: configured from environment', 'host', host)
    } catch (err) {
        $app.logger().error(
            'smtp: env configuration failed',
            'error',
            String(err),
        )
    }
})
