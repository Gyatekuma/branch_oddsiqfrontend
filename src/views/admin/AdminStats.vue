<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { useLocale } from '@/composables/useLocale'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const { formatDate } = useLocale()

const loading = ref(true)
const error = ref('')
const stats = ref(null)

onMounted(async () => {
  await fetchStats()
})

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/admin/stats')
    stats.value = response.data.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

function planLabel(plan) {
  return plan === 'annual' ? 'Annual' : 'Monthly'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-display font-bold text-xl text-text">Stats & Revenue</h2>
        <p class="text-sm text-muted mt-0.5">Platform overview</p>
      </div>
      <button
        class="text-sm text-accent hover:underline"
        @click="fetchStats"
      >
        Refresh
      </button>
    </div>

    <div v-if="error" class="card p-4 text-danger text-sm">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <AppSkeleton v-for="i in 8" :key="i" height="80px" rounded="lg" />
    </div>

    <template v-else-if="stats">
      <!-- User Stats -->
      <div>
        <h3 class="text-sm font-display uppercase tracking-wider text-muted mb-3">Users</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.users.total }}</div>
            <div class="text-xs text-muted mt-1">Total</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-gold">{{ stats.users.premium }}</div>
            <div class="text-xs text-muted mt-1">Premium</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.users.free }}</div>
            <div class="text-xs text-muted mt-1">Free</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-accent">{{ stats.users.admin }}</div>
            <div class="text-xs text-muted mt-1">Admin</div>
          </div>
        </div>
      </div>

      <!-- Signups -->
      <div>
        <h3 class="text-sm font-display uppercase tracking-wider text-muted mb-3">New Signups</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.users.new_last_7_days }}</div>
            <div class="text-xs text-muted mt-1">Last 7 days</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.users.new_last_30_days }}</div>
            <div class="text-xs text-muted mt-1">Last 30 days</div>
          </div>
        </div>
      </div>

      <!-- Premium Status -->
      <div>
        <h3 class="text-sm font-display uppercase tracking-wider text-muted mb-3">Premium Status</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-win">{{ stats.premium.active }}</div>
            <div class="text-xs text-muted mt-1">Active</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-loss">{{ stats.premium.expired }}</div>
            <div class="text-xs text-muted mt-1">Expired</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-gold">{{ stats.premium.no_expiry }}</div>
            <div class="text-xs text-muted mt-1">Admin-granted</div>
          </div>
        </div>
      </div>

      <!-- Revenue -->
      <div>
        <h3 class="text-sm font-display uppercase tracking-wider text-muted mb-3">Revenue (GHS)</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-win">{{ stats.revenue.total_ghs.toFixed(2) }}</div>
            <div class="text-xs text-muted mt-1">All time</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.revenue.last_30_days_ghs.toFixed(2) }}</div>
            <div class="text-xs text-muted mt-1">Last 30 days</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-text">{{ stats.revenue.last_7_days_ghs.toFixed(2) }}</div>
            <div class="text-xs text-muted mt-1">Last 7 days</div>
          </div>
        </div>
      </div>

      <!-- Recent Subscriptions -->
      <div>
        <h3 class="text-sm font-display uppercase tracking-wider text-muted mb-3">Recent Subscriptions</h3>
        <div class="card overflow-hidden">
          <div v-if="stats.recent_subscriptions.length === 0" class="p-8 text-center text-muted text-sm">
            No subscriptions yet
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="border-b border-border bg-bg/50">
                <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">User</th>
                <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Plan</th>
                <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Amount</th>
                <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Status</th>
                <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="sub in stats.recent_subscriptions"
                :key="sub.id"
                class="hover:bg-bg/50 transition-colors"
              >
                <td class="px-4 py-3 text-sm text-muted">#{{ sub.user_id }}</td>
                <td class="px-4 py-3 text-center">
                  <AppBadge variant="gold" size="sm">{{ planLabel(sub.plan) }}</AppBadge>
                </td>
                <td class="px-4 py-3 text-center text-sm text-text">
                  {{ sub.amount_ghs != null ? `GHS ${sub.amount_ghs.toFixed(2)}` : '—' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <AppBadge :variant="sub.is_active ? 'win' : 'danger'" size="sm">
                    {{ sub.is_active ? 'Active' : 'Expired' }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-center text-xs text-muted">
                  {{ formatDate(sub.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
