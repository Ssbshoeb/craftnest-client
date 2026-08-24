<script setup>
import UserFormDialog from '@/components/users/UserFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const { encryptIt } = useCrypto()
const { can } = usePermission()
const authStore = useAuthStore()

definePage({
  meta: {
    title: 'Users',
  },
})

// State
const searchQuery = ref('')
const selectedPosition = ref('')
const selectedStatus = ref('')
const users = ref([])
const loading = ref(false)
const totalUsers = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedUser = ref(null)
const formMode = ref('add') // 'add' or 'edit'
const positions = ref([])
const loadingOptions = ref(false)

// Filter options
const positionOptions = ref([{ title: 'All Positions', value: '' }])

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'full_name', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Role', key: 'roles', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed
const paginationData = computed(() => ({
  page: paged.value,
  itemsPerPage: itemsPerPage.value,
  totalItems: totalUsers.value,
}))

const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalUsers.value)

  return `Showing ${start} to ${end} of ${totalUsers.value} results`
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

  const roleIcons = {
    'SUPER ADMIN': 'tabler-shield-star',  // Example icon for super admin
    'ADMIN': 'tabler-shield-check',
    'USER': 'tabler-user',
  }


  return roleIcons[role]
}

// Methods
const fetchPositions = async () => {
  loadingOptions.value = true
  try {
    const { data, error } = await useApi('/positions')

    if (!error.value && data.value) {
      positions.value = data.value.data || data.value
      positionOptions.value = [
        { title: 'All Positions', value: '' },
        ...positions.value.map(position => ({
          title: position.name,
          value: position.id,
        })),
      ]
    }
  } catch (err) {
    console.error('Error fetching positions:', err)
  } finally {
    loadingOptions.value = false
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const searchParams = {}

    if (selectedStatus.value !== '') {
      searchParams.is_active = selectedStatus.value
    }
    if (selectedPosition.value) {
      searchParams.position_id = selectedPosition.value
    }

    const { data, error } = await useApi(createUrl('/users', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value || undefined,
        search: Object.keys(searchParams).length ? searchParams : undefined,
        with: ['roles', 'position'],
      },
    }))

    if (!error.value && data.value) {
      users.value = data.value.data || []
      totalUsers.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}




const handleAddUser = () => {
  formMode.value = 'add'
  selectedUser.value = null
  isFormDialogOpen.value = true
}

const handleEditUser = user => {
  formMode.value = 'edit'
  selectedUser.value = { ...user }
  isFormDialogOpen.value = true
}

const handleDeleteUser = user => {
  selectedUser.value = user
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedUser.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedUser.value.id))

  ApiService.delete(`/users/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchUsers()
      loading.value = false
    },
    error => {
      console.error('Error deleting user:', error)
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchUsers()
}

const handlePageChange = page => {
  paged.value = page
}

// Watchers
watch([paged, searchQuery, selectedPosition, selectedStatus], () => {
  fetchUsers()
})

// Initialize
onMounted(() => {
  fetchPositions()
  fetchUsers()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Users
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage user accounts and permissions
          </p>
        </div>
        <VBtn v-if="can('USERS.CREATE')" color="primary" prepend-icon="tabler-user-plus" @click="handleAddUser">
          Add User
        </VBtn>
      </div>
    </div>
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <AppTextField v-model="searchQuery" placeholder="Search by name or email..." density="comfortable"
              prepend-inner-icon="tabler-search" />
          </VCol>
          <VCol cols="12" md="3">
            <AppSelect v-model="selectedPosition" :items="positionOptions" item-title="title" item-value="value"
              density="comfortable" :loading="loadingOptions" />
          </VCol>
          <VCol cols="12" md="3">
            <AppSelect v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value"
              density="comfortable" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <!-- Filters -->


      <!-- Data Table -->
      <VDataTable :headers="headers" :items="users" :loading="loading" :items-per-page="itemsPerPage"
        hide-default-footer class="user-list-table">
        <!-- ID Column -->
        <template #item.id="{ item, index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>
        <!-- Name Column -->
        <template #item.full_name="{ item }">
          <span class="text-body-1">
            {{ item.full_name }}
          </span>
        </template>

        <!-- Role Column -->
        <template #item.roles="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon :icon="getRoleIcon(item.roles?.[0]?.name)" size="18" />
            <span class="text-body-1 text-capitalize">
              {{ item.roles?.[0]?.name || '-' }}
            </span>
          </div>
        </template>

        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <VChip :color="item.is_active ? 'success' : 'error'"
            size="small" variant="tonal" class="font-weight-medium">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <VMenu>
            <template #activator="{ props }">
              <VBtn icon size="small" variant="text" v-bind="props">
                <VIcon size="20" icon="tabler-dots-vertical" />
              </VBtn>
            </template>

            <VList>
              <VListItem v-if="can('USERS.UPDATE')" @click="handleEditUser(item)">
                <template #prepend>
                  <VIcon icon="tabler-edit" size="20" />
                </template>
                <VListItemTitle>Edit</VListItemTitle>
              </VListItem>
              <VListItem v-if="can('USERS.DELETE')" @click="handleDeleteUser(item)">
                <template #prepend>
                  <VIcon icon="tabler-trash" size="20" color="error" />
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
            <VIcon size="48" icon="tabler-database-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">
              No users found
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
            <AppSelect v-model="itemsPerPage" :items="[5, 10, 25, 50]" density="compact" variant="outlined"
              style=" max-inline-size: 70px;min-inline-size: 70px;" />
          </div>

          <div class="d-flex align-center gap-4">
            <span class="text-body-2 text-medium-emphasis">
              {{ paginationText }}
            </span>
            <div class="d-flex gap-2">
              <VBtn variant="outlined" size="small" :disabled="paged === 1" @click="paged--">
                Previous
              </VBtn>
              <VBtn variant="outlined" size="small" :disabled="paged >= totalPages" @click="paged++">
                Next
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- User Form Dialog -->
    <UserFormDialog v-model:is-open="isFormDialogOpen" :mode="formMode" :user="selectedUser" :positions="positions"
      @submit="handleFormSubmit" />

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="isDeleteDialogOpen" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete user
          <strong>{{ selectedUser?.full_name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDeleteDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="error" :loading="loading" @click="confirmDelete">
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
:deep(.user-list-table) {
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
