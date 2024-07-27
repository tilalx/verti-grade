import Botd from '@fingerprintjs/botd'

export async function isBot() {
    const botdPromise = Botd.load()
    const botd = await botdPromise
    return botd.detect()
}
