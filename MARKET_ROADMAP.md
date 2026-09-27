# Verti-Grade — Market-Driven Roadmap

Benchmarked against TopLogger, Vertical-Life, Griptonite, Stōkt, Kaya, 27crags. Based on product knowledge, not fresh market research. Status as of 2026-09-27.

## Where Verti-Grade stands

### Shipped

**Climbers**
- Route browsing with filters, sorting, global search, QR codes that open the route page
- Ratings, grade feedback and comments per route
- Installable PWA with offline fallback (#486)
- Public registration with captcha and rate limits (#487)
- Logbook: flash / top / attempts, grade pyramid, progression chart, sessions, projects, route suggestions (#488, #491)
- Multiple grading scales (Font, UIAA, YDS, …) with per-discipline stats (#474)
- 5 languages, per-user language, light/dark theme

**Gyms**
- Route management with archive, bulk import, inventory with in-app QR scanner
- Configurable locations (walls/sectors)
- Analytics: grade distribution, active vs. expected grade balance, "rated harder/softer than its grade" feedback, setter output, activity heatmap, rating distribution
- Exports: PDF route signs, XLSX, JSON
- Roles & permissions with custom roles, audit log, in-app notifications, account mail
- DSA content reporting, built-in imprint/privacy pages
- Self-hosted Docker image, SSR, non-root container

### In progress

- **Interactive gym map** (`feat/gym-map`) — vector floor plan per location drawn in-app, walls with sent/total counts, route dots in hold colour, `/map` page with pan/zoom and list sheet, setter drag-and-drop placement (TopLogger-style).

### Assessment

The climber loop (PWA + logbook) and the basics of setter analytics are now in place — the two biggest gaps from the last revision are closed. What's missing is anything that makes a gym **pay** (competitions, setter planning) or makes climbers **come back** (social, gamification, push).

## Next: what the app should get

### 1. Climber retention (finish the loop)

| Feature | Why | Builds on |
|---|---|---|
| **Gym leaderboards & seasons** | Core engagement driver in TopLogger; gyms cite it as reason to pay | Ticks already store grade + send type — scoring is a query |
| **Badges & streaks** | Cheap retention, rewards visits | Sessions in logbook |
| **Push notifications** ("new routes on wall X", "your project was reset") | Brings climbers back between sessions | PWA + existing notifications collection |
| **Offline logbook** | Signal at the wall is poor; tick now, sync later | PWA service worker |
| **Follow friends / send feed** | Social proof, network effect | Ticks |
| **Beta videos per route** | Standard in Kaya/Stōkt; high engagement | Route detail page, PocketBase file storage |

### 2. Gym revenue (what they pay for)

| Feature | Why | Builds on |
|---|---|---|
| **Competition module** — boulder league / comp scoring (tops & zones, IFSC-style), self-scoring, live results screen, age/gender categories | Sells standalone; gyms run several events a year | Ticks + public registration |
| **Reset planner** — which wall comes down when, route age per wall, planned vs. actual | Griptonite's core product | Locations, `archived_at`, wall map |
| **Target grade curve per wall** — configurable, alerts when balance drifts | Turns the grade balance chart into an action | GradeBalanceChart |
| **Actionable analytics inbox** — "route rated 2 grades harder", "wall under-climbed", "route unticked for 4 weeks" as a to-do list, not charts | Setters act on lists, not dashboards | GradeFeedbackChart, ticks |
| **Setter workload & hold/color usage** | Planning and fair workload distribution | Setter chart, usedColors |

### 3. Deal closers

- **In-gym TV screens** — "new routes this week", comp live results, leaderboard. Read-only page, low effort.
- **Customizable PDF sign templates** — previously attempted and reverted; revisit with a simpler scope (a few fixed layouts instead of a full editor).
- **Check-in / membership integrations** — Boulderado (DACH), Rock Gym Pro, Approach (US). Login via member account, visit statistics.
- **Public API / webhooks** — lets gyms push new routes to their website and Instagram.

### 4. Scale (once there are paying gyms)

- **Multi-tenant SaaS** — one install, many gyms, gym self-signup. Self-hosting per customer doesn't scale commercially; keep self-hosted as the open-source/GPL tier.
- **Billing** (e.g. Stripe) — per-gym subscription, comp module as add-on.
- **Cross-gym climber profile** — one account, logbook across gyms (Vertical-Life's lock-in).
- **Outdoor crags** — second market (27crags, theCrag territory): topos, access info. Only after indoor is solid.

## Recommended order

1. **Finish gym map** — in progress; matches TopLogger's map tab.
2. **Leaderboards + push notifications** — closes the retention loop on top of the logbook.
3. **Competitions** — first feature a gym pays for on its own.
4. **Reset planner + actionable analytics inbox** — turns existing charts into setter workflow.
5. **TV screens** — quick win that makes the product visible in the gym.
6. **Multi-tenant SaaS + billing**, once gyms are lined up.

## Branding: rename to Gripello

"Verti-Grade" is too close to market leader Vertical-Life, too narrow ("grade"), and `vertigrade.com` is taken.

**New name: Gripello** — "grip" (climbing English understood across Europe) + Italian-style suffix. Pronounced "GRIP-ello", works in EN, DE, FR, IT, ES, PL, TR, RU, UK.

- **Domains:** gripello.com, .de, .eu, .app all free (checked 2026-09-26)
- **Trademarks:** TMview "contains Gripello" — no results in any office (EU, DE, WO, GB, US, …)
- **Watch:** "Gripple" (wire fixings, classes 6/20) — different field, low risk

**Domain plan:**

| Domain | Use |
|---|---|
| gripello.com | Marketing site, company email (`hello@gripello.com`) |
| docs.gripello.com | Documentation (self-hosting, admin guide) |
| gripello.app | Hosted product; per-gym subdomains once multi-tenant (`boulderwelt.gripello.app`) |
| gripello.de, gripello.eu | Defensive, redirect to gripello.com |

Why the app gets its own domain: auth cookies isolated from marketing/docs hosting, user uploads can't hurt the reputation of the main domain or email, `.app` is HSTS-preloaded (HTTPS enforced, which the PWA needs anyway). Self-hosted installs keep their own domain.

**To do:**
- [ ] TMview fuzzy search for "Gripello" and "Grip*" in Nice classes 9/42
- [ ] Register gripello.com, .de, .eu, .app
- [ ] Reserve @gripello on Instagram, GitHub, App Store
- [ ] File EU trademark (EUIPO) in classes 9, 42 (optionally 41)
- [ ] Rename in code: i18n strings, Docker image, README, PWA manifest
