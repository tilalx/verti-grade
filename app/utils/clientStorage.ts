import { INVENTORY_INSTRUCTIONS_KEY, INVENTORY_STORAGE_KEY } from './inventory'

export const AUTH_COOKIE = 'pb_auth'
export const SESSION_ONLY_AUTH_COOKIE = 'pb_auth_session'
export const THEME_MODE_COOKIE = 'theme-mode'
export const SIDEBAR_OPEN_COOKIE = 'sidebar-open'
export const EXPORT_COLUMNS_KEY = 'gripello.export-columns'
export const UPDATE_DISMISSED_KEY = 'gripello:update-dismissed'

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
        name: SESSION_ONLY_AUTH_COOKIE,
        kind: 'cookie',
        purpose: 'auth',
        duration: 'session',
    },
    {
        name: THEME_MODE_COOKIE,
        kind: 'cookie',
        purpose: 'colorScheme',
        duration: 'oneYear',
    },
    {
        name: SIDEBAR_OPEN_COOKIE,
        kind: 'cookie',
        purpose: 'sidebar',
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
