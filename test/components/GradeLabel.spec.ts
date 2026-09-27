import { mount } from '@vue/test-utils'
import GradeLabel from '~/components/GradeLabel.vue'

const isUnexpectedSystem = vi.fn(
    (source: { grade_system?: string | null }) => source.grade_system === 'yds',
)

function createWrapper(props: Record<string, unknown>) {
    return mount(GradeLabel, {
        props,
        global: { mocks: { $t: (key: string) => key } },
    })
}

describe('GradeLabel', () => {
    beforeEach(() => {
        isUnexpectedSystem.mockClear()
        vi.stubGlobal('useGradeSystems', () => ({ isUnexpectedSystem }))
    })

    it('renders the grade without a system hint for the expected system', () => {
        const wrapper = createWrapper({
            source: { grade: '6a+', grade_system: 'french' },
        })

        expect(wrapper.text()).toBe('6a+')
        expect(wrapper.find('.grade-label__system').exists()).toBe(false)
    })

    it('adds the short system label for an unexpected system', () => {
        const wrapper = createWrapper({
            source: { grade: '5.10a', grade_system: 'yds' },
        })

        expect(wrapper.find('.grade-label__system').text()).toBe(
            'gradeSystemsShort.yds',
        )
    })

    it('uses an explicit showSystem without asking the composable', () => {
        const wrapper = createWrapper({
            source: { grade: '6a+', grade_system: 'french' },
            showSystem: true,
        })

        expect(wrapper.find('.grade-label__system').text()).toBe(
            'gradeSystemsShort.french',
        )
        expect(isUnexpectedSystem).not.toHaveBeenCalled()
    })

    it('hides the hint when showSystem is false', () => {
        const wrapper = createWrapper({
            source: { grade: '5.10a', grade_system: 'yds' },
            showSystem: false,
        })

        expect(wrapper.find('.grade-label__system').exists()).toBe(false)
    })

    it('renders nothing visible for a missing grade', () => {
        const wrapper = createWrapper({ source: null })

        expect(wrapper.text()).toBe('')
    })
})
