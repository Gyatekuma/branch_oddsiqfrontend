<script setup>
import { computed } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'success', 'warning', 'error'].includes(v)
  },
  title: String,
  dismissible: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'dismiss'])

const config = computed(() => {
  const configs = {
    info: {
      icon: InformationCircleIcon,
      classes: 'bg-accent/10 border-accent/30 text-accent'
    },
    success: {
      icon: CheckCircleIcon,
      classes: 'bg-win/10 border-win/30 text-win'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      classes: 'bg-draw/10 border-draw/30 text-draw'
    },
    error: {
      icon: XCircleIcon,
      classes: 'bg-loss/10 border-loss/30 text-loss'
    }
  }
  return configs[props.variant]
})

function dismiss() {
  emit('update:modelValue', false)
  emit('dismiss')
}
</script>

<template>
  <Transition name="alert">
    <div
      v-if="modelValue"
      :class="[
        'flex items-start gap-3 p-4 border rounded-lg',
        config.classes
      ]"
    >
      <component :is="config.icon" class="w-5 h-5 flex-shrink-0 mt-0.5" />

      <div class="flex-1 min-w-0">
        <h4 v-if="title" class="font-semibold mb-1">{{ title }}</h4>
        <div class="text-sm opacity-90">
          <slot />
        </div>
      </div>

      <button
        v-if="dismissible"
        class="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        @click="dismiss"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
