<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import guidesApi from '@/api/guides'
import { useLocale } from '@/composables/useLocale'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon, BookOpenIcon, ClockIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { marked } from 'marked'

const route = useRoute()
const { formatDate } = useLocale()

const loading = ref(true)
const guide = ref(null)
const relatedGuides = ref([])

// Configure marked for clean output
marked.setOptions({ breaks: true, gfm: true })

const renderedBody = computed(() => {
  if (!guide.value?.body) return ''
  return marked(guide.value.body)
})

const readingTime = computed(() => {
  if (!guide.value?.body) return 0
  const words = guide.value.body.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
})

async function loadGuide(slug) {
  loading.value = true
  guide.value = null
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
}

onMounted(() => loadGuide(route.params.slug))
watch(() => route.params.slug, slug => slug && loadGuide(slug))
</script>

<template>
  <div class="min-h-screen bg-bg py-10">
    <div class="container-app">

      <!-- Back -->
      <RouterLink
        to="/guides"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-8 group"
      >
        <ArrowLeftIcon class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Guides
      </RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="max-w-2xl mx-auto space-y-5">
        <AppSkeleton height="44px" width="70%" rounded="lg" />
        <AppSkeleton height="20px" width="35%" rounded="lg" />
        <AppSkeleton height="220px" rounded="xl" />
        <AppSkeleton height="160px" rounded="xl" />
        <AppSkeleton height="180px" rounded="xl" />
      </div>

      <template v-else-if="guide">
        <div class="max-w-2xl mx-auto">

          <!-- Hero header -->
          <div class="mb-10">
            <!-- Category + reading time -->
            <div class="flex items-center gap-2 mb-4 flex-wrap">
              <span
                v-if="guide.sport"
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/25"
              >
                {{ guide.sport }}
              </span>
              <span
                v-else
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface text-muted border border-border"
              >
                Betting Guide
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-muted">
                <ClockIcon class="w-3.5 h-3.5" />
                {{ readingTime }} min read
              </span>
            </div>

            <!-- Title -->
            <h1 class="font-display font-bold text-3xl md:text-4xl leading-tight text-text mb-3">
              {{ guide.title }}
            </h1>

            <!-- Divider -->
            <div class="h-0.5 w-16 bg-accent rounded-full mt-6" />
          </div>

          <!-- Body — parsed markdown -->
          <div class="guide-body" v-html="renderedBody" />

          <!-- Footer -->
          <div class="mt-12 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <p class="text-xs text-muted">Updated {{ formatDate(guide.updated_at) }}</p>
            <RouterLink to="/guides" class="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-medium">
              <ArrowLeftIcon class="w-3.5 h-3.5" />
              All Guides
            </RouterLink>
          </div>
        </div>

        <!-- Related guides -->
        <div v-if="relatedGuides.length" class="max-w-2xl mx-auto mt-16">
          <h2 class="font-display font-bold text-lg text-text mb-5">More Guides</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RouterLink
              v-for="rel in relatedGuides"
              :key="rel.id"
              :to="`/guides/${rel.slug}`"
              class="group flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface/80 transition-all"
            >
              <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpenIcon class="w-4 h-4 text-accent" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-text group-hover:text-accent transition-colors leading-snug">{{ rel.title }}</p>
                <p v-if="rel.sport" class="text-xs text-muted capitalize mt-0.5">{{ rel.sport }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </template>

      <!-- Not found -->
      <div v-else class="max-w-md mx-auto card p-12 text-center mt-10">
        <BookOpenIcon class="w-10 h-10 text-muted/40 mx-auto mb-4" />
        <p class="text-muted text-lg mb-5">Guide not found</p>
        <RouterLink to="/guides">
          <AppButton>Back to Guides</AppButton>
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Guide body typography ───────────────────────────────── */
.guide-body {
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 1rem;
}

/* Headings */
.guide-body :deep(h2) {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #f1f5f9;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #1a2035;
}

.guide-body :deep(h3) {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: #f1f5f9;
  margin-top: 1.75rem;
  margin-bottom: 0.5rem;
}

/* Paragraphs */
.guide-body :deep(p) {
  margin-bottom: 1.1rem;
  color: #cbd5e1;
}

/* Bold */
.guide-body :deep(strong) {
  color: #f1f5f9;
  font-weight: 600;
}

/* Horizontal rule */
.guide-body :deep(hr) {
  border: none;
  border-top: 1px solid #1a2035;
  margin: 2rem 0;
}

/* Lists */
.guide-body :deep(ul) {
  list-style: none;
  padding: 0;
  margin-bottom: 1.25rem;
}

.guide-body :deep(ul li) {
  position: relative;
  padding-left: 1.25rem;
  margin-bottom: 0.45rem;
  color: #cbd5e1;
}

.guide-body :deep(ul li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6rem;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d4a017;
}

.guide-body :deep(ol) {
  list-style: none;
  padding: 0;
  margin-bottom: 1.25rem;
  counter-reset: ol-counter;
}

.guide-body :deep(ol li) {
  position: relative;
  padding-left: 1.75rem;
  margin-bottom: 0.45rem;
  color: #cbd5e1;
  counter-increment: ol-counter;
}

.guide-body :deep(ol li)::before {
  content: counter(ol-counter);
  position: absolute;
  left: 0;
  top: 0.05rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: #d4a017;
  color: #06080f;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Blockquote */
.guide-body :deep(blockquote) {
  border-left: 3px solid #d4a017;
  background: #0d1018;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 0.9rem 1.1rem;
  margin: 1.5rem 0;
  color: #94a3b8;
  font-style: italic;
}

.guide-body :deep(blockquote p) {
  margin-bottom: 0;
}

/* Tables */
.guide-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.88rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #1a2035;
}

.guide-body :deep(thead) {
  background: #0d1018;
}

.guide-body :deep(th) {
  text-align: left;
  padding: 0.65rem 1rem;
  color: #d4a017;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #1a2035;
}

.guide-body :deep(td) {
  padding: 0.6rem 1rem;
  color: #cbd5e1;
  border-bottom: 1px solid #1a2035;
}

.guide-body :deep(tr:last-child td) {
  border-bottom: none;
}

.guide-body :deep(tr:nth-child(even)) {
  background: rgba(13, 16, 24, 0.5);
}

/* Code */
.guide-body :deep(code) {
  background: #0d1018;
  border: 1px solid #1a2035;
  border-radius: 0.3rem;
  padding: 0.15rem 0.45rem;
  font-size: 0.85em;
  color: #d4a017;
}

/* Inline emphasis callout — any line starting with > that isn't italic */
.guide-body :deep(em) {
  color: #94a3b8;
  font-style: italic;
}
</style>
