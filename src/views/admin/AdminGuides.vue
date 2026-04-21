<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import guidesApi from '@/api/guides'
import { useLocale } from '@/composables/useLocale'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { formatDate } = useLocale()

const loading = ref(true)
const guides = ref([])

const showModal = ref(false)
const editingGuide = ref(null)
const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  cover_image: ''
})
const saving = ref(false)
const saveError = ref(null)

const showDeleteModal = ref(false)
const deletingGuide = ref(null)
const deleting = ref(false)

onMounted(async () => {
  await fetchGuides()
})

async function fetchGuides() {
  loading.value = true
  try {
    const response = await guidesApi.getAll()
    guides.value = response.guides || []
  } catch (err) {
    console.error('Failed to fetch guides:', err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingGuide.value = null
  form.value = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    cover_image: ''
  }
  saveError.value = null
  showModal.value = true
}

function openEditModal(guide) {
  editingGuide.value = guide
  form.value = {
    title: guide.title,
    slug: guide.slug,
    excerpt: guide.excerpt || '',
    content: guide.content || '',
    category: guide.category || '',
    cover_image: guide.cover_image || ''
  }
  saveError.value = null
  showModal.value = true
}

function generateSlug() {
  form.value.slug = form.value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function saveGuide() {
  saving.value = true
  saveError.value = null

  try {
    if (editingGuide.value) {
      await guidesApi.update(editingGuide.value.id, form.value)
    } else {
      await guidesApi.create(form.value)
    }
    showModal.value = false
    await fetchGuides()
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Failed to save guide'
  } finally {
    saving.value = false
  }
}

function openDeleteModal(guide) {
  deletingGuide.value = guide
  showDeleteModal.value = true
}

async function deleteGuide() {
  if (!deletingGuide.value) return

  deleting.value = true
  try {
    await guidesApi.delete(deletingGuide.value.id)
    showDeleteModal.value = false
    guides.value = guides.value.filter(g => g.id !== deletingGuide.value.id)
  } catch (err) {
    console.error('Failed to delete guide:', err)
  } finally {
    deleting.value = false
  }
}

async function togglePublish(guide) {
  try {
    if (guide.published) {
      await guidesApi.unpublish(guide.id)
      guide.published = false
    } else {
      await guidesApi.publish(guide.id)
      guide.published = true
    }
  } catch (err) {
    console.error('Failed to toggle publish:', err)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display font-bold text-xl text-text">
        {{ t('admin.guides.title') }}
      </h2>
      <AppButton @click="openCreateModal">
        <PlusIcon class="w-4 h-4 mr-2" />
        {{ t('admin.guides.create') }}
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <AppSkeleton v-for="i in 3" :key="i" height="80px" rounded="lg" />
    </div>

    <!-- Guides list -->
    <div v-else-if="guides.length" class="space-y-4">
      <div
        v-for="guide in guides"
        :key="guide.id"
        class="card p-4 flex items-center gap-4"
      >
        <!-- Cover image -->
        <div class="w-20 h-14 rounded bg-surface overflow-hidden flex-shrink-0">
          <img
            v-if="guide.cover_image"
            :src="guide.cover_image"
            :alt="guide.title"
            class="w-full h-full object-cover"
          >
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-text font-medium truncate">{{ guide.title }}</h3>
          <div class="flex items-center gap-2 text-xs text-muted">
            <span v-if="guide.category" class="uppercase">{{ guide.category }}</span>
            <span v-if="guide.category">&bull;</span>
            <span>{{ formatDate(guide.created_at) }}</span>
          </div>
        </div>

        <!-- Status -->
        <AppBadge :variant="guide.published ? 'success' : 'muted'" size="sm">
          {{ guide.published ? 'Published' : 'Draft' }}
        </AppBadge>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :title="guide.published ? 'Unpublish' : 'Publish'"
            @click="togglePublish(guide)"
          >
            <EyeIcon class="w-4 h-4" />
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="openEditModal(guide)">
            <PencilIcon class="w-4 h-4" />
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="openDeleteModal(guide)">
            <TrashIcon class="w-4 h-4 text-loss" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card p-12 text-center">
      <p class="text-muted mb-4">No guides yet</p>
      <AppButton @click="openCreateModal">
        <PlusIcon class="w-4 h-4 mr-2" />
        Create First Guide
      </AppButton>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingGuide ? t('admin.guides.edit') : t('admin.guides.create')"
      size="lg"
    >
      <AppAlert v-if="saveError" variant="error" class="mb-4">
        {{ saveError }}
      </AppAlert>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Title</label>
          <input
            v-model="form.title"
            type="text"
            class="input-field"
            placeholder="Guide title"
            @blur="!editingGuide && generateSlug()"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Slug</label>
          <input
            v-model="form.slug"
            type="text"
            class="input-field"
            placeholder="guide-url-slug"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Category</label>
          <input
            v-model="form.category"
            type="text"
            class="input-field"
            placeholder="e.g., basics, strategy"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Cover Image URL</label>
          <input
            v-model="form.cover_image"
            type="url"
            class="input-field"
            placeholder="https://..."
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Excerpt</label>
          <textarea
            v-model="form.excerpt"
            rows="2"
            class="input-field resize-none"
            placeholder="Brief summary..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Content (HTML)</label>
          <textarea
            v-model="form.content"
            rows="10"
            class="input-field resize-none font-mono text-sm"
            placeholder="<p>Your guide content...</p>"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="showModal = false">
            {{ t('common.cancel') }}
          </AppButton>
          <AppButton :loading="saving" @click="saveGuide">
            {{ t('common.save') }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal v-model="showDeleteModal" title="Delete Guide">
      <p class="text-text">
        {{ t('admin.guides.confirmDelete') }}
      </p>
      <p v-if="deletingGuide" class="mt-2 font-medium text-text">
        "{{ deletingGuide.title }}"
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="showDeleteModal = false">
            {{ t('common.cancel') }}
          </AppButton>
          <AppButton variant="danger" :loading="deleting" @click="deleteGuide">
            {{ t('common.delete') }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
