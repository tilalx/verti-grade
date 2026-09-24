import {
    prepareZXingModule,
    readBarcodes,
    type ReadInputBarcodeFormat,
} from 'zxing-wasm/reader'
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import {
    boundingBoxOf,
    downsampleHalf,
    type DecodeRequest,
    type DecodeResponse,
    type Pixels,
} from '~/utils/qr'
import { createTracker } from '~/utils/qrTracking'

prepareZXingModule({ overrides: { locateFile: () => zxingReaderWasmUrl } })

const TRACKING_MAX_AGE_MS = 1000
const tracker = createTracker(TRACKING_MAX_AGE_MS)

const decodePass = async (
    pixels: Pixels,
    formats: ReadInputBarcodeFormat[],
    scale: number,
) => {
    const results = await readBarcodes(
        new ImageData(pixels.data, pixels.width, pixels.height),
        { formats, tryInvert: false, tryRotate: false },
    )
    return results.map(({ text, position }) => {
        const box = boundingBoxOf([
            position.topLeft,
            position.topRight,
            position.bottomRight,
            position.bottomLeft,
        ])
        return {
            rawValue: text,
            boundingBox: {
                x: box.x * scale,
                y: box.y * scale,
                width: box.width * scale,
                height: box.height * scale,
            },
        }
    })
}

self.onmessage = async ({ data }: MessageEvent<DecodeRequest>) => {
    let codes: DecodeResponse['codes'] = []
    let followed: DecodeResponse['followed'] = []
    try {
        codes = await decodePass(downsampleHalf(data.pixels), data.formats, 2)
        if (!codes.length && !tracker.size) {
            codes = await decodePass(data.pixels, data.formats, 1)
        }
        followed = tracker.update(data.pixels, codes, performance.now())
    } catch (error) {
        console.error('QR decode failed:', error)
    }
    self.postMessage({ codes, followed } satisfies DecodeResponse)
}
