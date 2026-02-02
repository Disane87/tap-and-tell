<script setup lang="ts">
console.log('TEST PAGE MOUNTED')

definePageMeta({
  layout: false
})
</script>

<template>
  <div style="background: red; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 32px;">
    TEST PAGE WORKS! If you see this, Vue is rendering.
  </div>
</template>
