<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import predictionsApi from '@/api/predictions'
import { useLocale } from '@/composables/useLocale'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { PencilIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { formatDate, formatTime } = useLocale()

const loading = ref(true)
const predictions = ref([])
const pagination = ref({ page: 1, total: 0, totalPages: 0 })

const showNoteModal = ref(false)
const selectedPrediction = ref(null)
const expertNote = ref('')
const saving = ref(false)
const saveError = ref(null)

onMounted(async () => {
  await fetchPredictions()
})

async function fetchPredictions(page = 1) {
  loading.value = true
  try {
    const response = await predictionsApi.getAll({ page, per_page: 20 })
    predictions.value = response.predictions
    pagination.value = {
      page: response.page,
      total: response.total,
      totalPages: response.total_pages
    }
  } catch (err) {
    console.error('Failed to fetch predictions:', err)
  } finally {
    loading.value = false
  }
}

function openNoteModal(prediction) {
  selectedPrediction.value = prediction
  expertNote.value = prediction.expert_note || ''
  showNoteModal.value = true
  saveError.value = null
}

async function saveExpertNote() {
  if (!selectedPrediction.value) return

  saving.value = true
  saveError.value = null

  try {
    await predictionsApi.addExpertNote(selectedPrediction.value.id, expertNote.value)

    // Update local state
    const pred = predictions.value.find(p => p.id === selectedPrediction.value.id)
    if (pred) {
      pred.expert_note = expertNote.value
      pred.has_expert_note = !!expertNote.value
    }

    showNoteModal.value = false
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Failed to save note'
  } finally {
    saving.value = false
  }
}

function getOutcomeVariant(outcome) {
  if (outcome === 'home') return 'success'
  if (outcome === 'draw') return 'warning'
  if (outcome === 'away') return 'danger'
  return 'default'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display font-bold text-xl text-text">
        {{ t('admin.predictions.title') }}
      </h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <AppSkeleton v-for="i in 5" :key="i" height="80px" rounded="lg" />
    </div>

    <!-- Predictions table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="border-b border-border bg-bg/50">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Match
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Prediction
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Confidence
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Expert Note
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="prediction in predictions"
              :key="prediction.id"
              class="hover:bg-bg/50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="text-sm text-text font-medium">
                  {{ prediction.fixture?.home_team?.name || prediction.home_team }}
                  vs
                  {{ prediction.fixture?.away_team?.name || prediction.away_team }}
                </div>
                <div class="text-xs text-muted">
                  {{ formatDate(prediction.fixture?.kickoff || prediction.kickoff) }}
                  {{ formatTime(prediction.fixture?.kickoff || prediction.kickoff) }}
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge :variant="getOutcomeVariant(prediction.predicted_outcome)" size="sm">
                  {{ prediction.predicted_outcome }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="font-display font-bold text-text">
                  {{ prediction.confidence }}%
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge v-if="prediction.has_expert_note || prediction.expert_note" variant="gold" size="sm">
                  <SparklesIcon class="w-3 h-3 mr-1" />
                  Has Note
                </AppBadge>
                <span v-else class="text-muted text-sm">{{ t('admin.predictions.noNote') }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <AppButton variant="ghost" size="sm" @click="openNoteModal(prediction)">
                  <PencilIcon class="w-4 h-4" />
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2 p-4 border-t border-border">
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="fetchPredictions(pagination.page - 1)"
        >
          Previous
        </AppButton>
        <span class="text-sm text-muted">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="pagination.page >= pagination.totalPages"
          @click="fetchPredictions(pagination.page + 1)"
        >
          Next
        </AppButton>
      </div>
    </div>

    <!-- Expert Note Modal -->
    <AppModal v-model="showNoteModal" :title="selectedPrediction ? t('admin.predictions.editNote') : t('admin.predictions.addNote')">
      <div v-if="selectedPrediction">
        <div class="mb-4 p-3 bg-bg rounded-lg">
          <p class="text-sm text-text font-medium">
            {{ selectedPrediction.fixture?.home_team?.name || selectedPrediction.home_team }}
            vs
            {{ selectedPrediction.fixture?.away_team?.name || selectedPrediction.away_team }}
          </p>
        </div>

        <AppAlert v-if="saveError" variant="error" class="mb-4">
          {{ saveError }}
        </AppAlert>

        <div class="mb-4">
          <label class="block text-sm font-medium text-text mb-2">Expert Analysis</label>
          <textarea
            v-model="expertNote"
            rows="5"
            class="input-field resize-none"
            placeholder="Add your expert analysis here..."
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="showNoteModal = false">
            {{ t('common.cancel') }}
          </AppButton>
          <AppButton :loading="saving" @click="saveExpertNote">
            {{ t('common.save') }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
