<script setup lang="ts">
console.log('FLAT ROUTE TEST: Starting')

definePageMeta({
  layout: false
})

const route = useRoute()
console.log('FLAT ROUTE TEST: Route params', route.params)

onMounted(() => {
  console.log('FLAT ROUTE TEST: Component mounted!')
})
</script>

<template>
  <div style="background: lime; color: black; min-height: 100vh; padding: 2rem; font-size: 24px;">
    <h1 style="font-size: 48px; margin-bottom: 2rem;">✅ FLAT ROUTE TEST</h1>
    <p style="margin-bottom: 1rem;">If you see this LIME page, routing works on flat structure!</p>
    <p style="margin-bottom: 1rem;">ID param: {{ route.params.id }}</p>
    <div style="background: yellow; padding: 1rem; margin-top: 2rem;">
      <p style="font-weight: bold;">This page is at /gb/[id]</p>
      <p>If this works but /t/[uuid]/g/[guestbookUuid] doesn't, there's a nested routing issue.</p>
    </div>
  </div>
</template>
