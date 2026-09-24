import type { ReadInputBarcodeFormat } from 'zxing-wasm/reader'

export interface Size {
    width: number
    height: number
}

export interface Box {
    x: number
    y: number
    width: number
    height: number
}

export function mapToCover(box: Box, video: Size, display: Size): Box {
    const scale = Math.max(
        display.width / video.width,
        display.height / video.height,
    )
    const offsetX = (display.width - video.width * scale) / 2
    const offsetY = (display.height - video.height * scale) / 2
    return {
        x: box.x * scale + offsetX,
        y: box.y * scale + offsetY,
        width: box.width * scale,
        height: box.height * scale,
    }
}

export interface ScannedCode {
    rawValue: string
    boundingBox: Box
}

export function boundingBoxOf(points: { x: number; y: number }[]): Box {
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return {
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
    }
}

export interface TrackSample {
    box: Box
    at: number
}

export function predictBox(
    latest: TrackSample,
    previous: TrackSample | undefined,
    now: number,
    maxLeadMs: number,
): Box {
    const elapsed = latest.at - (previous?.at ?? latest.at)
    if (!previous || elapsed <= 0) return latest.box
    const lead = Math.min(now - latest.at, maxLeadMs) / elapsed
    return {
        x: latest.box.x + (latest.box.x - previous.box.x) * lead,
        y: latest.box.y + (latest.box.y - previous.box.y) * lead,
        width: latest.box.width,
        height: latest.box.height,
    }
}

export function tagPosition(
    box: Box,
    tag: Size,
    display: Size,
    gap: number,
): { x: number; y: number } {
    const centered = box.x + (box.width - tag.width) / 2
    const x = Math.min(
        Math.max(centered, gap),
        Math.max(gap, display.width - tag.width - gap),
    )
    const below = box.y + box.height + gap
    const y =
        below + tag.height > display.height ? box.y - gap - tag.height : below
    return { x, y }
}

export interface Pixels {
    data: Uint8ClampedArray<ArrayBuffer>
    width: number
    height: number
}

export function downsampleHalf({ data, width, height }: Pixels): Pixels {
    const halfWidth = Math.floor(width / 2)
    const halfHeight = Math.floor(height / 2)
    const out = new Uint8ClampedArray(halfWidth * halfHeight * 4)
    for (let y = 0; y < halfHeight; y++) {
        const top = y * 2 * width
        const bottom = top + width
        for (let x = 0; x < halfWidth; x++) {
            const a = (top + x * 2) * 4
            const b = (bottom + x * 2) * 4
            const o = (y * halfWidth + x) * 4
            for (let c = 0; c < 3; c++) {
                out[o + c] =
                    (data[a + c]! +
                        data[a + 4 + c]! +
                        data[b + c]! +
                        data[b + 4 + c]!) /
                    4
            }
            out[o + 3] = 255
        }
    }
    return { data: out, width: halfWidth, height: halfHeight }
}

export interface DecodeRequest {
    pixels: Pixels
    formats: ReadInputBarcodeFormat[]
}

export interface DecodeResponse {
    codes: ScannedCode[]
    followed: ScannedCode[]
}
