<script setup>
import AdminFormDialog from '@/components/users/AdminFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import ApiService from '@/services/api.service'
import { useAuthStore } from '@/stores/auth'

const { encryptIt } = useCrypto()

definePage({
  meta: {
    title: 'Admins',
    requiresRole: 'Super Admin',
  },
})

const authStore = useAuthStore()
const router = useRouter()

// Check if user has Super Admin role
onMounted(() => {
  if (authStore.roleName != 'SUPER ADMIN') {
    router.push('/')
  }
})

// State
const searchQuery = ref('')
const selectedStatus = ref('')
const admins = ref([])
const loading = ref(false)
const totalAdmins = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedAdmin = ref(null)
const formMode = ref('add') // 'add' or 'edit'

// Filter options
const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'User', key: 'user', sortable: false },
  { title: 'Role', key: 'role', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed
const totalPages = computed(() => Math.ceil(totalAdmins.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, totalAdmins.value)
  
  return `Showing ${start} to ${end} of ${totalAdmins.value} results`
})

// Helper to get initials from name
const getInitials = name => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  
  return name.substring(0, 2).toUpperCase()
}

// Helper to get role icon
const getRoleIcon = role => {
  return 'tabler-shield-check'
}

// Helper function to create URL with query params
const createURL = (path, params = {}) => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

  const queryString = new URLSearchParams(filteredParams).toString()
  
  return queryString ? `${path}?${queryString}` : path
}

// Methods
const fetchAdmins = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      keyword: searchQuery.value,
      status: selectedStatus.value,
    }

    const url = createURL('/admins', params)
    const { data, error } = await useApi(url).json()

    if (!error.value && data.value) {
      admins.value = data.value.data || []
      totalAdmins.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching admins:', err)
  } finally {
    loading.value = false
  }
}

const handleAddAdmin = () => {
  formMode.value = 'add'
  selectedAdmin.value = null
  isFormDialogOpen.value = true
}

const handleEditAdmin = admin => {
  formMode.value = 'edit'
  selectedAdmin.value = { ...admin }
  isFormDialogOpen.value = true
}

const handleDeleteAdmin = admin => {
  selectedAdmin.value = admin
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedAdmin.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedAdmin.value.id))

  ApiService.delete(`/admins/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchAdmins()
      loading.value = false
    },
    error => {
      console.error('Error deleting admin:', error)
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchAdmins()
}

// Watchers
watch([currentPage, searchQuery, selectedStatus], () => {
  fetchAdmins()
})

// Initialize
onMounted(() => {
  fetchAdmins()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Admins
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage administrator accounts
          </p>
        </div>
        <VBtn
          color="primary"
          prepend-icon="tabler-user-plus"
          @click="handleAddAdmin"
        >
          Add Admin
        </VBtn>
      </div>
    </div>

    <VCard>
      <!-- Filters -->
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="9"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search by name or email..."
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

    <VCard class="mt-6">
      <!-- Data Table -->
      <VDataTable
        :headers="headers"
        :items="admins"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
        class="admin-list-table"
      >
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (currentPage - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- User Column -->
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="item.status === 'active' ? 'primary' : 'secondary'"
              size="40"
            >
              <span class="text-sm font-weight-medium">
                {{ getInitials(item.name) }}
              </span>
            </VAvatar>
            <div>
              <p class="text-body-1 font-weight-medium mb-0">
                {{ item.name }}
              </p>
              <p class="text-body-2 text-medium-emphasis mb-0">
                <VIcon
                  icon="tabler-mail"
                  size="14"
                  class="me-1"
                />
                {{ item.email }}
              </p>
            </div>
          </div>
        </template>

        <!-- Role Column -->
        <template #item.role="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon
              :icon="getRoleIcon(item.role)"
              size="18"
            />
            <span class="text-body-1 text-capitalize">
              {{ item.role || 'Admin' }}
            </span>
          </div>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="item.status === 'active' ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="font-weight-medium"
          >
            {{ item.status }}
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
              <VListItem @click="handleEditAdmin(item)">
                <template #prepend>
                  <VIcon
                    icon="tabler-edit"
                    size="20"
                  />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem @click="handleDeleteAdmin(item)">
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
              No admins found
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
              style="max-inline-size: 70px; min-inline-size: 70px;"
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
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                Previous
              </VBtn>
              <VBtn
                variant="outlined"
                size="small"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                Next
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Admin Form Dialog -->
    <AdminFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :admin="selectedAdmin"
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
          Are you sure you want to delete admin
          <strong>{{ selectedAdmin?.name }}</strong>?
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
:deep(.admin-list-table) {
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
