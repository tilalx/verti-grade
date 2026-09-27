import { describe, expect, it } from 'vitest'
import { pageLinks, staffSections, visibleNavItems } from '~/utils/navigation'

const allowing =
    (...permissions: string[]) =>
    (permission: string) =>
        permissions.includes(permission)

describe('visibleNavItems', () => {
    it('drops links and empty groups the role cannot open', () => {
        const keys = visibleNavItems(allowing()).map((item) => item.key)
        expect(keys).toEqual(['home', 'map', 'list', 'logbook'])
    })

    it('shows guests only the public pages', () => {
        const keys = visibleNavItems(allowing(), false).map((item) => item.key)
        expect(keys).toEqual(['home', 'map', 'list'])
    })
})

describe('staffSections', () => {
    it('puts route management first and hides empty sections', () => {
        const sections = staffSections(allowing('manage_routes'))
        expect(sections.map((section) => section.key)).toEqual(['manage'])
        expect(sections[0]!.links.map((link) => link.to)).toEqual([
            '/manage/routes',
            '/manage/map',
        ])
    })

    it('gives admins every section', () => {
        const all = allowing(
            'manage_routes',
            'manage_comments',
            'manage_settings',
            'manage_users',
        )
        expect(staffSections(all).map((section) => section.key)).toEqual([
            'manage',
            'admin',
        ])
    })

    it('returns nothing for climbers', () => {
        expect(staffSections(allowing())).toEqual([])
    })
})

describe('pageLinks', () => {
    it('lists public pages that are not in the bottom nav', () => {
        expect(pageLinks(false).map((link) => link.to)).toEqual([
            '/',
            '/routes',
        ])
    })
})
