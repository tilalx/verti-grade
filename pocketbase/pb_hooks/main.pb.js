routerAdd('GET', '/', (c) => {
    return c.json(200, {
        message:
            'This is only the pocketbase server. Please visit https://pocketbase.io for more information.',
    })
})
