<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-2xl border border-border/10 bg-card/70 backdrop-blur-xl text-card-foreground shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        props.class,
      )
    "
    style="backdrop-filter: blur(20px) saturate(180%)"
  >
    <slot />
  </div>
</template>
