/// <reference path="../pb_data/types.d.ts" />

// Field guard for self-service user updates.
//
// users.updateRule (1774100001_enforce_permissions_on_collections.js) is
// `id = @request.auth.id || ...manage_users`, because a member has to be able
// to edit their own profile. PocketBase rules gate RECORDS, not FIELDS, so the
// same rule also let any signed-in member PATCH their own `role` -- and every
// role id is readable (roles.listRule is `@request.auth.id != ""`), which put
// the admin role one request away from anyone holding a login. A collection
// rule cannot express "this record, but not this field"; only a hook can.
//
// `role` is the only field guarded here. `verified` looks like a sibling risk
// but is not reachable: users.authRule is verified=true, so an unverified
// account never holds a token to send the request with.
onRecordUpdateRequest((e) => {
    // The superuser panel is where changing a role is the whole point.
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
        e.next()
        return
    }

    const before = String(e.record.original().get('role') || '')
    const after = String(e.record.get('role') || '')

    // Keeps every ordinary edit on the fast path -- name, avatar, password,
    // e-mail, and an admin form that posts the role back unchanged.
    if (before === after) {
        e.next()
        return
    }

    // Same filter idiom as the notification fan-out (utils/notifications.js):
    // resolve the permission through the actor's role relation in one query.
    const actor = e.auth
    let privileged = false
    if (actor) {
        const holders = e.app.findRecordsByFilter(
            'users',
            `id = "${actor.id}" && role.permissions.name ?= "manage_users"`,
            '',
            1,
            0,
        )
        privileged = holders.length > 0
    }

    if (!privileged) {
        throw new ForbiddenError('Changing a role requires manage_users.')
    }

    e.next()
}, 'users')
