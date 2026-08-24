<script setup>
import ModuleFormDialog from '@/components/modules/ModuleFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Modules',
  },
})

// Search & Filters
const searchQuery = ref('')
const selectedStatus = ref('')

// Data & Pagination
const modules = ref([])
const loading = ref(false)
const totalItems = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

// Dialog States
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedModule = ref(null)
const formMode = ref('add') // 'add' or 'edit'

// Filter Options
const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed Properties
const paginationData = computed(() => ({
  page: paged.value,
  itemsPerPage: itemsPerPage.value,
  totalItems: totalItems.value,
}))

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalItems.value)
  
  return `Showing ${start} to ${end} of ${totalItems.value} results`
})

// Data Fetching Methods

// Fetch Modules (with pagination & filters)
const fetchModules = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/modules', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        order_by: 'id',
        sort: 'desc',
        search: {
          is_active: selectedStatus.value,
        },
      },
    })).json()

    if (!error.value && data.value) {
      modules.value = data.value.data || []
      totalItems.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching modules:', err)
  } finally {
    loading.value = false
  }
}

// CRUD Action Handlers

// Add
const handleAdd = () => {
  formMode.value = 'add'
  selectedModule.value = null
  isFormDialogOpen.value = true
}

// Edit
const handleEdit = module => {
  formMode.value = 'edit'
  selectedModule.value = { ...module }
  isFormDialogOpen.value = true
}

// Delete
const handleDelete = module => {
  selectedModule.value = module
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedModule.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedModule.value.id))

  ApiService.delete(`/modules/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchModules()
      loading.value = false
    },
    error => {
      console.error('Error deleting module:', error)
      loading.value = false
    },
  )
}

// Form Submit Handler
const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchModules()
}

// Pagination Handler
const handlePageChange = page => {
  paged.value = page
}

// Watchers (Auto-refresh on filter changes)
watch([paged, searchQuery, selectedStatus], () => {
  fetchModules()
})

watch(itemsPerPage, () => {
  paged.value = 1
  fetchModules()
})

// Initialization
onMounted(() => {
  fetchModules()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Modules
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage module records
          </p>
        </div>
        <VBtn
          v-if="can('MODULES.CREATE')"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleAdd"
        >
          Add Module
        </VBtn>
      </div>
    </div>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="9"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search modules..."
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
              placeholder="Filter by Status"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- DATA TABLE CARD -->
    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="modules"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
        class="data-table"
      >
        <!-- ID Column with Sequential Number -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
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
                v-if="can('MODULES.UPDATE')"
                @click="handleEdit(item)"
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
                v-if="can('MODULES.DELETE')"
                @click="handleDelete(item)"
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

        <!-- Loading State -->
        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <!-- No Data State -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              size="48"
              icon="tabler-database-off"
              class="mb-4"
            />
            <p class="text-body-1 text-medium-emphasis">
              No modules found
            </p>
          </div>
        </template>
      </VDataTable>

      <VDivider />

      <!-- PAGINATION -->
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
            <AppSelect
              v-model="itemsPerPage"
              :items="[5, 10, 25, 50]"
              density="compact"
              variant="outlined"
              style="max-inline-size: 70px;min-inline-size: 70px;"
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

    <!-- FORM DIALOG -->
    <ModuleFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :module="selectedModule"
      @submit="handleFormSubmit"
    />

    <!-- DELETE CONFIRMATION DIALOG -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ selectedModule?.name }}</strong>?
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
:deep(.data-table) {
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
