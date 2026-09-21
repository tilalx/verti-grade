/**
 * Stable test id segment for a nav target: `/manage/comments` ->
 * `manage-comments`, `/` -> `home`. Shared so the desktop row, the group
 * menus and the mobile drawer cannot drift apart.
 */
export function navTestId(to: string): string {
    return to.replace(/^\//, '').replaceAll('/', '-') || 'home'
}
