import QRCode from 'qrcode'
import fs from 'node:fs'

export function generateRouteQrY4m(routeId: string, outPath: string) {
    const qr = QRCode.create(routeId, { errorCorrectionLevel: 'M' })
    const moduleCount = qr.modules.size
    const data = qr.modules.data

    const scale = 8
    const quietZone = 4 * scale
    const size = moduleCount * scale + quietZone * 2
    const width = size % 2 === 0 ? size : size + 1
    const height = width

    const frame = new Uint8Array(width * height)
    frame.fill(255)

    for (let my = 0; my < moduleCount; my++) {
        for (let mx = 0; mx < moduleCount; mx++) {
            const dark = data[my * moduleCount + mx]
            if (!dark) continue
            const x0 = quietZone + mx * scale
            const y0 = quietZone + my * scale
            for (let dy = 0; dy < scale; dy++) {
                const row = (y0 + dy) * width
                for (let dx = 0; dx < scale; dx++) {
                    frame[row + x0 + dx] = 0
                }
            }
        }
    }

    const yPlane = frame
    const uPlane = new Uint8Array((width / 2) * (height / 2)).fill(128)
    const vPlane = new Uint8Array((width / 2) * (height / 2)).fill(128)

    const header = `YUV4MPEG2 W${width} H${height} F25:1 Ip A1:1 C420jpeg\n`
    const frameHeader = 'FRAME\n'

    const chunks: Buffer[] = [Buffer.from(header)]
    for (let i = 0; i < 10; i++) {
        chunks.push(Buffer.from(frameHeader))
        chunks.push(Buffer.from(yPlane))
        chunks.push(Buffer.from(uPlane))
        chunks.push(Buffer.from(vPlane))
    }

    fs.writeFileSync(outPath, Buffer.concat(chunks))
    return outPath
}
