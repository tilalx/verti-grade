import { describe, expect, it } from 'vitest'
import { parseChange, parseReleaseNotes } from '#shared/utils/releaseNotes'

const BODY = `## What's Changed
* feat: introduce playwright testing by @tilalx in https://github.com/tilalx/verti-grade/pull/436
* fix(reviews): make show more work by @tilalx in https://github.com/tilalx/verti-grade/pull/438
* chore(deps-dev): bump vue from 3.5.42 to 3.5.43 by @dependabot[bot] in https://github.com/tilalx/verti-grade/pull/460
* refactor(ui)!: unify look by @tilalx in https://github.com/tilalx/verti-grade/pull/437

**Full Changelog**: https://github.com/tilalx/verti-grade/compare/v1.10.3...v2.0.0`

describe('parseReleaseNotes', () => {
    it('parses every bullet into a structured change', () => {
        const { changes, compare } = parseReleaseNotes(BODY)
        expect(changes).toHaveLength(4)
        expect(changes[0]).toEqual({
            type: 'feat',
            scope: null,
            breaking: false,
            subject: 'introduce playwright testing',
            author: 'tilalx',
            pr: '436',
            category: 'feat',
        })
        expect(compare).toBe('v1.10.3...v2.0.0')
    })

    it('categorizes fixes, dependency bumps and breaking changes', () => {
        const [, fix, deps, refactor] = parseReleaseNotes(BODY).changes
        expect(fix).toMatchObject({ category: 'fix', scope: 'reviews' })
        expect(deps).toMatchObject({
            category: 'deps',
            author: 'dependabot[bot]',
            pr: '460',
        })
        expect(refactor).toMatchObject({ category: 'other', breaking: true })
    })

    it('returns no changes for free text', () => {
        expect(parseReleaseNotes('Fixed a thing').changes).toEqual([])
    })
})

describe('parseChange', () => {
    it('turns a bare pull request url into a pr link, not a type', () => {
        expect(parseChange('https://github.com/o/r/pull/42')).toMatchObject({
            type: null,
            subject: '',
            pr: '42',
        })
    })

    it('needs a space after the colon to read a commit type', () => {
        expect(parseChange('note:no space')).toMatchObject({
            type: null,
            subject: 'note:no space',
        })
    })

    it('parses plain commit messages', () => {
        expect(parseChange('feat(search): global search (#480)')).toMatchObject(
            {
                type: 'feat',
                scope: 'search',
                subject: 'global search',
                pr: '480',
            },
        )
        expect(parseChange('update readme')).toMatchObject({
            type: null,
            subject: 'update readme',
            category: 'other',
        })
    })
})
