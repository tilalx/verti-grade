import { toHex6 } from '~/utils/color'

export type ColorName =
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'purple'
    | 'pink'
    | 'brown'
    | 'black'
    | 'white'
    | 'grey'
    | 'turquoise'

const HUE_NAMES: [number, ColorName][] = [
    [12, 'red'],
    [45, 'orange'],
    [70, 'yellow'],
    [165, 'green'],
    [195, 'turquoise'],
    [250, 'blue'],
    [295, 'purple'],
    [345, 'pink'],
    [360, 'red'],
]

function hsl(hex: string) {
    const value = parseInt(hex.slice(1), 16)
    const [red, green, blue] = [value >> 16, value >> 8, value].map(
        (channel) => (channel & 0xff) / 255,
    ) as [number, number, number]
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const delta = max - min
    const lightness = (max + min) / 2
    const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0
    let hue = 0
    if (delta && max === red) hue = ((green - blue) / delta + 6) % 6
    else if (delta && max === green) hue = (blue - red) / delta + 2
    else if (delta) hue = (red - green) / delta + 4
    return { hue: hue * 60, saturation, lightness, max }
}

export function nearestColorName(
    color: string | null | undefined,
): ColorName | null {
    const hex = toHex6(color)
    if (!hex) return null
    const { hue, saturation, lightness, max } = hsl(hex)
    if (lightness < 0.12) return 'black'
    if (lightness > 0.95) return 'white'
    if (saturation < 0.2) {
        if (lightness < 0.2) return 'black'
        return lightness > 0.9 ? 'white' : 'grey'
    }
    if (hue >= 10 && hue < 50 && max < 0.75) return 'brown'
    return HUE_NAMES.find(([upperHue]) => hue < upperHue)![1]
}

export function translatedColorName(
    t: (key: string) => string,
    color: string | null | undefined,
): string {
    const name = nearestColorName(color)
    return name ? t(`colors.${name}`) : ''
}
