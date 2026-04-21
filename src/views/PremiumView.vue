<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '@/stores/subscription'
import { useAuthStore } from '@/stores/auth'
import { usePremium } from '@/composables/usePremium'
import { useLocale } from '@/composables/useLocale'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppModal from '@/components/ui/AppModal.vue'
import {
  CheckIcon,
  SparklesIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const subscriptionStore = useSubscriptionStore()
const authStore = useAuthStore()
const { isPremium, daysRemaining } = usePremium()
const { formatCurrency } = useLocale()

const selectedPlan = ref('monthly')
const loading = ref(false)
const verifying = ref(false)
const showSuccessModal = ref(false)
const expandedFaq = ref(null)

const features = [
  { key: 'allPredictions', included: { free: false, premium: true } },
  { key: 'expertAnalysis', included: { free: false, premium: true } },
  { key: 'valueBets', included: { free: false, premium: true } },
  { key: 'noAds', included: { free: false, premium: true } },
  { key: 'emailDigest', included: { free: false, premium: true } }
]

const faqItems = [
  { q: 'premium.faq.q1', a: 'premium.faq.a1' },
  { q: 'premium.faq.q2', a: 'premium.faq.a2' },
  { q: 'premium.faq.q3', a: 'premium.faq.a3' }
]

const plans = computed(() => [
  {
    id: 'monthly',
    name: t('premium.plans.monthly'),
    price: 50,
    period: t('premium.perMonth'),
    popular: false
  },
  {
    id: 'annual',
    name: t('premium.plans.annual'),
    price: 500,
    period: t('premium.perYear'),
    popular: true,
    savings: subscriptionStore.annualSavings
  }
])

onMounted(async () => {
  // Check for payment verification
  const reference = route.query.reference
  if (reference) {
    verifying.value = true
    try {
      const result = await subscriptionStore.verifyPayment(reference)
      if (result.status === 'success') {
        showSuccessModal.value = true
      }
    } catch (err) {
      console.error('Payment verification failed:', err)
    } finally {
      verifying.value = false
    }
  }
})

async function handleSubscribe() {
  if (!authStore.isAuthenticated) {
    // Redirect to register
    window.location.href = `/register?redirect=/premium&plan=${selectedPlan.value}`
    return
  }

  loading.value = true
  try {
    await subscriptionStore.initiatePayment(selectedPlan.value)
    subscriptionStore.redirectToPaystack()
  } catch (err) {
    console.error('Payment initiation failed:', err)
  } finally {
    loading.value = false
  }
}

function toggleFaq(index) {
  expandedFaq.value = expandedFaq.value === index ? null : index
}
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Verifying payment overlay -->
      <div v-if="verifying" class="fixed inset-0 z-50 bg-bg/90 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-text">Verifying payment...</p>
        </div>
      </div>

      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 text-gold rounded-full mb-4">
          <SparklesIcon class="w-5 h-5" />
          <span class="font-semibold">Premium</span>
        </div>
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-4">
          {{ t('premium.title') }}
        </h1>
        <p class="text-lg text-muted max-w-2xl mx-auto">
          {{ t('premium.subtitle') }}
        </p>
      </div>

      <!-- Already premium -->
      <div v-if="isPremium" class="max-w-md mx-auto mb-12">
        <AppAlert variant="success">
          <strong>You're a Premium member!</strong>
          <span v-if="daysRemaining > 0"> Your subscription expires in {{ daysRemaining }} days.</span>
        </AppAlert>
      </div>

      <!-- Pricing cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
        <div
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'card relative cursor-pointer transition-all',
            selectedPlan === plan.id
              ? 'border-2 border-accent shadow-lg shadow-accent/10'
              : 'hover:border-border/80'
          ]"
          @click="selectedPlan = plan.id"
        >
          <!-- Popular badge -->
          <div
            v-if="plan.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-bg text-xs font-bold rounded-full"
          >
            {{ t('premium.plans.save', { percent: plan.savings }) }}
          </div>

          <div class="p-6">
            <!-- Plan name -->
            <h3 class="font-display font-bold text-xl text-text mb-2">
              {{ plan.name }}
            </h3>

            <!-- Price -->
            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-4xl font-display font-bold text-text">
                {{ formatCurrency(plan.price) }}
              </span>
              <span class="text-muted">{{ plan.period }}</span>
            </div>

            <!-- Radio indicator -->
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedPlan === plan.id
                    ? 'border-accent bg-accent'
                    : 'border-muted'
                ]"
              >
                <CheckIcon v-if="selectedPlan === plan.id" class="w-3 h-3 text-bg" />
              </div>
              <span class="text-sm text-muted">Select this plan</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscribe button -->
      <div class="text-center mb-16">
        <AppButton
          v-if="!isPremium"
          variant="gold"
          size="lg"
          :loading="loading"
          @click="handleSubscribe"
        >
          <SparklesIcon class="w-5 h-5 mr-2" />
          {{ t('premium.subscribe') }}
        </AppButton>
      </div>

      <!-- Features comparison -->
      <div class="max-w-2xl mx-auto mb-16">
        <h2 class="font-display font-bold text-2xl text-text text-center mb-8">
          {{ t('premium.features.title') }}
        </h2>

        <div class="card overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left px-6 py-4 text-sm font-display uppercase tracking-wider text-muted">
                  Feature
                </th>
                <th class="text-center px-6 py-4 text-sm font-display uppercase tracking-wider text-muted">
                  Free
                </th>
                <th class="text-center px-6 py-4 text-sm font-display uppercase tracking-wider text-gold">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="feature in features" :key="feature.key">
                <td class="px-6 py-4 text-sm text-text">
                  {{ t(`premium.features.${feature.key}`) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <CheckIcon v-if="feature.included.free" class="w-5 h-5 text-win mx-auto" />
                  <span v-else class="text-muted">&mdash;</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <CheckIcon v-if="feature.included.premium" class="w-5 h-5 text-win mx-auto" />
                  <span v-else class="text-muted">&mdash;</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FAQ -->
      <div class="max-w-2xl mx-auto">
        <h2 class="font-display font-bold text-2xl text-text text-center mb-8">
          {{ t('premium.faq.title') }}
        </h2>

        <div class="space-y-4">
          <div
            v-for="(faq, index) in faqItems"
            :key="index"
            class="card overflow-hidden"
          >
            <button
              class="w-full flex items-center justify-between p-4 text-left"
              @click="toggleFaq(index)"
            >
              <span class="font-medium text-text">{{ t(faq.q) }}</span>
              <ChevronDownIcon
                :class="[
                  'w-5 h-5 text-muted transition-transform',
                  expandedFaq === index ? 'rotate-180' : ''
                ]"
              />
            </button>
            <div
              v-show="expandedFaq === index"
              class="px-4 pb-4 text-sm text-muted"
            >
              {{ t(faq.a) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Success Modal -->
      <AppModal v-model="showSuccessModal" title="Welcome to Premium!">
        <div class="text-center py-4">
          <div class="w-16 h-16 rounded-full bg-win/20 flex items-center justify-center mx-auto mb-4">
            <CheckIcon class="w-8 h-8 text-win" />
          </div>
          <h3 class="text-xl font-bold text-text mb-2">Payment Successful!</h3>
          <p class="text-muted mb-6">
            You now have full access to all predictions and expert analysis.
          </p>
          <AppButton @click="showSuccessModal = false; $router.push('/predictions')">
            View Predictions
          </AppButton>
        </div>
      </AppModal>
    </div>
  </div>
</template>
