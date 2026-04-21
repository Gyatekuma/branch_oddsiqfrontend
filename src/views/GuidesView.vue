<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import guidesApi from '@/api/guides'
import { useLocale } from '@/composables/useLocale'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { formatDate } = useLocale()

const loading = ref(true)
const guides = ref([])
const sports = ref([])  // Use sports as categories
const selectedSport = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    const guidesData = await guidesApi.getAll()
    guides.value = guidesData.guides || []

    // Extract unique sports from guides as categories
    const uniqueSports = [...new Set(guides.value.map(g => g.sport).filter(Boolean))]
    sports.value = uniqueSports
  } catch (err) {
    console.error('Failed to fetch guides:', err)
  } finally {
    loading.value = false
  }
})

function filterBySport(sport) {
  selectedSport.value = sport
}

function getFilteredGuides() {
  if (!selectedSport.value) return guides.value
  return guides.value.filter(g => g.sport === selectedSport.value)
}

// Generate excerpt - body may not be included in list response
function getExcerpt(guide) {
  if (guide.excerpt) return guide.excerpt
  if (guide.body) {
    // Strip HTML tags and get first 150 characters
    const text = guide.body.replace(/<[^>]*>/g, '')
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }
  // Default message if no body/excerpt available
  return `Learn about ${guide.sport || 'betting'} strategies and tips`
}
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          {{ t('guides.title') }}
        </h1>
        <p class="text-muted">
          {{ t('guides.subtitle') }}
        </p>
      </div>

      <!-- Sports filter -->
      <div v-if="sports.length" class="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
        <button
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            !selectedSport
              ? 'bg-accent text-bg'
              : 'bg-surface text-muted hover:text-text border border-border'
          ]"
          @click="filterBySport(null)"
        >
          All
        </button>
        <button
          v-for="sport in sports"
          :key="sport"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize',
            selectedSport === sport
              ? 'bg-accent text-bg'
              : 'bg-surface text-muted hover:text-text border border-border'
          ]"
          @click="filterBySport(sport)"
        >
          {{ sport }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppSkeleton v-for="i in 6" :key="i" variant="card" height="200px" />
      </div>

      <!-- Guides grid -->
      <div v-else-if="getFilteredGuides().length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RouterLink
          v-for="guide in getFilteredGuides()"
          :key="guide.id"
          :to="`/guides/${guide.slug}`"
          class="card-hover overflow-hidden group"
        >
          <!-- Cover image -->
          <div class="aspect-video bg-surface overflow-hidden">
            <img
              v-if="guide.cover_image"
              :src="guide.cover_image"
              :alt="guide.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            >
            <div v-else class="w-full h-full flex items-center justify-center">
              <BookOpenIcon class="w-12 h-12 text-muted" />
            </div>
          </div>

          <div class="p-4">
            <!-- Sport & date -->
            <div class="flex items-center justify-between text-xs text-muted mb-2">
              <span v-if="guide.sport" class="uppercase tracking-wider">
                {{ guide.sport }}
              </span>
              <span>{{ formatDate(guide.created_at) }}</span>
            </div>

            <!-- Title -->
            <h3 class="font-display font-bold text-lg text-text group-hover:text-accent transition-colors mb-2">
              {{ guide.title }}
            </h3>

            <!-- Excerpt (generated from body) -->
            <p class="text-sm text-muted line-clamp-2 mb-4">
              {{ getExcerpt(guide) }}
            </p>

            <!-- Read more -->
            <span class="inline-flex items-center gap-1 text-sm text-accent font-medium">
              {{ t('guides.readMore') }}
              <ArrowRightIcon class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </RouterLink>
      </div>

      <!-- Empty state -->
      <div v-else class="card p-12 text-center">
        <BookOpenIcon class="w-12 h-12 text-muted mx-auto mb-4" />
        <p class="text-muted text-lg mb-4">
          No guides available yet
        </p>
        <AppButton variant="outline" @click="filterBySport(null)">
          Show All Guides
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
