import { INVENTORY_INSTRUCTIONS_KEY, INVENTORY_STORAGE_KEY } from './inventory'

export const AUTH_COOKIE = 'pb_auth'
export const COLOR_SCHEME_COOKIE = 'color-scheme'
export const EXPORT_COLUMNS_KEY = 'verti-grade.export-columns'
export const UPDATE_DISMISSED_KEY = 'verti-grade:update-dismissed'

export type ClientStorageKind = 'cookie' | 'localStorage'

export interface ClientStorageEntry {
    name: string
    kind: ClientStorageKind
    purpose: string
    duration: string
}

export const CLIENT_STORAGE: ClientStorageEntry[] = [
    { name: AUTH_COOKIE, kind: 'cookie', purpose: 'auth', duration: 'session' },
    {
        name: COLOR_SCHEME_COOKIE,
        kind: 'cookie',
        purpose: 'colorScheme',
        duration: 'oneYear',
    },
    {
        name: EXPORT_COLUMNS_KEY,
        kind: 'localStorage',
        purpose: 'exportColumns',
        duration: 'persistent',
    },
    {
        name: UPDATE_DISMISSED_KEY,
        kind: 'localStorage',
        purpose: 'updateDismissed',
        duration: 'persistent',
    },
    {
        name: INVENTORY_STORAGE_KEY,
        kind: 'localStorage',
        purpose: 'inventorySession',
        duration: 'persistent',
    },
    {
        name: INVENTORY_INSTRUCTIONS_KEY,
        kind: 'localStorage',
        purpose: 'inventoryInstructions',
        duration: 'persistent',
    },
]
