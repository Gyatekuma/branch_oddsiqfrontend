<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  showAll: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const sports = [
  { id: 'football', icon: '\u26BD', name: 'predictions.sports.football' },
  { id: 'basketball', icon: '\uD83C\uDFC0', name: 'predictions.sports.basketball' },
  { id: 'tennis', icon: '\uD83C\uDFBE', name: 'predictions.sports.tennis' }
]

function selectSport(sportId) {
  emit('update:modelValue', sportId)
}
</script>

<template>
  <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
    <!-- All tab -->
    <button
      v-if="showAll"
      :class="[
        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
        modelValue === null
          ? 'bg-accent text-bg'
          : 'bg-surface text-muted hover:text-text border border-border hover:border-accent/50'
      ]"
      @click="selectSport(null)"
    >
      {{ t('predictions.filters.all') }}
    </button>

    <!-- Sport tabs -->
    <button
      v-for="sport in sports"
      :key="sport.id"
      :class="[
        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
        modelValue === sport.id
          ? 'bg-accent text-bg'
          : 'bg-surface text-muted hover:text-text border border-border hover:border-accent/50'
      ]"
      @click="selectSport(sport.id)"
    >
      <span class="text-base">{{ sport.icon }}</span>
      <span>{{ t(sport.name) }}</span>
    </button>
  </div>
</template>
