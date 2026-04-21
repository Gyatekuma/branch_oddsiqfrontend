<script setup>
import { computed } from 'vue'
import { FireIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  animated: {
    type: Boolean,
    default: true
  }
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }
  return sizes[props.size]
})

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 font-display font-bold uppercase tracking-wider rounded-full',
      'bg-accent/20 text-accent border border-accent/40',
      sizeClasses,
      animated ? 'animate-pulse-glow' : ''
    ]"
  >
    <FireIcon :class="iconSizes[size]" />
    <span>Value Bet</span>
  </span>
</template>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 230, 118, 0.4), 0 0 10px rgba(0, 230, 118, 0.2);
  }
  50% {
    box-shadow: 0 0 10px rgba(0, 230, 118, 0.6), 0 0 20px rgba(0, 230, 118, 0.4), 0 0 30px rgba(0, 230, 118, 0.2);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style>
