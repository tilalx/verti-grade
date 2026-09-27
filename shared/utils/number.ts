export function formatNumber(
    value: number | null | undefined,
    locale: string,
    fractionDigits = 1,
): string {
    if (value == null || Number.isNaN(value)) return ''
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)
}
