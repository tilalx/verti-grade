import type { TickType } from '#shared/utils/ticks'

export const TICK_TYPE_COLORS: Record<TickType, string> = {
    flash: 'amber-darken-2',
    top: 'success',
    attempt: 'blue-grey-darken-1',
}

export const TICK_TYPE_ICONS: Record<TickType, string> = {
    flash: 'mdi-lightning-bolt',
    top: 'mdi-flag-checkered',
    attempt: 'mdi-reload',
}
