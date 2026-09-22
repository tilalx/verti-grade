/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const settings = app.settings()

        settings.rateLimits.enabled = true

        settings.rateLimits.excludedIPs = ['127.0.0.1', '::1']

        // prettier-ignore
        settings.rateLimits.rules = [
            { label: '*:authWithPassword',     audience: '',       duration: 300,  maxRequests: 10 },

            { label: '*:requestPasswordReset', audience: '@guest', duration: 900,  maxRequests: 3  },
            { label: '*:requestPasswordReset', audience: '@auth',  duration: 900,  maxRequests: 20 },
            { label: '*:requestVerification',  audience: '',       duration: 900,  maxRequests: 3  },
            { label: '*:requestEmailChange',   audience: '',       duration: 900,  maxRequests: 5  },

            { label: 'reports:create',         audience: '',       duration: 3600, maxRequests: 5  },

            { label: 'ratings:create',         audience: '',       duration: 600,  maxRequests: 60 },

            { label: '/api/',                  audience: '',       duration: 60,   maxRequests: 600 },
        ]

        app.save(settings)
    },
    (app) => {
        const settings = app.settings()
        settings.rateLimits.enabled = false
        settings.rateLimits.excludedIPs = []
        app.save(settings)
    },
)
