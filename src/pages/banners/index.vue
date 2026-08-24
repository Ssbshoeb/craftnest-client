<script setup>
import BannerFormDialog from '@/components/banners/BannerFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: { title: 'Banners & Offers' },
})

const banners = ref([])
const loading = ref(false)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedBanner = ref(null)
const formMode = ref('add')

const fetchBanners = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/banners', { query: { sortBy: 'sort_order', sortOrder: 'asc', itemsPerPage: 50 } }))

    if (!error.value && data.value) banners.value = data.value.data || []
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  formMode.value = 'add'
  selectedBanner.value = null
  isFormDialogOpen.value = true
}

const handleEdit = banner => {
  formMode.value = 'edit'
  selectedBanner.value = banner
  isFormDialogOpen.value = true
}

const handleDelete = banner => {
  selectedBanner.value = banner
  isDeleteDialogOpen.value = true
}

const confirmDelete = () => {
  const encryptedId = encryptIt(String(selectedBanner.value.id))

  ApiService.delete(`/banners/${encryptedId}`, () => {
    isDeleteDialogOpen.value = false
    fetchBanners()
  })
}

onMounted(() => fetchBanners())
</script>

<template>
  <div>
    <div class="mb-6 d-flex align-center justify-space-between">
      <div>
        <h2 class="text-h4 mb-1">Banners &amp; Offers</h2>
        <p class="text-body-1 text-medium-emphasis mb-0">Home page slider and offer strip</p>
      </div>
      <VBtn v-if="can('BANNERS.CREATE')" color="primary" prepend-icon="tabler-plus" @click="handleAdd">
        Add Banner
      </VBtn>
    </div>

    <VRow v-if="banners.length">
      <VCol v-for="banner in banners" :key="banner.id" cols="12" sm="6" md="4">
        <VCard>
          <VImg :src="banner.image_url || `/storage/${banner.image}`" height="140" cover />
          <VCardText>
            <p class="font-weight-medium mb-1">{{ banner.title }}</p>
            <p class="text-caption text-medium-emphasis mb-2">{{ banner.subtitle }}</p>
            <VChip size="small" variant="tonal" class="mr-2">{{ banner.placement === 'home_slider' ? 'Slider' : 'Offer Strip' }}</VChip>
            <VChip :color="banner.is_active ? 'success' : 'error'" size="small" variant="tonal">
              {{ banner.is_active ? 'Active' : 'Inactive' }}
            </VChip>
          </VCardText>
          <VCardActions>
            <VBtn size="small" variant="text" @click="handleEdit(banner)">Edit</VBtn>
            <VBtn size="small" variant="text" color="error" @click="handleDelete(banner)">Delete</VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        No banners yet.
      </VCardText>
    </VCard>

    <BannerFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :banner="selectedBanner"
      @submit="fetchBanners"
    />

    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">Confirm Delete</VCardTitle>
        <VCardText>Delete banner <strong>{{ selectedBanner?.title }}</strong>?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDeleteDialogOpen = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
