<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
  ChevronDownIcon,
  BoltIcon,
  FireIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/solid'
import { XMarkIcon } from '@heroicons/vue/24/outline'

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

const plans = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 50,
    period: '/ month',
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: 500,
    period: '/ year',
    badge: 'Best Value',
    saving: 'Save 17%',
  },
]

const highlights = [
  {
    icon: BoltIcon,
    colour: 'text-gold',
    bg: 'bg-gold/10',
    title: 'Predictions that mean something',
    desc: 'Every pick comes with a confidence rating built from real data — form, history, and market signals combined into one clean number.',
  },
  {
    icon: FireIcon,
    colour: 'text-win',
    bg: 'bg-win/10',
    title: 'Find the edge before kickoff',
    desc: 'When our model disagrees with the bookmaker by a meaningful margin, we flag it. That gap is where the opportunity lives.',
  },
  {
    icon: ChartBarIcon,
    colour: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Beyond win/draw/lose',
    desc: 'Over/Under, Both Teams to Score, Double Chance — premium unlocks the full market breakdown, not just the headline result.',
  },
  {
    icon: ShieldCheckIcon,
    colour: 'text-draw',
    bg: 'bg-draw/10',
    title: 'Transparency you can trust',
    desc: "We show you our historical accuracy, broken down by confidence level. You always know how our calls have held up in practice.",
  },
]

const comparisonRows = [
  { label: 'Daily predictions',          free: '3',      premium: 'Unlimited' },
  { label: 'Confidence score',           free: false,    premium: true },
  { label: 'Expected goals (xG)',        free: false,    premium: true },
  { label: 'Value bet detection + edge', free: false,    premium: true },
  { label: 'Over/Under predictions',     free: false,    premium: true },
  { label: 'BTTS predictions',           free: false,    premium: true },
  { label: 'Double Chance predictions',  free: false,    premium: true },
  { label: 'Form guide (last 5)',        free: true,     premium: true },
  { label: 'Head-to-head history',       free: true,     premium: true },
  { label: 'Market odds comparison',     free: false,    premium: true },
  { label: 'Expert analysis notes',      free: false,    premium: true },
  { label: 'Model calibration data',     free: false,    premium: true },
  { label: 'Daily email digest',         free: false,    premium: true },
  { label: 'Ad-free experience',         free: false,    premium: true },
]

const faqs = [
  {
    q: 'How does the AI work?',
    a: 'Our prediction engine is built on advanced statistical modelling trained on real match data across leagues and seasons. It analyses team form, historical matchups, and live market signals to generate probability estimates. The specifics of the model are proprietary — what matters is that it works, and we show you the accuracy record to prove it.',
  },
  {
    q: 'What is a value bet?',
    a: 'A value bet is one where our model estimates the true probability higher than the bookmaker\'s implied probability by more than 4%. For example, if we predict a 72% chance of a home win and the best odds imply only 56%, that\'s a 16-point edge. Over many bets like this, you come out ahead.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel any time from your dashboard. Your access remains active until the end of the billing period — no partial refunds, no surprises.',
  },
  {
    q: 'Is premium per-sport or all sports?',
    a: 'Premium covers all sports and all leagues on the platform. One subscription unlocks everything.',
  },
]

onMounted(async () => {
  const reference = route.query.reference
  if (reference) {
    verifying.value = true
    try {
      const result = await subscriptionStore.verifyPayment(reference)
      if (result.status === 'success') showSuccessModal.value = true
    } catch {}
    finally { verifying.value = false }
  }
})

async function handleSubscribe() {
  if (!authStore.isAuthenticated) {
    window.location.href = `/register?redirect=/premium&plan=${selectedPlan.value}`
    return
  }
  loading.value = true
  try {
    await subscriptionStore.initiatePayment(selectedPlan.value)
    subscriptionStore.redirectToPaystack()
  } catch {}
  finally { loading.value = false }
}

function toggleFaq(i) {
  expandedFaq.value = expandedFaq.value === i ? null : i
}
</script>

<template>
  <div class="py-8 md:py-16">

    <!-- Payment verifying overlay -->
    <div v-if="verifying" class="fixed inset-0 z-50 bg-bg/90 backdrop-blur-sm flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
        <p class="text-text font-semibold">Verifying payment…</p>
      </div>
    </div>

    <div class="container-app max-w-5xl">

      <!-- ── Hero ──────────────────────────────────────────── -->
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-sm font-semibold mb-6">
          <SparklesIcon class="w-4 h-4" />
          edi Premium
        </div>
        <h1 class="font-display font-black text-4xl md:text-5xl text-text mb-4 leading-tight">
          Every edge.<br>
          <span class="text-gold">Every prediction.</span>
        </h1>
        <p class="text-muted text-lg max-w-xl mx-auto">
          Unlimited AI predictions, value bet detection, and full market coverage — powered by the same
          Poisson model used by professional analysts.
        </p>
      </div>

      <!-- ── Already premium ────────────────────────────────── -->
      <div v-if="isPremium" class="max-w-lg mx-auto mb-12">
        <AppAlert variant="success">
          <strong>You're a Premium member.</strong>
          <span v-if="daysRemaining > 0"> Your subscription runs for another {{ daysRemaining }} days.</span>
        </AppAlert>
      </div>

      <!-- ── Pricing cards ───────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
        <div
          v-for="plan in plans" :key="plan.id"
          :class="[
            'relative rounded-2xl border-2 cursor-pointer transition-all p-6',
            selectedPlan === plan.id
              ? 'border-gold bg-gold/5 shadow-lg shadow-gold/10'
              : 'border-border bg-surface hover:border-border/60'
          ]"
          @click="selectedPlan = plan.id"
        >
          <!-- Best value badge -->
          <div v-if="plan.badge"
            class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-gold text-bg text-[11px] font-bold rounded-full">
            {{ plan.badge }} — {{ plan.saving }}
          </div>

          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wider font-semibold mb-1">{{ plan.label }}</p>
              <div class="flex items-baseline gap-1">
                <span class="font-display font-black text-3xl text-text">{{ formatCurrency(plan.price) }}</span>
                <span class="text-sm text-muted">{{ plan.period }}</span>
              </div>
            </div>
            <div :class="[
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1',
              selectedPlan === plan.id ? 'border-gold bg-gold' : 'border-muted'
            ]">
              <CheckIcon v-if="selectedPlan === plan.id" class="w-3.5 h-3.5 text-bg" />
            </div>
          </div>
          <p class="text-xs text-muted">Full access to all predictions and markets</p>
        </div>
      </div>

      <!-- Subscribe CTA -->
      <div class="text-center mb-20">
        <AppButton
          v-if="!isPremium"
          variant="gold"
          size="lg"
          :loading="loading"
          class="px-10"
          @click="handleSubscribe"
        >
          <SparklesIcon class="w-5 h-5 mr-2" />
          Unlock Premium
        </AppButton>
        <p class="text-xs text-muted mt-3">Cancel any time · No hidden fees</p>
      </div>

      <!-- ── What you get ─────────────────────────────────────── -->
      <div class="mb-20">
        <h2 class="font-display font-bold text-2xl text-text text-center mb-10">Built differently</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div v-for="h in highlights" :key="h.title"
            class="card p-5 flex gap-4">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', h.bg]">
              <component :is="h.icon" :class="['w-5 h-5', h.colour]" />
            </div>
            <div>
              <p class="font-display font-bold text-text mb-1">{{ h.title }}</p>
              <p class="text-sm text-muted leading-relaxed">{{ h.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Comparison table ─────────────────────────────────── -->
      <div class="mb-20">
        <h2 class="font-display font-bold text-2xl text-text text-center mb-8">Free vs Premium</h2>
        <div class="card overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-surface/50">
                <th class="text-left px-5 py-3.5 text-xs font-display uppercase tracking-wider text-muted w-full">Feature</th>
                <th class="text-center px-5 py-3.5 text-xs font-display uppercase tracking-wider text-muted w-24 shrink-0">Free</th>
                <th class="text-center px-5 py-3.5 text-xs font-display uppercase tracking-wider text-gold w-28 shrink-0">Premium</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="row in comparisonRows" :key="row.label" class="hover:bg-surface/30 transition-colors">
                <td class="px-5 py-3.5 text-sm text-text">{{ row.label }}</td>
                <td class="px-5 py-3.5 text-center">
                  <template v-if="row.free === true">
                    <CheckIcon class="w-4 h-4 text-win mx-auto" />
                  </template>
                  <template v-else-if="row.free === false">
                    <XMarkIcon class="w-4 h-4 text-muted/40 mx-auto" />
                  </template>
                  <template v-else>
                    <span class="text-xs text-muted font-medium">{{ row.free }}</span>
                  </template>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <template v-if="row.premium === true">
                    <CheckIcon class="w-4 h-4 text-gold mx-auto" />
                  </template>
                  <template v-else>
                    <span class="text-xs text-gold font-semibold">{{ row.premium }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Second CTA ──────────────────────────────────────── -->
      <div v-if="!isPremium" class="rounded-2xl border border-gold/20 bg-gold/5 p-8 text-center mb-20">
        <p class="font-display font-bold text-xl text-text mb-2">Ready to beat the bookmaker?</p>
        <p class="text-muted text-sm mb-6 max-w-md mx-auto">
          Join edi Premium and get the full model output — every pick, every market, every edge.
        </p>
        <AppButton variant="gold" size="lg" :loading="loading" class="px-10" @click="handleSubscribe">
          <SparklesIcon class="w-5 h-5 mr-2" />
          Get Premium
        </AppButton>
      </div>

      <!-- ── FAQ ────────────────────────────────────────────────── -->
      <div class="max-w-2xl mx-auto">
        <h2 class="font-display font-bold text-2xl text-text text-center mb-8">Common questions</h2>
        <div class="space-y-3">
          <div v-for="(faq, i) in faqs" :key="i" class="card overflow-hidden">
            <button class="w-full flex items-center justify-between px-5 py-4 text-left gap-4" @click="toggleFaq(i)">
              <span class="font-semibold text-text text-sm">{{ faq.q }}</span>
              <ChevronDownIcon :class="['w-4 h-4 text-muted shrink-0 transition-transform', expandedFaq === i ? 'rotate-180' : '']" />
            </button>
            <div v-show="expandedFaq === i" class="px-5 pb-4 text-sm text-muted leading-relaxed border-t border-border pt-3">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Success modal ───────────────────────────────────── -->
    <AppModal v-model="showSuccessModal" title="Welcome to Premium!">
      <div class="text-center py-4">
        <div class="w-16 h-16 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto mb-4">
          <SparklesIcon class="w-8 h-8 text-gold" />
        </div>
        <h3 class="font-display font-bold text-xl text-text mb-2">You're in.</h3>
        <p class="text-muted mb-6">
          Full access unlocked — every prediction, every market, every edge.
        </p>
        <AppButton variant="gold" @click="showSuccessModal = false; $router.push('/predictions')">
          View Predictions
        </AppButton>
      </div>
    </AppModal>

  </div>
</template>
