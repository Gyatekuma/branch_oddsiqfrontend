<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import SportsTabs from '@/components/layout/SportsTabs.vue'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import ValueBetBadge from '@/components/predictions/ValueBetBadge.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import NewsletterSignup from '@/components/newsletter/NewsletterSignup.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  ArrowRightIcon,
  ChartBarIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const predictionsStore = usePredictionsStore()
const { isPremium, canSeePrediction, canSeeValueBets } = usePremium()

const selectedSport = ref(null)
const loading = ref(true)
const accuracyPercent = ref(63)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      predictionsStore.fetchTopPicks(3),
      predictionsStore.fetchValueBets(),
      predictionsStore.fetchPredictions({ per_page: 6 })
    ])
  } finally {
    loading.value = false
  }
})

function handleSportChange(sport) {
  selectedSport.value = sport
  predictionsStore.setFilters({ sport })
  predictionsStore.fetchPredictions({ per_page: 6 })
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-b from-surface to-bg py-16 md:py-24">
      <div class="container-app relative z-10">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-text mb-6 leading-tight">
            {{ t('home.hero.title') }}
          </h1>
          <p class="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
            {{ t('home.hero.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <RouterLink to="/register">
              <AppButton size="lg">
                {{ t('home.hero.cta') }}
                <ArrowRightIcon class="w-5 h-5 ml-2" />
              </AppButton>
            </RouterLink>
            <RouterLink to="/predictions">
              <AppButton variant="outline" size="lg">
                {{ t('home.viewAll') }}
              </AppButton>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Background decoration -->
      <div class="absolute inset-0 overflow-hidden opacity-20">
        <div class="absolute -top-1/2 -right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        <div class="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
      </div>
    </section>

    <!-- Top Picks Section -->
    <section class="py-12 bg-bg">
      <div class="container-app">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-display font-bold text-2xl text-text">
            {{ t('home.topPicks') }}
          </h2>
          <RouterLink to="/predictions" class="link-accent text-sm flex items-center gap-1">
            {{ t('home.viewAll') }}
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppSkeleton v-for="i in 3" :key="i" variant="card" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PredictionCard
            v-for="prediction in predictionsStore.topPicks"
            :key="prediction.id"
            :prediction="prediction"
          />
        </div>
      </div>
    </section>

    <!-- Value Bets Section -->
    <section class="py-12 bg-surface">
      <div class="container-app">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <h2 class="font-display font-bold text-2xl text-text">
              {{ t('home.valueBets') }}
            </h2>
            <ValueBetBadge size="sm" />
          </div>
        </div>

        <template v-if="canSeeValueBets">
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AppSkeleton v-for="i in 3" :key="i" variant="card" />
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PredictionCard
              v-for="prediction in predictionsStore.valueBets.slice(0, 3)"
              :key="prediction.id"
              :prediction="prediction"
            />
          </div>
        </template>

        <template v-else>
          <div class="card p-8 text-center">
            <div class="flex items-center justify-center gap-2 mb-4">
              <FireIcon class="w-8 h-8 text-accent" />
              <span class="font-display font-bold text-2xl text-accent">
                {{ predictionsStore.valueBets.length }}
              </span>
            </div>
            <p class="text-lg text-text mb-2">
              {{ t('home.valueBetsCount', { count: predictionsStore.valueBets.length }) }}
            </p>
            <p class="text-muted mb-6">
              Upgrade to premium to see all value bets with expert analysis.
            </p>
            <RouterLink to="/premium">
              <AppButton variant="gold">
                <SparklesIcon class="w-4 h-4 mr-2" />
                {{ t('dashboard.subscription.upgrade') }}
              </AppButton>
            </RouterLink>
          </div>
        </template>
      </div>
    </section>

    <!-- Featured Predictions Section -->
    <section class="py-12 bg-bg">
      <div class="container-app">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-display font-bold text-2xl text-text">
            {{ t('home.featuredPredictions') }}
          </h2>
          <RouterLink to="/predictions" class="link-accent text-sm flex items-center gap-1">
            {{ t('home.viewAll') }}
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>

        <SportsTabs
          :model-value="selectedSport"
          class="mb-6"
          @update:model-value="handleSportChange"
        />

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppSkeleton v-for="i in 6" :key="i" variant="card" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <template v-for="(prediction, index) in predictionsStore.predictions" :key="prediction.id">
            <PredictionCard
              v-if="canSeePrediction(index)"
              :prediction="prediction"
            />
            <PremiumBlur v-else height="200px">
              <PredictionCard :prediction="prediction" />
            </PremiumBlur>
          </template>
        </div>
      </div>
    </section>

    <!-- Accuracy Snapshot -->
    <section class="py-12 bg-surface">
      <div class="container-app">
        <div class="card p-8 text-center max-w-2xl mx-auto">
          <ChartBarIcon class="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 class="font-display font-bold text-2xl text-text mb-2">
            {{ t('home.accuracySnapshot') }}
          </h2>
          <p class="text-5xl font-display font-bold text-gradient-accent mb-2">
            {{ accuracyPercent }}%
          </p>
          <p class="text-muted mb-6">
            {{ t('home.accuracyThisMonth', { percent: accuracyPercent }) }}
          </p>
          <RouterLink to="/accuracy">
            <AppButton variant="outline">
              View Full Stats
              <ArrowRightIcon class="w-4 h-4 ml-2" />
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="py-12 bg-bg">
      <div class="container-app">
        <div class="max-w-xl mx-auto">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  </div>
</template>
