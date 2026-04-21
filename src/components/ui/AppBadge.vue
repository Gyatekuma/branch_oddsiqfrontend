<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'success', 'warning', 'danger', 'accent', 'gold', 'muted'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  pill: {
    type: Boolean,
    default: true
  }
})

const classes = computed(() => {
  const base = 'inline-flex items-center font-semibold'

  const variants = {
    default: 'bg-surface text-text border border-border',
    success: 'bg-win/20 text-win border border-win/30',
    warning: 'bg-draw/20 text-draw border border-draw/30',
    danger: 'bg-loss/20 text-loss border border-loss/30',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    gold: 'bg-gold/20 text-gold border border-gold/30',
    muted: 'bg-muted/20 text-muted border border-muted/30'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return [
    base,
    variants[props.variant],
    sizes[props.size],
    props.pill ? 'rounded-full' : 'rounded'
  ].join(' ')
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
