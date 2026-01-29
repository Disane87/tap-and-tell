export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'system')
  const isDark = useState('is-dark', () => false)

  function updateDarkMode() {
    if (import.meta.client) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (theme.value === 'system') {
        isDark.value = prefersDark
      } else {
        isDark.value = theme.value === 'dark'
      }

      if (isDark.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme

    if (import.meta.client) {
      localStorage.setItem('theme', newTheme)
    }

    updateDarkMode()
  }

  function toggleTheme() {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  function initTheme() {
    if (import.meta.client) {
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        theme.value = stored
      }

      updateDarkMode()

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme.value === 'system') {
          updateDarkMode()
        }
      })
    }
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme,
    initTheme
  }
}
