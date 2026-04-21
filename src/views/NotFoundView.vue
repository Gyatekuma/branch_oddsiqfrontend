<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'
import { HomeIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center py-12 px-4">
    <div class="text-center">
      <p class="text-8xl font-display font-bold text-gradient-accent mb-4">404</p>
      <h1 class="text-2xl font-display font-bold text-text mb-2">
        {{ t('errors.notFound.title') }}
      </h1>
      <p class="text-muted mb-8 max-w-md">
        {{ t('errors.notFound.message') }}
      </p>
      <RouterLink to="/">
        <AppButton>
          <HomeIcon class="w-4 h-4 mr-2" />
          {{ t('errors.notFound.home') }}
        </AppButton>
      </RouterLink>
    </div>
  </div>
</template>
