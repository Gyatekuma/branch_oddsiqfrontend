<script setup>
import { computed } from 'vue'
import { ArrowDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  isPulling:    { type: Boolean, default: false },
  isRefreshing: { type: Boolean, default: false },
  pullDistance: { type: Number,  default: 0 }
})

const THRESHOLD = 65 * 0.6

const visible = computed(() => props.isPulling || props.isRefreshing)

// 0 → not ready, 1 → ready to release
const progress = computed(() => Math.min(props.pullDistance / THRESHOLD, 1))

const arrowRotation = computed(() => Math.round(progress.value * 180))

const isReady = computed(() => progress.value >= 1)

// Translate the indicator down based on pull distance (capped)
const translateY = computed(() => {
  if (props.isRefreshing) return '52px'
  return `${props.pullDistance}px`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-show="visible"
      class="ptr-wrap pointer-events-none fixed left-0 right-0 z-50 flex justify-center"
      style="top: 64px;"
      :style="{ transform: `translateY(${translateY})` }"
    >
      <div
        class="ptr-bubble flex items-center justify-center w-9 h-9 rounded-full border shadow-lg transition-colors duration-150"
        :class="isReady || isRefreshing
          ? 'bg-accent border-accent/30 shadow-accent/20'
          : 'bg-surface border-border'"
      >
        <!-- Spinner while refreshing -->
        <svg
          v-if="isRefreshing"
          class="w-4 h-4 text-bg animate-spin"
          viewBox="0 0 24 24" fill="none"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
          <path class="opacity-90" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>

        <!-- Arrow while pulling -->
        <ArrowDownIcon
          v-else
          class="w-4 h-4 transition-colors duration-150"
          :class="isReady ? 'text-bg' : 'text-muted'"
          :style="{ transform: `rotate(${arrowRotation}deg)`, transition: 'transform 0.1s ease' }"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ptr-wrap {
  /* start just above visible area so it slides in naturally */
  transform: translateY(-48px);
  transition: none;
}
</style>
