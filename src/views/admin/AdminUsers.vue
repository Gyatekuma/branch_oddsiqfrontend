<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import { useLocale } from '@/composables/useLocale'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { formatDate } = useLocale()

const loading = ref(true)
const users = ref([])
const searchQuery = ref('')
const pagination = ref({ page: 1, total: 0, totalPages: 0 })
const updatingId = ref(null)
const error = ref('')

// Premium grant modal state
const grantModal = ref({ open: false, user: null, expiresAt: '' })

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    (u.full_name || '').toLowerCase().includes(query) ||
    (u.email || '').toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/admin/users', {
      params: { page, per_page: 20 }
    })
    users.value = response.data.data.users
    pagination.value = {
      page: response.data.data.page,
      total: response.data.data.total,
      totalPages: response.data.data.total_pages
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function setRole(userId, role, expiresAt = null) {
  updatingId.value = userId
  try {
    const payload = { role }
    if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString()
    const response = await api.put(`/api/admin/users/${userId}/role`, payload)
    const updated = response.data.data
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx !== -1) users.value[idx] = updated
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to update user')
  } finally {
    updatingId.value = null
  }
}

function openGrantModal(user) {
  const defaultExpiry = new Date()
  defaultExpiry.setMonth(defaultExpiry.getMonth() + 1)
  grantModal.value = {
    open: true,
    user,
    expiresAt: defaultExpiry.toISOString().slice(0, 10)
  }
}

async function confirmGrant() {
  const { user, expiresAt } = grantModal.value
  grantModal.value.open = false
  await setRole(user.id, 'premium', expiresAt)
}

function getSubStatus(user) {
  if (user.role === 'admin') return { label: 'Admin', variant: 'accent' }
  if (!user.subscription_expires_at) {
    return user.role === 'premium'
      ? { label: 'Premium ∞', variant: 'gold' }
      : { label: 'Free', variant: 'muted' }
  }
  const expires = new Date(user.subscription_expires_at)
  if (expires > new Date()) return { label: 'Premium', variant: 'gold' }
  return { label: 'Expired', variant: 'danger' }
}

function displayName(user) {
  return user.full_name || user.email || `User #${user.id}`
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-display font-bold text-xl text-text">Users</h2>
        <p v-if="!loading" class="text-sm text-muted mt-0.5">
          {{ pagination.total }} total
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or email…"
        class="input-field pl-10"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="card p-4 text-danger text-sm mb-4">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AppSkeleton v-for="i in 6" :key="i" height="56px" rounded="lg" />
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px]">
          <thead>
            <tr class="border-b border-border bg-bg/50">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">User</th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Role</th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Subscription</th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Expires</th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Joined</th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-bg/50 transition-colors"
              :class="{ 'opacity-60': updatingId === user.id }"
            >
              <td class="px-4 py-3">
                <div class="text-sm text-text font-medium">{{ displayName(user) }}</div>
                <div class="text-xs text-muted">{{ user.email }}</div>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge :variant="user.role === 'admin' ? 'accent' : user.role === 'premium' ? 'gold' : 'muted'" size="sm">
                  {{ user.role }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge :variant="getSubStatus(user).variant" size="sm">
                  {{ getSubStatus(user).label }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-center text-xs text-muted">
                <span v-if="user.subscription_expires_at">
                  {{ formatDate(user.subscription_expires_at) }}
                </span>
                <span v-else class="text-border">—</span>
              </td>
              <td class="px-4 py-3 text-center text-sm text-muted">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                  <!-- Grant premium -->
                  <AppButton
                    v-if="user.role !== 'premium' && user.role !== 'admin'"
                    size="sm"
                    variant="ghost"
                    class="text-gold border-gold/30 hover:bg-gold/10 !text-xs !px-2 !py-1"
                    :disabled="updatingId === user.id"
                    @click="openGrantModal(user)"
                  >
                    Grant Premium
                  </AppButton>
                  <!-- Revoke premium -->
                  <AppButton
                    v-if="user.role === 'premium'"
                    size="sm"
                    variant="ghost"
                    class="text-loss border-loss/30 hover:bg-loss/10 !text-xs !px-2 !py-1"
                    :disabled="updatingId === user.id"
                    @click="setRole(user.id, 'free')"
                  >
                    Revoke
                  </AppButton>
                  <!-- Role select (free ↔ admin only) -->
                  <select
                    v-if="user.role !== 'premium'"
                    :value="user.role"
                    class="text-xs bg-bg border border-border rounded px-2 py-1 text-text"
                    :disabled="updatingId === user.id"
                    @change="setRole(user.id, $event.target.value)"
                  >
                    <option value="free">Free</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="!filteredUsers.length" class="p-10 text-center text-muted">
        <p class="text-lg">No users found</p>
        <p v-if="searchQuery" class="text-sm mt-1">Try a different search term</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-3 p-4 border-t border-border">
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="fetchUsers(pagination.page - 1)"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </AppButton>
        <span class="text-sm text-muted">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="pagination.page >= pagination.totalPages"
          @click="fetchUsers(pagination.page + 1)"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </AppButton>
      </div>
    </div>

    <!-- Grant Premium Modal -->
    <Teleport to="body">
      <div
        v-if="grantModal.open"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="grantModal.open = false"
      >
        <div class="card p-6 w-full max-w-sm space-y-4">
          <h3 class="font-display font-bold text-lg text-text">Grant Premium</h3>
          <p class="text-sm text-muted">
            Granting premium to <span class="text-text font-medium">{{ displayName(grantModal.user) }}</span>
          </p>
          <div>
            <label class="text-xs text-muted font-medium mb-1 block">Expires on</label>
            <input
              v-model="grantModal.expiresAt"
              type="date"
              class="input-field w-full"
            >
          </div>
          <div class="flex gap-3 pt-2">
            <AppButton variant="ghost" class="flex-1" @click="grantModal.open = false">Cancel</AppButton>
            <AppButton variant="primary" class="flex-1" @click="confirmGrant">Confirm</AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
