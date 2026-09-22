/// <reference path="../pb_data/types.d.ts" />

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
        settings.smtp.tls = $os.getenv('PB_SMTP_TLS') !== 'false'

        const appUrl = $os.getenv('PB_APP_URL')
        if (appUrl) settings.meta.appURL = appUrl

        const senderAddress = $os.getenv('PB_SENDER_ADDRESS')
        if (senderAddress) settings.meta.senderAddress = senderAddress

        const senderName = $os.getenv('PB_SENDER_NAME')
        if (senderName) settings.meta.senderName = senderName

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
