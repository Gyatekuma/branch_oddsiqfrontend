<script setup>
import { useI18n } from 'vue-i18n'
import { usePremium } from '@/composables/usePremium'
import AppButton from '@/components/ui/AppButton.vue'
import { LockClosedIcon, SparklesIcon } from '@heroicons/vue/24/solid'

defineProps({
  height: {
    type: String,
    default: 'auto'
  },
  message: {
    type: String,
    default: null
  }
})

const { t } = useI18n()
const { promptUpgrade } = usePremium()
</script>

<template>
  <div class="relative overflow-hidden rounded-lg" :style="{ minHeight: height }">
    <!-- Blurred content slot -->
    <div class="blur-md select-none pointer-events-none opacity-50">
      <slot />
    </div>

    <!-- Overlay -->
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-6 text-center">
      <div class="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
        <LockClosedIcon class="w-8 h-8 text-gold" />
      </div>

      <h3 class="font-display font-bold text-xl text-text mb-2">
        {{ message || t('premium.title') }}
      </h3>

      <p class="text-muted text-sm mb-6 max-w-xs">
        {{ t('premium.subtitle') }}
      </p>

      <AppButton variant="gold" @click="promptUpgrade">
        <SparklesIcon class="w-4 h-4 mr-2" />
        {{ t('dashboard.subscription.upgrade') }}
      </AppButton>
    </div>
  </div>
</template>
