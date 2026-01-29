export default defineNuxtPlugin(() => {
  const { initTheme } = useTheme()
  initTheme()
})
