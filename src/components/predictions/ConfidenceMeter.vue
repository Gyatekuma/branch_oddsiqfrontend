<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true,
    validator: (v) => v >= 0 && v <= 100
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  animate: {
    type: Boolean,
    default: true
  }
})

const animatedValue = ref(props.animate ? 0 : props.value)

const sizeConfig = {
  sm: { width: 60, height: 35, strokeWidth: 4, fontSize: 'text-sm' },
  md: { width: 80, height: 45, strokeWidth: 5, fontSize: 'text-base' },
  lg: { width: 120, height: 65, strokeWidth: 6, fontSize: 'text-xl' }
}

const config = computed(() => sizeConfig[props.size])

const color = computed(() => {
  const v = animatedValue.value
  if (v < 40) return '#ef4444' // loss/red
  if (v < 70) return '#eab308' // draw/yellow
  return '#00e676' // accent/green
})

const radius = computed(() => (config.value.width - config.value.strokeWidth) / 2)
const circumference = computed(() => Math.PI * radius.value)
const dashOffset = computed(() => {
  const progress = animatedValue.value / 100
  return circumference.value * (1 - progress)
})

const centerX = computed(() => config.value.width / 2)
const centerY = computed(() => config.value.height)

onMounted(() => {
  if (props.animate) {
    // Animate the value from 0 to target
    const duration = 1000
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      animatedValue.value = Math.round(props.value * eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }
})
</script>

<template>
  <div class="flex flex-col items-center">
    <svg
      :width="config.width"
      :height="config.height"
      class="overflow-visible"
    >
      <!-- Background arc -->
      <path
        :d="`M ${config.strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${centerY}`"
        fill="none"
        :stroke="'#1f2937'"
        :stroke-width="config.strokeWidth"
        stroke-linecap="round"
      />

      <!-- Progress arc -->
      <path
        :d="`M ${config.strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${centerY}`"
        fill="none"
        :stroke="color"
        :stroke-width="config.strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-all duration-300"
        style="filter: drop-shadow(0 0 4px currentColor);"
      />

      <!-- Value text -->
      <text
        :x="centerX"
        :y="centerY - 8"
        text-anchor="middle"
        :class="['font-display font-bold fill-current', config.fontSize]"
        :fill="color"
      >
        {{ animatedValue }}%
      </text>
    </svg>

    <span v-if="showLabel" class="stat-label mt-1">
      Confidence
    </span>
  </div>
</template>
