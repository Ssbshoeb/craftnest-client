<script setup>
import CompanyFormDialog from '@/components/company/CompanyFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Companies',
  },
})

// State
const searchQuery = ref('')
const selectedStatus = ref('')
const companies = ref([])
const loading = ref(false)
const totalCompanies = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedCompany = ref(null)
const formMode = ref('add') // 'add' or 'edit'

// Filter options
const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
  { title: 'Address', key: 'address', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed
const paginationData = computed(() => ({
  page: paged.value,
  itemsPerPage: itemsPerPage.value,
  totalItems: totalCompanies.value,
}))

const totalPages = computed(() => Math.ceil(totalCompanies.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalCompanies.value)
  
  return `Showing ${start} to ${end} of ${totalCompanies.value} results`
})

// Methods
const fetchCompanies = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/companies', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        search: {
          is_active: selectedStatus.value,
        },
      },
    }))

    if (!error.value && data.value) {
      companies.value = data.value.data || []
      totalCompanies.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching companies:', err)
  } finally {
    loading.value = false
  }
}

const handleAddCompany = () => {
  formMode.value = 'add'
  selectedCompany.value = null
  isFormDialogOpen.value = true
}

const handleEditCompany = company => {
  formMode.value = 'edit'
  selectedCompany.value = { ...company }
  isFormDialogOpen.value = true
}

const handleDeleteCompany = company => {
  selectedCompany.value = company
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedCompany.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedCompany.value.id))

  ApiService.delete(`/companies/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchCompanies()
      loading.value = false
    },
    error => {
      console.error('Error deleting company:', error)
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchCompanies()
}

const handlePageChange = page => {
  paged.value = page
}

// Watchers
watch([paged, searchQuery, selectedStatus], () => {
  fetchCompanies()
})

// Initialize
onMounted(() => {
  fetchCompanies()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Companies
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage company records and information
          </p>
        </div>
        <VBtn
          v-if="can('COMPANIES.CREATE')"
          color="primary"
          prepend-icon="tabler-building-plus"
          @click="handleAddCompany"
        >
          Add Company
        </VBtn>
      </div>
    </div>

    <!-- Filters Card -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="9"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search by company name, email, or phone..."
              density="comfortable"
              prepend-inner-icon="tabler-search"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
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

    <!-- Data Table Card -->
    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="companies"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
        class="company-list-table"
      >
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Name Column -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar
              v-if="item.logo"
              size="38"
              :image="item.logo"
            />
            <VAvatar
              v-else
              size="38"
              color="primary"
              variant="tonal"
            >
              <span class="text-sm font-weight-medium">
                {{ item.name ? item.name.substring(0, 2).toUpperCase() : '??' }}
              </span>
            </VAvatar>
            <div>
              <span class="text-body-1 font-weight-medium d-block">
                {{ item.name }}
              </span>
            </div>
          </div>
        </template>

        <!-- Address Column -->
        <template #item.address="{ item }">
          <span class="text-body-2">
            {{ item.address || '-' }}
          </span>
        </template>

        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <VChip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="font-weight-medium"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <VMenu>
            <template #activator="{ props }">
              <VBtn
                icon
                size="small"
                variant="text"
                v-bind="props"
              >
                <VIcon
                  size="20"
                  icon="tabler-dots-vertical"
                />
              </VBtn>
            </template>

            <VList>
              <VListItem
                v-if="can('COMPANIES.UPDATE')"
                @click="handleEditCompany(item)"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-edit"
                    size="20"
                  />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem
                v-if="can('COMPANIES.DELETE')"
                @click="handleDeleteCompany(item)"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-trash"
                    size="20"
                    color="error"
                  />
                </template>
                <VListItemTitle class="text-error">
                  Delete
                </VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>
        </template>

        <!-- Loading -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              size="48"
              icon="tabler-database-off"
              class="mb-4"
            />
            <p class="text-body-1 text-medium-emphasis">
              No companies found
            </p>
          </div>
        </template>
      </VDataTable>

      <VDivider />

      <!-- Pagination -->
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
            <AppSelect
              v-model="itemsPerPage"
              :items="[5, 10, 25, 50]"
              density="compact"
              variant="outlined"
              style=" max-inline-size: 70px;min-inline-size: 70px;"
            />
          </div>

          <div class="d-flex align-center gap-4">
            <span class="text-body-2 text-medium-emphasis">
              {{ paginationText }}
            </span>
            <div class="d-flex gap-2">
              <VBtn
                variant="outlined"
                size="small"
                :disabled="paged === 1"
                @click="paged--"
              >
                Previous
              </VBtn>
              <VBtn
                variant="outlined"
                size="small"
                :disabled="paged >= totalPages"
                @click="paged++"
              >
                Next
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Company Form Dialog -->
    <CompanyFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :company="selectedCompany"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete company
          <strong>{{ selectedCompany?.name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="outlined"
            @click="isDeleteDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="loading"
            @click="confirmDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.text-sm {
  font-size: 0.875rem;
}

/* Custom table styling */
:deep(.company-list-table) {
  .v-table__wrapper {
    border-radius: 0;
  }

  .v-data-table-header {
    background-color: rgb(var(--v-theme-surface));
  }

  .v-data-table__td,
  .v-data-table__th {
    padding-block: 1rem;
  }
}
</style>
