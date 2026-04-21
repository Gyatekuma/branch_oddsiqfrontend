<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import guidesApi from '@/api/guides'
import { useLocale } from '@/composables/useLocale'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()
const { formatDate } = useLocale()

const loading = ref(true)
const guide = ref(null)
const relatedGuides = ref([])

onMounted(async () => {
  loading.value = true
  const slug = route.params.slug

  try {
    const [guideData, relatedData] = await Promise.all([
      guidesApi.getBySlug(slug),
      guidesApi.getRelated(slug, 3)
    ])
    guide.value = guideData.guide
    relatedGuides.value = relatedData.guides || []
  } catch (err) {
    console.error('Failed to fetch guide:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Back button -->
      <RouterLink
        to="/guides"
        class="inline-flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        {{ t('guides.backToGuides') }}
      </RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="max-w-3xl mx-auto space-y-6">
        <AppSkeleton height="40px" width="80%" rounded="lg" />
        <AppSkeleton height="20px" width="40%" rounded="lg" />
        <AppSkeleton height="300px" rounded="lg" />
        <AppSkeleton height="200px" rounded="lg" />
      </div>

      <template v-else-if="guide">
        <article class="max-w-3xl mx-auto">
          <!-- Header -->
          <header class="mb-8">
            <div class="flex items-center gap-2 text-sm text-muted mb-4">
              <span v-if="guide.sport" class="uppercase tracking-wider">
                {{ guide.sport }}
              </span>
              <span v-if="guide.sport">&bull;</span>
              <span>{{ formatDate(guide.created_at) }}</span>
            </div>

            <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-4">
              {{ guide.title }}
            </h1>
          </header>

          <!-- Content (body from backend) -->
          <div
            class="prose prose-invert prose-lg max-w-none"
            v-html="guide.body"
          />

          <!-- Footer with last updated -->
          <div class="mt-12 pt-8 border-t border-border">
            <p class="text-sm text-muted">
              Last updated: {{ formatDate(guide.updated_at) }}
            </p>
          </div>
        </article>

        <!-- Related guides -->
        <aside v-if="relatedGuides.length" class="mt-16">
          <h2 class="font-display font-bold text-xl text-text mb-6 text-center">
            {{ t('guides.related') }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RouterLink
              v-for="related in relatedGuides"
              :key="related.id"
              :to="`/guides/${related.slug}`"
              class="card-hover p-4 group"
            >
              <div class="flex items-start gap-3">
                <BookOpenIcon class="w-5 h-5 text-muted flex-shrink-0 mt-1" />
                <div>
                  <h3 class="font-medium text-text group-hover:text-accent transition-colors mb-1">
                    {{ related.title }}
                  </h3>
                  <p v-if="related.sport" class="text-xs text-muted capitalize">
                    {{ related.sport }}
                  </p>
                </div>
              </div>
            </RouterLink>
          </div>
        </aside>
      </template>

      <!-- Not found -->
      <div v-else class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">Guide not found</p>
        <RouterLink to="/guides">
          <AppButton>Back to Guides</AppButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  color: #f3f4f6;
}

.prose h2 {
  @apply font-display font-bold text-2xl text-text mt-8 mb-4;
}

.prose h3 {
  @apply font-display font-bold text-xl text-text mt-6 mb-3;
}

.prose p {
  @apply text-text leading-relaxed mb-4;
}

.prose ul, .prose ol {
  @apply mb-4 pl-6;
}

.prose li {
  @apply text-text mb-2;
}

.prose a {
  @apply text-accent hover:underline;
}

.prose blockquote {
  @apply border-l-4 border-accent pl-4 italic text-muted;
}

.prose code {
  @apply bg-surface px-1.5 py-0.5 rounded text-sm text-accent;
}

.prose pre {
  @apply bg-surface p-4 rounded-lg overflow-x-auto mb-4;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
