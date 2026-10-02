import { describe, expect, it } from 'vitest'
import { formatMonthLabel, niceAxis, readChartColors } from '~/utils/echarts'

describe('niceAxis', () => {
    it('rounds the max up to a nice interval', () => {
        expect(niceAxis([7])).toEqual({ max: 8, interval: 2 })
        expect(niceAxis([])).toEqual({ max: 1, interval: 0.5 })
    })
})

describe('formatMonthLabel', () => {
    it('formats a month key with the given locale', () => {
        expect(formatMonthLabel('2024-03', 'en-US')).toBe('Mar 2024')
        expect(formatMonthLabel('bogus', 'en-US')).toBe('bogus')
    })
})

describe('readChartColors', () => {
    it('produces colours a canvas can parse in both themes', () => {
        const rgba = /^rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0?\.\d+)\)$/
        for (const isDark of [false, true]) {
            for (const color of Object.values(readChartColors(isDark))) {
                expect(color).toMatch(rgba)
            }
        }
    })

    it('uses light text on dark charts', () => {
        expect(readChartColors(true).labelColor).toContain('221, 221, 221')
        expect(readChartColors(false).labelColor).toContain('23, 23, 23')
    })
})
