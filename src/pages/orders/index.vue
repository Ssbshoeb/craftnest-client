<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Orders',
  },
})

const STATUS_FLOW = ['pending', 'confirmed', 'in_production', 'shipped', 'delivered']
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  in_production: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error',
}

const searchQuery = ref('')
const selectedStatus = ref('')
const orders = ref([])
const loading = ref(false)
const totalOrders = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isDetailOpen = ref(false)
const selectedOrder = ref(null)
const newStatus = ref('')
const statusNote = ref('')
const updatingStatus = ref(false)

const statusOptions = [
  { title: 'All Status', value: '' },
  ...STATUS_FLOW.map(s => ({ title: STATUS_LABELS[s], value: s })),
  { title: 'Cancelled', value: 'cancelled' },
]

const headers = [
  { title: 'Order No', key: 'order_no', sortable: false },
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Total', key: 'total', sortable: false },
  { title: 'Payment', key: 'payment_method', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Placed On', key: 'created_at', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchOrders = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/orders', {
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
      orders.value = data.value.data || []
      totalOrders.value = data.value.count || 0
    }
  } finally {
    loading.value = false
  }
}

const openOrder = order => {
  selectedOrder.value = order
  newStatus.value = order.status
  statusNote.value = ''
  isDetailOpen.value = true
}

const nextStatusOptions = computed(() => {
  if (!selectedOrder.value) return []

  return [...STATUS_FLOW, 'cancelled'].map(s => ({ title: STATUS_LABELS[s], value: s }))
})

const updateStatus = () => {
  if (!selectedOrder.value) return

  updatingStatus.value = true
  const encryptedId = encryptIt(String(selectedOrder.value.id))

  ApiService.put(`/orders/${encryptedId}`, { status: newStatus.value, note: statusNote.value },
    () => {
      updatingStatus.value = false
      isDetailOpen.value = false
      fetchOrders()
    },
    () => {
      updatingStatus.value = false
    },
  )
}

watch([paged, itemsPerPage, selectedStatus], () => fetchOrders())

/*
 * Typing used to fire one request per keystroke, and a search run from page 3
 * stayed on page 3 — usually landing on an empty result set.
 */
watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchOrders()
}, { debounce: 350 })

onMounted(() => fetchOrders())
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Orders
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Track and manage customer orders
      </p>
    </div>

    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" md="9">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search by order number..."
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
        :items="orders"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.order_no="{ item }">
          <span class="font-weight-medium">{{ item.order_no }}</span>
        </template>

        <template #item.customer="{ item }">
          {{ item.customer?.full_name || '—' }}
        </template>

        <template #item.total="{ item }">
          ₹{{ Number(item.total).toLocaleString('en-IN') }}
        </template>

        <template #item.payment_method="{ item }">
          <VChip size="small" variant="tonal">
            {{ item.payment_method === 'cod' ? 'COD' : 'Online' }}
          </VChip>
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
          <VBtn
            v-if="can('ORDERS.UPDATE')"
            icon
            size="small"
            variant="text"
            @click="openOrder(item)"
          >
            <VIcon icon="tabler-eye" size="20" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-shopping-cart-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">
              No orders yet
            </p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalOrders"
        noun="orders"
      />
    </VCard>

    <!-- Order Detail Dialog -->
    <VDialog v-model="isDetailOpen" max-width="700" scrollable>
      <VCard v-if="selectedOrder">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h5">Order {{ selectedOrder.order_no }}</span>
          <VBtn icon variant="text" size="small" @click="isDetailOpen = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText style="max-block-size: 60vh;">
          <p class="text-body-2 text-medium-emphasis mb-1">
            Customer: <strong>{{ selectedOrder.customer?.full_name }}</strong>
          </p>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ selectedOrder.ship_name }}, {{ selectedOrder.ship_phone }}<br>
            {{ selectedOrder.ship_line1 }}, {{ selectedOrder.ship_line2 }}<br>
            {{ selectedOrder.ship_city }}, {{ selectedOrder.ship_state }} - {{ selectedOrder.ship_pincode }}
          </p>

          <VTable density="compact">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedOrder.items" :key="item.id">
                <td>{{ item.product_name }}</td>
                <td>{{ item.qty }}</td>
                <td>₹{{ Number(item.line_total).toLocaleString('en-IN') }}</td>
              </tr>
            </tbody>
          </VTable>

          <p class="text-end font-weight-medium mt-2">
            Total: ₹{{ Number(selectedOrder.total).toLocaleString('en-IN') }}
          </p>

          <VDivider class="my-4" />

          <h3 class="text-body-1 font-weight-medium mb-2">
            Update Status
          </h3>
          <AppSelect
            v-model="newStatus"
            :items="nextStatusOptions"
            item-title="title"
            item-value="value"
            label="Status"
          />
          <AppTextarea v-model="statusNote" label="Note (optional)" rows="2" class="mt-2" />

          <VDivider class="my-4" />

          <h3 class="text-body-1 font-weight-medium mb-2">
            Status History
          </h3>
          <VTimeline density="compact" side="end">
            <VTimelineItem
              v-for="log in selectedOrder.status_logs"
              :key="log.id"
              size="x-small"
              :dot-color="STATUS_COLORS[log.to_status]"
            >
              <p class="text-body-2 mb-0">
                {{ STATUS_LABELS[log.to_status] }}
                <span class="text-caption text-medium-emphasis">
                  — {{ new Date(log.created_at).toLocaleString('en-IN') }}
                </span>
              </p>
              <p v-if="log.note" class="text-caption text-medium-emphasis mb-0">
                {{ log.note }}
              </p>
            </VTimelineItem>
          </VTimeline>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="isDetailOpen = false">
            Close
          </VBtn>
          <VBtn color="primary" :loading="updatingStatus" @click="updateStatus">
            Update Status
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
