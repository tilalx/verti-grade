/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest((e) => {
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
        e.next()
        return
    }

    const before = String(e.record.original().get('role') || '')
    const after = String(e.record.get('role') || '')

    if (before === after) {
        e.next()
        return
    }

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
