<template>
    <USidebar
        :open="open"
        collapsible="icon"
        :ui="{
            container: 'z-40 bg-default',
            header: 'px-3',
            body: 'p-3',
            footer: 'p-3',
        }"
        data-testid="nav-sidebar"
    >
        <template #header>
            <LayoutBrandLogo
                :settings="settings"
                :class="open ? 'ps-1' : 'mx-auto [&_img]:max-w-10'"
            />
        </template>

        <UNavigationMenu
            :items="navLists"
            orientation="vertical"
            :collapsed="!open"
            tooltip
            highlight
            :aria-label="$t('nav.mainNavigation')"
            :ui="{ link: 'py-2', separator: 'my-2' }"
            data-testid="nav-desktop-links"
        >
            <template #item-label="{ item, active }">
                <span
                    :class="{
                        'nav-link--active':
                            active || (item as SidebarItem).current,
                    }"
                    :data-testid="(item as SidebarItem).testid"
                >
                    {{ item.label }}
                </span>
            </template>
        </UNavigationMenu>

        <template v-if="loggedIn" #footer>
            <UserIcon :collapsed="!open" />
        </template>
    </USidebar>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { SettingsRecord } from '~/types/models'
import {
    staffSections,
    visibleNavItems,
    type NavLink,
} from '~/utils/navigation'

interface SidebarItem extends NavigationMenuItem {
    testid?: string
    current?: boolean
}

const props = defineProps<{
    loggedIn: boolean
    settings: Partial<SettingsRecord>
}>()

const { can } = usePermissions()
const { t } = useI18n()
const route = useRoute()

const { open } = useSidebar()

const toItem = (link: NavLink): SidebarItem => ({
    label: t(link.label),
    icon: link.icon,
    to: link.to,
    testid: `nav-link-${navTestId(link.to)}`,
})

const navLists = computed<SidebarItem[][]>(() => [
    visibleNavItems(can, props.loggedIn)
        .filter((item) => !item.children && !item.permission)
        .map((item) => toItem(item as NavLink)),
    ...staffSections(can).map((section) => [
        {
            type: 'label' as const,
            label: t(section.label),
            testid: `nav-group-${section.key}`,
            current: section.links.some((link) =>
                route.path.startsWith(link.to),
            ),
        },
        ...section.links.map(toItem),
    ]),
])
</script>
