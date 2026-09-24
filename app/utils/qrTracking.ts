import type { Box, Pixels } from '~/utils/qr'

export const TRACKING_THRESHOLD = 0.85

export interface GrayImage {
    data: Float32Array
    width: number
    height: number
}

export interface Template extends GrayImage {
    spread: number
}

export interface Match {
    x: number
    y: number
    score: number
}

export function grayscale(pixels: Pixels, factor: number): GrayImage {
    const width = Math.floor(pixels.width / factor)
    const height = Math.floor(pixels.height / factor)
    const data = new Float32Array(width * height)
    const area = factor * factor
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0
            for (let dy = 0; dy < factor; dy++) {
                let offset = ((y * factor + dy) * pixels.width + x * factor) * 4
                for (let dx = 0; dx < factor; dx++, offset += 4) {
                    sum += pixels.data[offset + 1]!
                }
            }
            data[y * width + x] = sum / area
        }
    }
    return { data, width, height }
}

export function cropTemplate(image: GrayImage, box: Box): Template | null {
    const left = Math.round(box.x)
    const top = Math.round(box.y)
    const width = Math.round(box.width)
    const height = Math.round(box.height)
    if (
        width < 4 ||
        height < 4 ||
        left < 0 ||
        top < 0 ||
        left + width > image.width ||
        top + height > image.height
    ) {
        return null
    }

    const data = new Float32Array(width * height)
    let mean = 0
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = image.data[(top + y) * image.width + left + x]!
            data[y * width + x] = value
            mean += value
        }
    }
    mean /= data.length

    let spread = 0
    for (let i = 0; i < data.length; i++) {
        data[i]! -= mean
        spread += Math.abs(data[i]!)
    }
    spread /= data.length
    return spread > 0 ? { data, width, height, spread } : null
}

export function matchTemplate(
    image: GrayImage,
    template: Template,
    centerX: number,
    centerY: number,
    radius: number,
): Match | null {
    const count = template.width * template.height
    let best: Match | null = null

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const left = Math.round(centerX) + dx
            const top = Math.round(centerY) + dy
            if (
                left < 0 ||
                top < 0 ||
                left + template.width > image.width ||
                top + template.height > image.height
            ) {
                continue
            }

            let mean = 0
            for (let y = 0; y < template.height; y++) {
                const row = (top + y) * image.width + left
                for (let x = 0; x < template.width; x++) {
                    mean += image.data[row + x]!
                }
            }
            mean /= count

            let difference = 0
            for (let y = 0; y < template.height; y++) {
                const row = (top + y) * image.width + left
                const templateRow = y * template.width
                for (let x = 0; x < template.width; x++) {
                    difference += Math.abs(
                        image.data[row + x]! -
                            mean -
                            template.data[templateRow + x]!,
                    )
                }
            }

            const score = difference / count / template.spread
            if (!best || score < best.score) best = { x: left, y: top, score }
        }
    }
    return best
}

export function halveGray(image: GrayImage): GrayImage {
    const width = Math.floor(image.width / 2)
    const height = Math.floor(image.height / 2)
    const data = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        const top = y * 2 * image.width
        const bottom = top + image.width
        for (let x = 0; x < width; x++) {
            data[y * width + x] =
                (image.data[top + x * 2]! +
                    image.data[top + x * 2 + 1]! +
                    image.data[bottom + x * 2]! +
                    image.data[bottom + x * 2 + 1]!) /
                4
        }
    }
    return { data, width, height }
}

const FINE_FACTOR = 4
const COARSE_FACTOR = 8
const REFINE_RADIUS = 2
const MAX_COARSE_RADIUS = 16

interface TrackedCode {
    box: Box
    coarse: Template
    fine: Template
    decodedAt: number
    velocityX: number
    velocityY: number
}

const scaleBox = (box: Box, factor: number): Box => ({
    x: box.x / factor,
    y: box.y / factor,
    width: box.width / factor,
    height: box.height / factor,
})

const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height

export function createTracker(maxAgeMs: number) {
    const tracked = new Map<string, TrackedCode>()

    const follow = (
        code: TrackedCode,
        fine: GrayImage,
        coarse: GrayImage,
    ): Box | null => {
        const predictedX = code.box.x + code.velocityX
        const predictedY = code.box.y + code.velocityY
        const radius = Math.min(
            MAX_COARSE_RADIUS,
            Math.max(1, Math.round(code.coarse.width / 2)),
        )
        const rough = matchTemplate(
            coarse,
            code.coarse,
            predictedX / COARSE_FACTOR,
            predictedY / COARSE_FACTOR,
            radius,
        )
        if (!rough || rough.score > TRACKING_THRESHOLD) return null
        const precise = matchTemplate(
            fine,
            code.fine,
            (rough.x * COARSE_FACTOR) / FINE_FACTOR,
            (rough.y * COARSE_FACTOR) / FINE_FACTOR,
            REFINE_RADIUS,
        )
        const match = precise ?? {
            x: (rough.x * COARSE_FACTOR) / FINE_FACTOR,
            y: (rough.y * COARSE_FACTOR) / FINE_FACTOR,
        }
        return {
            x: match.x * FINE_FACTOR,
            y: match.y * FINE_FACTOR,
            width: code.box.width,
            height: code.box.height,
        }
    }

    return {
        get size() {
            return tracked.size
        },
        update(
            frame: Pixels,
            decoded: { rawValue: string; boundingBox: Box }[],
            now: number,
        ): { rawValue: string; boundingBox: Box }[] {
            if (!decoded.length && !tracked.size) return []
            const fine = grayscale(frame, FINE_FACTOR)
            const coarse = halveGray(fine)
            const decodedValues = new Set(decoded.map((code) => code.rawValue))

            for (const { rawValue, boundingBox } of decoded) {
                const fineTemplate = cropTemplate(
                    fine,
                    scaleBox(boundingBox, FINE_FACTOR),
                )
                const coarseTemplate = cropTemplate(
                    coarse,
                    scaleBox(boundingBox, COARSE_FACTOR),
                )
                if (!fineTemplate || !coarseTemplate) {
                    tracked.delete(rawValue)
                    continue
                }
                const previous = tracked.get(rawValue)
                tracked.set(rawValue, {
                    box: boundingBox,
                    fine: fineTemplate,
                    coarse: coarseTemplate,
                    decodedAt: now,
                    velocityX: previous ? boundingBox.x - previous.box.x : 0,
                    velocityY: previous ? boundingBox.y - previous.box.y : 0,
                })
            }

            const followed: { rawValue: string; boundingBox: Box }[] = []
            for (const [rawValue, code] of tracked) {
                if (decodedValues.has(rawValue)) continue
                const box =
                    now - code.decodedAt <= maxAgeMs
                        ? follow(code, fine, coarse)
                        : null
                if (
                    !box ||
                    decoded.some((other) => overlaps(other.boundingBox, box))
                ) {
                    tracked.delete(rawValue)
                    continue
                }
                code.velocityX = box.x - code.box.x
                code.velocityY = box.y - code.box.y
                code.box = box
                followed.push({ rawValue, boundingBox: box })
            }
            return followed
        },
    }
}
