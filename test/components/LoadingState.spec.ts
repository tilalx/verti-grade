import { mount } from '@vue/test-utils'
import LoadingState from '~/components/layout/LoadingState.vue'

const skeletonStub = {
    props: ['type'],
    template: '<div class="skeleton" :data-type="type" />',
}
const slotStub = { template: '<div><slot /></div>' }

function createWrapper(props: Record<string, unknown> = {}) {
    return mount(LoadingState, {
        props,
        global: {
            stubs: {
                'v-skeleton-loader': skeletonStub,
                'v-row': slotStub,
                'v-col': slotStub,
            },
        },
    })
}

function skeletonTypes(wrapper: ReturnType<typeof createWrapper>) {
    return wrapper
        .findAll('.skeleton')
        .map((skeleton) => skeleton.attributes('data-type'))
}

describe('LoadingState', () => {
    it('announces itself as busy', () => {
        const wrapper = createWrapper()

        expect(wrapper.attributes('aria-busy')).toBe('true')
        expect(wrapper.attributes('aria-live')).toBe('polite')
    })

    it('renders three list skeletons by default', () => {
        expect(skeletonTypes(createWrapper())).toEqual(
            Array(3).fill('list-item-avatar-two-line'),
        )
    })

    it('renders six card skeletons for the cards variant', () => {
        expect(skeletonTypes(createWrapper({ variant: 'cards' }))).toEqual(
            Array(6).fill('card-avatar'),
        )
    })

    it('honours count and type overrides', () => {
        expect(
            skeletonTypes(createWrapper({ count: 1, type: 'card' })),
        ).toEqual(['card'])
    })

    it('renders a hero, heading and list rows for the page variant', () => {
        const types = skeletonTypes(createWrapper({ variant: 'page' }))

        expect(types.slice(0, 2)).toEqual(['image', 'heading'])
        expect(
            types.filter((type) => type === 'list-item-avatar-two-line'),
        ).toHaveLength(3)
    })
})
