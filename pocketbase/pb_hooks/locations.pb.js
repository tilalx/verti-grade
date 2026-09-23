/// <reference path="../pb_data/types.d.ts" />
onRecordDeleteRequest((e) => {
    const routeCount = e.app.countRecords(
        'routes',
        $dbx.hashExp({ location: e.record.id }),
    )
    if (routeCount > 0) {
        throw new BadRequestError('Location is still used by routes.', {
            routeCount,
        })
    }
    e.next()
}, 'locations')
