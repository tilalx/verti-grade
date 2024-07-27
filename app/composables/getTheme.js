// composables/getTheme.js
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from 'vuetify'

export function getTheme() {
  const deviceTheme = ref('light')
  let theme = null

  const updateTheme = () => {
    const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    deviceTheme.value = colorSchemeMediaQuery.matches ? 'dark' : 'light'
    if (theme) {
      theme.global.name.value = deviceTheme.value
    }
  }

  onMounted(() => {
    theme = useTheme()
    const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    updateTheme()

    colorSchemeMediaQuery.addEventListener('change', updateTheme)

    onUnmounted(() => {
      colorSchemeMediaQuery.removeEventListener('change', updateTheme)
    })
  })

  return deviceTheme
}