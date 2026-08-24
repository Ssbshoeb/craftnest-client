<script setup>
import GalleryFormDialog from '@/components/gallery/GalleryFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: { title: 'Gallery' },
})

const items = ref([])
const loading = ref(false)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedItem = ref(null)
const formMode = ref('add')

const GROUP_LABELS = { factory: 'Factory', workshop: 'Workshop', delivered: 'Delivered Projects' }

const fetchItems = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/gallery_items', { query: { sortBy: 'sort_order', sortOrder: 'asc', itemsPerPage: 100 } }))

    if (!error.value && data.value) items.value = data.value.data || []
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  formMode.value = 'add'
  selectedItem.value = null
  isFormDialogOpen.value = true
}

const handleEdit = item => {
  formMode.value = 'edit'
  selectedItem.value = item
  isFormDialogOpen.value = true
}

const handleDelete = item => {
  selectedItem.value = item
  isDeleteDialogOpen.value = true
}

const confirmDelete = () => {
  const encryptedId = encryptIt(String(selectedItem.value.id))

  ApiService.delete(`/gallery_items/${encryptedId}`, () => {
    isDeleteDialogOpen.value = false
    fetchItems()
  })
}

onMounted(() => fetchItems())
</script>

<template>
  <div>
    <div class="mb-6 d-flex align-center justify-space-between">
      <div>
        <h2 class="text-h4 mb-1">Gallery / Our Work</h2>
        <p class="text-body-1 text-medium-emphasis mb-0">Factory, workshop and delivered project photos</p>
      </div>
      <VBtn v-if="can('GALLERY.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAdd">
        Add Photo
      </VBtn>
    </div>

    <VRow v-if="items.length">
      <VCol v-for="item in items" :key="item.id" cols="6" sm="4" md="3">
        <VCard>
          <VImg :src="item.image_url" height="120" cover />
          <VCardText class="pa-3">
            <p class="text-caption mb-1">{{ item.title || '—' }}</p>
            <VChip size="x-small" variant="tonal">{{ GROUP_LABELS[item.group] }}</VChip>
          </VCardText>
          <VCardActions class="pt-0">
            <VBtn size="small" variant="text" @click="handleEdit(item)">Edit</VBtn>
            <VBtn size="small" variant="text" color="error" @click="handleDelete(item)">Delete</VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        No photos yet.
      </VCardText>
    </VCard>

    <GalleryFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :item="selectedItem"
      @submit="fetchItems"
    />

    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Confirm Delete</VCardTitle>
        <VCardText>Delete this photo?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDeleteDialogOpen = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
