import { describe, expect, it } from 'vitest'
import { nearestColorName } from '~/utils/colorName'

describe('nearestColorName', () => {
    it.each([
        ['#e53935', 'red'],
        ['#f44336', 'red'],
        ['#ff9800', 'orange'],
        ['#ffeb3b', 'yellow'],
        ['#fdd835', 'yellow'],
        ['#43a047', 'green'],
        ['#8bc34a', 'green'],
        ['#1e88e5', 'blue'],
        ['#3f51b5', 'blue'],
        ['#8e24aa', 'purple'],
        ['#ec407a', 'pink'],
        ['#ff69b4', 'pink'],
        ['#6d4c41', 'brown'],
        ['#000', 'black'],
        ['#fff', 'white'],
        ['#fafafa', 'white'],
        ['#9e9e9e', 'grey'],
        ['#00bcd4', 'turquoise'],
        ['#26a69a', 'turquoise'],
        ['#00acc1', 'turquoise'],
        ['#009688', 'turquoise'],
        ['#795548', 'brown'],
        ['#a0522d', 'brown'],
        ['#da5307', 'orange'],
        ['#ff5722', 'orange'],
        ['#d32f2f', 'red'],
        ['#8b0000', 'red'],
        ['#2196f3', 'blue'],
        ['#03a9f4', 'blue'],
        ['#673ab7', 'purple'],
        ['#9c27b0', 'purple'],
        ['#e91e63', 'pink'],
        ['#212121', 'black'],
        ['#ffffff', 'white'],
        ['#cfcfcf', 'grey'],
        ['#ffc107', 'yellow'],
        ['#4caf50', 'green'],
        ['#f8bbd0', 'pink'],
        ['#b3e5fc', 'blue'],
        ['#c8e6c9', 'green'],
        ['#90caf9', 'blue'],
        ['#a5d6a7', 'green'],
    ])('names %s as %s', (hex, name) => {
        expect(nearestColorName(hex)).toBe(name)
    })

    it('returns null without a usable colour', () => {
        expect(nearestColorName(null)).toBeNull()
        expect(nearestColorName('not a colour')).toBeNull()
    })
})
