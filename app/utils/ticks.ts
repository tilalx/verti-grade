import type { BadgeProps } from '@nuxt/ui'
import type { TickType } from '#shared/utils/ticks'

export const TICK_TYPE_COLORS: Record<TickType, BadgeProps['color']> = {
    flash: 'warning',
    top: 'success',
    attempt: 'neutral',
}

export const TICK_TYPE_ICONS: Record<TickType, string> = {
    flash: 'i-lucide-zap',
    top: 'i-lucide-flag-triangle-right',
    attempt: 'i-lucide-rotate-cw',
}
