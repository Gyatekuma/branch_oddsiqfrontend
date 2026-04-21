<script setup>
defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  rounded: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg', 'full'].includes(v)
  },
  variant: {
    type: String,
    default: 'line',
    validator: (v) => ['line', 'circle', 'card', 'avatar'].includes(v)
  }
})

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full'
}
</script>

<template>
  <div
    v-if="variant === 'line'"
    class="animate-pulse bg-border"
    :class="roundedClasses[rounded]"
    :style="{ width, height }"
  />

  <div
    v-else-if="variant === 'circle'"
    class="animate-pulse bg-border rounded-full"
    :style="{ width, height }"
  />

  <div
    v-else-if="variant === 'avatar'"
    class="animate-pulse bg-border rounded-full w-10 h-10"
  />

  <div
    v-else-if="variant === 'card'"
    class="animate-pulse bg-surface border border-border rounded-lg p-4 space-y-3"
    :style="{ width }"
  >
    <div class="flex items-center space-x-3">
      <div class="bg-border rounded-full w-10 h-10" />
      <div class="flex-1 space-y-2">
        <div class="bg-border rounded h-4 w-3/4" />
        <div class="bg-border rounded h-3 w-1/2" />
      </div>
    </div>
    <div class="space-y-2">
      <div class="bg-border rounded h-3 w-full" />
      <div class="bg-border rounded h-3 w-5/6" />
    </div>
    <div class="flex justify-between pt-2">
      <div class="bg-border rounded h-6 w-20" />
      <div class="bg-border rounded h-6 w-16" />
    </div>
  </div>
</template>
