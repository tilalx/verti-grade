const urls = [
    'http://127.0.0.1:8080/api/health',
    'http://127.0.0.1:3000/',
    'http://127.0.0.1/',
]

try {
    await Promise.all(
        urls.map(async (url) => {
            const response = await fetch(url, { redirect: 'manual' })
            if (response.status >= 400)
                throw new Error(`${url} ${response.status}`)
        }),
    )
} catch (error) {
    console.error(error.message)
    process.exit(1)
}
