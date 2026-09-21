/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Without this, realIP() falls back to RemoteIP() -- the nginx
        // container's own address -- so every audit entry (and every
        // rate-limit bucket) would record the same useless internal IP.
        //
        // X-Real-IP rather than X-Forwarded-For: nginx has already rewritten
        // $remote_addr from the forwarded chain (real_ip_header +
        // real_ip_recursive over the private ranges, .docker/nginx.conf:19-28)
        // and then sets X-Real-IP to that single resolved value. A client
        // cannot prepend to it, which is exactly the attack that makes
        // trusting X-Forwarded-For directly unsafe.
        const settings = app.settings()
        settings.trustedProxy.headers = ['X-Real-IP']
        settings.trustedProxy.useLeftmostIP = false
        app.save(settings)
    },
    (app) => {
        const settings = app.settings()
        settings.trustedProxy.headers = []
        settings.trustedProxy.useLeftmostIP = false
        app.save(settings)
    },
)
