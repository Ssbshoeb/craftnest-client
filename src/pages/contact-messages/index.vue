<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Contact Messages',
  },
})

const STATUS_LABELS = { new: 'New', read: 'Read', replied: 'Replied' }
const STATUS_COLORS = { new: 'info', read: 'warning', replied: 'success' }

const searchQuery = ref('')
const messages = ref([])
const loading = ref(false)
const totalMessages = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isDetailOpen = ref(false)
const selectedMessage = ref(null)

const headers = [
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Subject', key: 'subject', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Date', key: 'created_at', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchMessages = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/contact_messages', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    }))

    if (!error.value && data.value) {
      messages.value = data.value.data || []
      totalMessages.value = data.value.count || 0
    }
  } finally {
    loading.value = false
  }
}

const openMessage = message => {
  const encryptedId = encryptIt(String(message.id))

  ApiService.get(`/contact_messages/${encryptedId}`, response => {
    selectedMessage.value = response.data
    isDetailOpen.value = true
    fetchMessages() // status may have flipped new -> read
  })
}

const markReplied = () => {
  const encryptedId = encryptIt(String(selectedMessage.value.id))

  ApiService.put(`/contact_messages/${encryptedId}`, { status: 'replied' }, () => {
    isDetailOpen.value = false
    fetchMessages()
  })
}

watch([paged, itemsPerPage], () => fetchMessages())

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchMessages()
}, { debounce: 350 })
onMounted(() => fetchMessages())
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Contact Messages
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Messages from the storefront contact form
      </p>
    </div>

    <VCard>
      <VCardText>
        <AppTextField
          v-model="searchQuery"
          placeholder="Search by name, email..."
          density="comfortable"
          prepend-inner-icon="tabler-search"
        />
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="messages"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.name="{ item }">
          <div>
            <p class="mb-0 font-weight-medium">{{ item.name }}</p>
            <p class="mb-0 text-caption text-medium-emphasis">{{ item.phone || item.email }}</p>
          </div>
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
          <VBtn icon size="small" variant="text" @click="openMessage(item)">
            <VIcon icon="tabler-eye" size="20" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-mail-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">No messages yet</p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalMessages"
        noun="messages"
      />
    </VCard>

    <VDialog v-model="isDetailOpen" max-width="500">
      <VCard v-if="selectedMessage">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h5">{{ selectedMessage.name }}</span>
          <VBtn icon variant="text" size="small" @click="isDetailOpen = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-2">
            {{ selectedMessage.phone }} <span v-if="selectedMessage.email">, {{ selectedMessage.email }}</span>
          </p>
          <p v-if="selectedMessage.subject" class="font-weight-medium mb-1">{{ selectedMessage.subject }}</p>
          <p class="text-body-2">{{ selectedMessage.message }}</p>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDetailOpen = false">Close</VBtn>
          <VBtn v-if="selectedMessage.status !== 'replied'" color="primary" @click="markReplied">
            Mark as Replied
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
