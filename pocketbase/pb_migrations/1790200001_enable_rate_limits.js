/// <reference path="../pb_data/types.d.ts" />

// Rate limits, sized for a climbing gym.
//
// PocketBase ships a default rule set but leaves `enabled` false, so nothing
// bounded password guessing against /_/, anonymous rating spam, or the DSA
// report endpoint -- which mails an address the submitter chooses and fans out
// to every moderator, i.e. an open relay for harassment.
//
// Two facts about this deployment drive every number below.
//
// 1. Everyone in the hall shares one public IP. Gym wifi is NATed and mobile
//    carriers NAT harder still, and PocketBase buckets per IP. So reads and
//    rating writes have to fit a whole busy evening behind a single address,
//    while auth and mail limits can stay tight: those are per-person actions,
//    and only staff have logins at all -- users.createRule requires
//    manage_users, there is no public sign-up.
//
// 2. Server-rendered pages reach PocketBase from inside the container
//    (app/composables/pocketbase.js points the server-side client at
//    http://pb:8080 directly) with no X-Real-IP for the trusted-proxy config
//    to read, so every SSR read arrives as 127.0.0.1. Without the exclusion
//    below, one bucket would cover every page render in the install and the
//    site would throttle itself off the air.
migrate(
    (app) => {
        const settings = app.settings()

        settings.rateLimits.enabled = true

        // Loopback is the app's own server-side renderer, not a client. See (2).
        settings.rateLimits.excludedIPs = ['127.0.0.1', '::1']

        // Kept as a table on purpose: one rule per line is what makes the
        // numbers comparable at a glance.
        // prettier-ignore
        settings.rateLimits.rules = [
            // Password guessing, against member accounts and the superuser
            // panel alike (`*` spans _superusers too). Only staff sign in, and
            // a person who fumbles their password needs three or four tries, so
            // ten in five minutes covers two colleagues having a bad morning
            // from the same office IP while cutting an online dictionary run
            // from millions of guesses a day to 2,880.
            { label: '*:authWithPassword',     audience: '',       duration: 300,  maxRequests: 10 },

            // The three below each send mail to an address the caller names,
            // which is what earns them a rule: unbounded, they are a mail
            // cannon pointed at whoever the attacker picks.
            //
            // Password reset is split by audience because one endpoint serves
            // two flows: the public forgot-password form on /auth/login is the
            // abusable one, while the same call is also the invite that
            // CreateUser.vue sends -- an admin onboarding a setting team fires
            // a burst of those on purpose.
            { label: '*:requestPasswordReset', audience: '@guest', duration: 900,  maxRequests: 3  },
            { label: '*:requestPasswordReset', audience: '@auth',  duration: 900,  maxRequests: 20 },
            // Unused by the UI, but PocketBase exposes it regardless.
            { label: '*:requestVerification',  audience: '',       duration: 900,  maxRequests: 3  },
            // Self-service, one mail per change; nobody moves address twice.
            { label: '*:requestEmailChange',   audience: '',       duration: 900,  maxRequests: 5  },

            // A DSA Art. 16 notice mails the notifier and notifies every
            // moderator, so it is the costliest anonymous write in the app.
            // Art. 16(1) keeps it open to anyone; a genuine notifier files one,
            // perhaps two.
            { label: 'reports:create',         audience: '',       duration: 3600, maxRequests: 5  },

            // Ratings are anonymous by design. A climber logs roughly ten
            // routes after a session, so sixty per ten minutes leaves room for
            // half a dozen people finishing together behind the hall's single
            // address, and still caps a flood at a moderatable few thousand a
            // day. Per-IP is the weakest bound in this table, though: NAT cuts
            // both ways, and the real fix for rating spam is a per-route
            // submission check, not a smaller number here.
            { label: 'ratings:create',         audience: '',       duration: 600,  maxRequests: 60 },

            // Flood backstop for everything else. A route page costs a handful
            // of calls and the layout refreshes its token on every navigation,
            // so this has to clear a hall full of phones browsing at once: it
            // is here to stop a scraper, not to shape normal traffic.
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
