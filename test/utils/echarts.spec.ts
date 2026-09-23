import { describe, expect, it } from 'vitest'
import { formatMonthLabel, niceAxis } from '~/utils/echarts'

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
