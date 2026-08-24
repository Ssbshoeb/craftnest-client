<script setup>
import NotificationFormDialog from '@/components/notifications/NotificationFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Notifications',
  },
})

// Search & Filters
const searchQuery = ref('')
const selectedType = ref('')
const selectedTargetType = ref('')
const selectedStatus = ref('')
const selectedReadStatus = ref('')

// Data & Pagination
const notifications = ref([])
const loading = ref(false)
const totalItems = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

// Dialog States
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isViewDialogOpen = ref(false)
const selectedNotification = ref(null)
const formMode = ref('add')

// Related Data (for dropdowns)
const users = ref([])
const roles = ref([])
const loadingUsers = ref(false)
const loadingRoles = ref(false)

// Filter Options
const typeOptions = [
  { title: 'All Types', value: '' },
  { title: 'General', value: 'general' },
  { title: 'Alert', value: 'alert' },
  { title: 'Reminder', value: 'reminder' },
  { title: 'Promotional', value: 'promotional' },
  { title: 'System', value: 'system' },
]

const targetTypeOptions = [
  { title: 'All Targets', value: '' },
  { title: 'All Users', value: 'all' },
  { title: 'Specific Users', value: 'user' },
  { title: 'By Role', value: 'role' },
  { title: 'By Position', value: 'position' },
]

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

const readStatusOptions = [
  { title: 'All', value: '' },
  { title: 'Read', value: 1 },
  { title: 'Unread', value: 0 },
]

// Table Configuration
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Type', key: 'type', sortable: false, width: '120px' },
  { title: 'Target', key: 'target_type', sortable: false, width: '120px' },
  { title: 'Read', key: 'is_read', sortable: false, width: '100px' },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Sent At', key: 'sent_at', sortable: false, width: '150px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

// Computed Properties
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginationText = computed(() => {
  const start = (paged.value - 1) * itemsPerPage.value + 1
  const end = Math.min(paged.value * itemsPerPage.value, totalItems.value)

  return `Showing ${start} to ${end} of ${totalItems.value} results`
})

// Data Fetching Methods
const fetchNotifications = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/notifications', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        q: searchQuery.value,
        order_by: 'id',
        sort: 'desc',
        search: {
          is_active: selectedStatus.value,
          type: selectedType.value,
          target_type: selectedTargetType.value,
          is_read: selectedReadStatus.value,
        },
      },
    })).json()

    if (!error.value && data.value) {
      notifications.value = data.value.data || []
      totalItems.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching notifications:', err)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const { data, error } = await useApi('/users').json()
    if (!error.value && data.value) {
      users.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching users:', err)
  } finally {
    loadingUsers.value = false
  }
}

const fetchRoles = async () => {
  loadingRoles.value = true
  try {
    const { data, error } = await useApi('/roles').json()
    if (!error.value && data.value) {
      roles.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching roles:', err)
  } finally {
    loadingRoles.value = false
  }
}

// CRUD Action Handlers
const handleAdd = () => {
  formMode.value = 'add'
  selectedNotification.value = null
  isFormDialogOpen.value = true
}

const handleView = notification => {
  selectedNotification.value = { ...notification }
  isViewDialogOpen.value = true
}

const handleEdit = notification => {
  formMode.value = 'edit'
  selectedNotification.value = { ...notification }
  isFormDialogOpen.value = true
}

const handleDelete = notification => {
  selectedNotification.value = notification
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedNotification.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedNotification.value.id))

  ApiService.delete(`/notifications/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchNotifications()
      loading.value = false
    },
    error => {
      console.error('Error deleting notification:', error)
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchNotifications()
}

// Helper Methods
const getTypeColor = type => {
  const colors = {
    general: 'info',
    alert: 'error',
    reminder: 'warning',
    promotional: 'success',
    system: 'primary',
  }

  return colors[type] || 'secondary'
}

const getTargetLabel = targetType => {
  const labels = {
    all: 'All Users',
    user: 'Specific Users',
    role: 'By Role',
    position: 'By Position',
    company: 'By Company',
  }

  return labels[targetType] || targetType
}

const formatDate = dateString => {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Watchers
watch([paged, searchQuery, selectedType, selectedTargetType, selectedStatus, selectedReadStatus], () => {
  fetchNotifications()
})

watch(itemsPerPage, () => {
  paged.value = 1
  fetchNotifications()
})

// Initialization
onMounted(() => {
  fetchNotifications()
  fetchUsers()
  fetchRoles()
})
</script>

<template>
  <div>
    <!-- PAGE HEADER -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Notifications
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage and send notifications
          </p>
        </div>
        <VBtn
          v-if="can('NOTIFICATIONS.CREATE')"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleAdd"
        >
          Send Notification
        </VBtn>
      </div>
    </div>

    <!-- FILTERS CARD -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search notifications..."
              density="comfortable"
              prepend-inner-icon="tabler-search"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
          >
            <AppSelect
              v-model="selectedType"
              :items="typeOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              placeholder="Type"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
          >
            <AppSelect
              v-model="selectedTargetType"
              :items="targetTypeOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              placeholder="Target"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
          >
            <AppSelect
              v-model="selectedStatus"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              placeholder="Status"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
          >
            <AppSelect
              v-model="selectedReadStatus"
              :items="readStatusOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              placeholder="Read Status"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- DATA TABLE CARD -->
    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="notifications"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
        class="data-table"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <!-- Title Column -->
        <template #item.title="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-1 font-weight-medium">{{ item.title }}</span>
            <span
              v-if="item.body"
              class="text-caption text-medium-emphasis text-truncate"
              style="max-inline-size: 250px;"
            >
              {{ item.body }}
            </span>
          </div>
        </template>

        <!-- Type Column -->
        <template #item.type="{ item }">
          <VChip
            :color="getTypeColor(item.type)"
            size="small"
            variant="tonal"
            class="font-weight-medium text-capitalize"
          >
            {{ item.type || 'general' }}
          </VChip>
        </template>

        <!-- Target Type Column -->
        <template #item.target_type="{ item }">
          <span class="text-body-2">
            {{ getTargetLabel(item.target_type) }}
          </span>
        </template>

        <!-- Read Status Column -->
        <template #item.is_read="{ item }">
          <VChip
            :color="item.is_read ? 'success' : 'warning'"
            size="small"
            variant="tonal"
            class="font-weight-medium"
          >
            {{ item.is_read ? 'Read' : 'Unread' }}
          </VChip>
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

        <!-- Sent At Column -->
        <template #item.sent_at="{ item }">
          <span class="text-body-2 text-medium-emphasis">
            {{ formatDate(item.sent_at || item.created_at) }}
          </span>
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
              <VListItem @click="handleView(item)">
                <template #prepend>
                  <VIcon
                    icon="tabler-eye"
                    size="20"
                  />
                </template>
                <VListItemTitle>View</VListItemTitle>
              </VListItem>
              <VListItem
                v-if="can('NOTIFICATIONS.UPDATE')"
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
                v-if="can('NOTIFICATIONS.DELETE')"
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
              icon="tabler-bell-off"
              class="mb-4"
            />
            <p class="text-body-1 text-medium-emphasis">
              No notifications found
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
    <NotificationFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :notification="selectedNotification"
      :users="users"
      :roles="roles"
      @submit="handleFormSubmit"
    />

    <!-- VIEW DIALOG -->
    <VDialog
      v-model="isViewDialogOpen"
      max-width="600"
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h5">Notification Details</span>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="isViewDialogOpen = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText v-if="selectedNotification">
          <VList class="card-list">
            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Title
              </VListItemTitle>
              <VListItemSubtitle>{{ selectedNotification.title }}</VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Body
              </VListItemTitle>
              <VListItemSubtitle>{{ selectedNotification.body || '-' }}</VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Type
              </VListItemTitle>
              <VListItemSubtitle>
                <VChip
                  :color="getTypeColor(selectedNotification.type)"
                  size="small"
                  variant="tonal"
                  class="text-capitalize"
                >
                  {{ selectedNotification.type || 'general' }}
                </VChip>
              </VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Target
              </VListItemTitle>
              <VListItemSubtitle>{{ getTargetLabel(selectedNotification.target_type) }}</VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Sent At
              </VListItemTitle>
              <VListItemSubtitle>{{ formatDate(selectedNotification.sent_at) }}</VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Read At
              </VListItemTitle>
              <VListItemSubtitle>{{ formatDate(selectedNotification.read_at) }}</VListItemSubtitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="font-weight-medium">
                Status
              </VListItemTitle>
              <VListItemSubtitle>
                <VChip
                  :color="selectedNotification.is_active ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedNotification.is_active ? 'Active' : 'Inactive' }}
                </VChip>
              </VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            @click="isViewDialogOpen = false"
          >
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
          Are you sure you want to delete notification <strong>"{{ selectedNotification?.title }}"</strong>?
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
