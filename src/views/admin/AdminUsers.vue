<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import { useLocale } from '@/composables/useLocale'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { formatDate } = useLocale()

const loading = ref(true)
const users = ref([])
const searchQuery = ref('')
const pagination = ref({ page: 1, total: 0, totalPages: 0 })

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user =>
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers(page = 1) {
  loading.value = true
  try {
    const response = await api.get('/api/admin/users', {
      params: { page, per_page: 20 }
    })
    users.value = response.data.users
    pagination.value = {
      page: response.data.page,
      total: response.data.total,
      totalPages: response.data.total_pages
    }
  } catch (err) {
    console.error('Failed to fetch users:', err)
  } finally {
    loading.value = false
  }
}

async function updateRole(userId, role) {
  try {
    await api.put(`/api/admin/users/${userId}`, { role })
    const user = users.value.find(u => u.id === userId)
    if (user) user.role = role
  } catch (err) {
    console.error('Failed to update role:', err)
  }
}

function getSubscriptionStatus(user) {
  if (!user.subscription_expires_at) return { label: 'Free', variant: 'muted' }
  const expires = new Date(user.subscription_expires_at)
  if (expires > new Date()) return { label: 'Premium', variant: 'gold' }
  return { label: 'Expired', variant: 'danger' }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display font-bold text-xl text-text">
        {{ t('admin.users.title') }}
      </h2>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('admin.users.search')"
        class="input-field pl-10"
      >
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <AppSkeleton v-for="i in 5" :key="i" height="60px" rounded="lg" />
    </div>

    <!-- Users table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[600px]">
          <thead>
            <tr class="border-b border-border bg-bg/50">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                User
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                {{ t('admin.users.role') }}
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                {{ t('admin.users.subscription') }}
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Joined
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                {{ t('admin.users.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-bg/50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="text-sm text-text font-medium">{{ user.name }}</div>
                <div class="text-xs text-muted">{{ user.email }}</div>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge
                  :variant="user.role === 'admin' ? 'accent' : 'muted'"
                  size="sm"
                >
                  {{ user.role }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge :variant="getSubscriptionStatus(user).variant" size="sm">
                  {{ getSubscriptionStatus(user).label }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-center text-sm text-muted">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-4 py-3 text-center">
                <select
                  :value="user.role"
                  class="text-sm bg-bg border border-border rounded px-2 py-1 text-text"
                  @change="updateRole(user.id, $event.target.value)"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="!filteredUsers.length" class="p-8 text-center text-muted">
        No users found
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2 p-4 border-t border-border">
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="fetchUsers(pagination.page - 1)"
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
          @click="fetchUsers(pagination.page + 1)"
        >
          Next
        </AppButton>
      </div>
    </div>
  </div>
</template>
