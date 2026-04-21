<script setup>
import { ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'

const { locale, locales, currentLocaleInfo, setLocale } = useLocale()

const isOpen = ref(false)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectLocale(code) {
  setLocale(code)
  isOpen.value = false
}

function handleClickOutside(e) {
  if (!e.target.closest('.language-toggle')) {
    isOpen.value = false
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<template>
  <div class="language-toggle relative">
    <button
      class="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-text transition-colors rounded-lg hover:bg-surface"
      @click="toggleDropdown"
    >
      <GlobeAltIcon class="w-4 h-4" />
      <span class="hidden sm:inline">{{ currentLocaleInfo.name }}</span>
      <span class="sm:hidden">{{ locale.toUpperCase() }}</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <button
          v-for="loc in locales"
          :key="loc.code"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
            locale === loc.code
              ? 'bg-accent/10 text-accent'
              : 'text-text hover:bg-bg'
          ]"
          @click="selectLocale(loc.code)"
        >
          <span class="text-lg">{{ loc.flag }}</span>
          <span>{{ loc.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
