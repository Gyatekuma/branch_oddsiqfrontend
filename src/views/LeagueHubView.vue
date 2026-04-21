<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import leaguesApi from '@/api/leagues'
import { useLocale } from '@/composables/useLocale'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon, CalendarIcon, TrophyIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()
const { formatDate, formatTime } = useLocale()

const loading = ref(true)
const league = ref(null)
const standings = ref([])
const fixtures = ref([])
const predictions = ref([])
const activeTab = ref('standings')

const tabs = [
  { id: 'standings', name: 'league.standings', icon: TrophyIcon },
  { id: 'fixtures', name: 'league.fixtures', icon: CalendarIcon }
]

onMounted(async () => {
  loading.value = true
  const id = route.params.id

  try {
    const [leagueData, standingsData, fixturesData, predictionsData] = await Promise.all([
      leaguesApi.getById(id),
      leaguesApi.getStandings(id),
      leaguesApi.getFixtures(id, { limit: 10 }),
      leaguesApi.getPredictions(id, { limit: 6 })
    ])

    league.value = leagueData.league
    standings.value = standingsData.standings || []
    fixtures.value = fixturesData.fixtures || []
    predictions.value = predictionsData.predictions || []
  } catch (err) {
    console.error('Failed to fetch league data:', err)
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
        to="/predictions"
        class="inline-flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        {{ t('common.back') }}
      </RouterLink>

      <!-- Loading state -->
      <div v-if="loading" class="space-y-6">
        <AppSkeleton height="120px" rounded="lg" />
        <AppSkeleton height="400px" rounded="lg" />
      </div>

      <template v-else-if="league">
        <!-- League Header -->
        <div class="card p-6 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
              <img
                v-if="league.logo"
                :src="league.logo"
                :alt="league.name"
                class="w-12 h-12 object-contain"
              >
              <TrophyIcon v-else class="w-8 h-8 text-muted" />
            </div>
            <div>
              <h1 class="font-display font-bold text-2xl md:text-3xl text-text">
                {{ league.name }}
              </h1>
              <p v-if="league.country" class="text-muted">
                {{ league.country }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-accent text-bg'
                : 'bg-surface text-muted hover:text-text'
            ]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ t(tab.name) }}
          </button>
        </div>

        <!-- Standings Tab -->
        <div v-if="activeTab === 'standings'" class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="border-b border-border bg-bg/50">
                  <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted w-12">#</th>
                  <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Team</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">P</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">W</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">D</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">L</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">GD</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Pts</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="(team, index) in standings"
                  :key="team.id || index"
                  class="hover:bg-bg/50 transition-colors"
                >
                  <td class="px-4 py-3 text-sm text-muted">{{ index + 1 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="team.logo"
                        :src="team.logo"
                        :alt="team.name"
                        class="w-6 h-6 object-contain"
                      >
                      <span class="text-sm font-medium text-text">{{ team.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-center text-muted">{{ team.played }}</td>
                  <td class="px-4 py-3 text-sm text-center text-win">{{ team.won }}</td>
                  <td class="px-4 py-3 text-sm text-center text-draw">{{ team.drawn }}</td>
                  <td class="px-4 py-3 text-sm text-center text-loss">{{ team.lost }}</td>
                  <td class="px-4 py-3 text-sm text-center text-muted">{{ team.goal_difference }}</td>
                  <td class="px-4 py-3 text-sm text-center font-bold text-text">{{ team.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!standings.length" class="p-8 text-center text-muted">
            No standings available
          </div>
        </div>

        <!-- Fixtures Tab -->
        <div v-if="activeTab === 'fixtures'" class="card">
          <div v-if="fixtures.length" class="divide-y divide-border">
            <div
              v-for="fixture in fixtures"
              :key="fixture.id"
              class="p-4 hover:bg-bg/50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-4 text-sm">
                    <span class="text-text font-medium">{{ fixture.home_team?.name }}</span>
                    <span class="text-muted">vs</span>
                    <span class="text-text font-medium">{{ fixture.away_team?.name }}</span>
                  </div>
                </div>
                <div class="text-right text-sm text-muted">
                  <div>{{ formatDate(fixture.kickoff) }}</div>
                  <div>{{ formatTime(fixture.kickoff) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-8 text-center text-muted">
            No upcoming fixtures
          </div>
        </div>

        <!-- Predictions for this league -->
        <div v-if="predictions.length" class="mt-8">
          <h2 class="font-display font-bold text-xl text-text mb-4">
            {{ t('league.predictions') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PredictionCard
              v-for="prediction in predictions"
              :key="prediction.id"
              :prediction="prediction"
            />
          </div>
        </div>
      </template>

      <!-- Not found -->
      <div v-else class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">League not found</p>
        <RouterLink to="/predictions">
          <AppButton>Back to Predictions</AppButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
