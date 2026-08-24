<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Custom Enquiries',
  },
})

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', won: 'Won', lost: 'Lost' }
const STATUS_COLORS = { new: 'info', contacted: 'warning', quoted: 'primary', won: 'success', lost: 'error' }

const searchQuery = ref('')
const selectedStatus = ref('')
const enquiries = ref([])
const loading = ref(false)
const totalEnquiries = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isDetailOpen = ref(false)
const selectedEnquiry = ref(null)
const form = ref({ status: 'new', quoted_amount: null, admin_note: '', follow_up_at: null })
const saving = ref(false)

const statusOptions = [
  { title: 'All Status', value: '' },
  ...Object.entries(STATUS_LABELS).map(([value, title]) => ({ title, value })),
]

const headers = [
  { title: 'Enquiry No', key: 'enquiry_no', sortable: false },
  { title: 'Customer', key: 'name', sortable: false },
  { title: 'Requirement', key: 'requirement', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Date', key: 'created_at', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchEnquiries = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/custom_enquiries', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: { status: selectedStatus.value },
      },
    }))

    if (!error.value && data.value) {
      enquiries.value = data.value.data || []
      totalEnquiries.value = data.value.count || 0
    }
  } finally {
    loading.value = false
  }
}

const openEnquiry = enquiry => {
  selectedEnquiry.value = enquiry
  form.value = {
    status: enquiry.status,
    quoted_amount: enquiry.quoted_amount,
    admin_note: enquiry.admin_note || '',
    follow_up_at: enquiry.follow_up_at,
  }
  isDetailOpen.value = true
}

const saveEnquiry = () => {
  saving.value = true
  const encryptedId = encryptIt(String(selectedEnquiry.value.id))

  ApiService.put(`/custom_enquiries/${encryptedId}`, form.value,
    () => {
      saving.value = false
      isDetailOpen.value = false
      fetchEnquiries()
    },
    () => {
      saving.value = false
    },
  )
}

watch([paged, itemsPerPage, selectedStatus], () => fetchEnquiries())

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchEnquiries()
}, { debounce: 350 })
onMounted(() => fetchEnquiries())
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Custom Enquiries
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Made-to-order requests from the storefront
      </p>
    </div>

    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="9">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search by name, phone..."
              density="comfortable"
              prepend-inner-icon="tabler-search"
            />
          </VCol>
          <VCol cols="12" md="3">
            <AppSelect
              v-model="selectedStatus"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="enquiries"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.name="{ item }">
          <div>
            <p class="mb-0 font-weight-medium">{{ item.name }}</p>
            <p class="mb-0 text-caption text-medium-emphasis">{{ item.phone }}</p>
          </div>
        </template>

        <template #item.requirement="{ item }">
          <span class="text-truncate d-inline-block" style="max-inline-size: 250px;">{{ item.requirement }}</span>
        </template>

        <template #item.status="{ item }">
          <VChip :color="STATUS_COLORS[item.status]" size="small" variant="tonal">
            {{ STATUS_LABELS[item.status] }}
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleDateString('en-IN') }}
        </template>

        <template #item.actions="{ item }">
          <VBtn v-if="can('CUSTOM_ENQUIRIES.UPDATE')" icon size="small" variant="text" @click="openEnquiry(item)">
            <VIcon icon="tabler-eye" size="20" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-message-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">No enquiries yet</p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalEnquiries"
        noun="enquiries"
      />
    </VCard>

    <VDialog v-model="isDetailOpen" max-width="600" scrollable>
      <VCard v-if="selectedEnquiry">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h5">{{ selectedEnquiry.enquiry_no }}</span>
          <VBtn icon variant="text" size="small" @click="isDetailOpen = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-block-size: 60vh;">
          <p class="text-body-2 mb-1">
            <strong>{{ selectedEnquiry.name }}</strong> — {{ selectedEnquiry.phone }}
            <span v-if="selectedEnquiry.email">, {{ selectedEnquiry.email }}</span>
          </p>
          <p class="text-body-2">{{ selectedEnquiry.requirement }}</p>
          <p v-if="selectedEnquiry.size_note" class="text-caption text-medium-emphasis mb-0">
            Size: {{ selectedEnquiry.size_note }}
          </p>
          <p v-if="selectedEnquiry.wood_pref" class="text-caption text-medium-emphasis mb-0">
            Wood: {{ selectedEnquiry.wood_pref }}
          </p>
          <p v-if="selectedEnquiry.budget_min || selectedEnquiry.budget_max" class="text-caption text-medium-emphasis">
            Budget: ₹{{ selectedEnquiry.budget_min }} - ₹{{ selectedEnquiry.budget_max }}
          </p>

          <VRow v-if="selectedEnquiry.files?.length" class="mt-2">
            <VCol v-for="file in selectedEnquiry.files" :key="file.id" cols="4">
              <VImg :src="file.url" height="80" cover class="rounded" />
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <AppSelect
            v-model="form.status"
            :items="Object.entries(STATUS_LABELS).map(([value, title]) => ({ title, value }))"
            item-title="title"
            item-value="value"
            label="Status"
          />
          <AppTextField v-model="form.quoted_amount" label="Quoted Amount (₹)" type="number" class="mt-2" />
          <AppTextarea v-model="form.admin_note" label="Admin Note" rows="3" class="mt-2" />
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDetailOpen = false">Close</VBtn>
          <VBtn color="primary" :loading="saving" @click="saveEnquiry">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
