<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Customers',
  },
})

const searchQuery = ref('')
const customers = ref([])
const loading = ref(false)
const totalCustomers = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isDetailOpen = ref(false)
const selectedCustomer = ref(null)

const headers = [
  { title: 'Name', key: 'full_name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Phone', key: 'phone', sortable: false },
  { title: 'Orders', key: 'orders_count', sortable: false },
  { title: 'Registered On', key: 'created_at', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchCustomers = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/customers', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    }))

    if (!error.value && data.value) {
      customers.value = data.value.data || []
      totalCustomers.value = data.value.count || 0
    }
  } finally {
    loading.value = false
  }
}

const viewCustomer = async customer => {
  const encryptedId = encryptIt(String(customer.id))

  ApiService.get(`/customers/${encryptedId}`, response => {
    selectedCustomer.value = response.data
    isDetailOpen.value = true
  })
}

const exportCsv = () => {
  ApiService.download('/customers/export', 'customers.csv')
}

watch([paged, itemsPerPage], () => fetchCustomers())

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchCustomers()
}, { debounce: 350 })

onMounted(() => fetchCustomers())
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Customers
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Everyone who has registered on the storefront
          </p>
        </div>
        <VBtn
          v-if="can('CUSTOMERS.VIEW')"
          color="primary"
          variant="outlined"
          prepend-icon="tabler-file-export"
          @click="exportCsv"
        >
          Export CSV
        </VBtn>
      </div>
    </div>

    <VCard>
      <VCardText>
        <AppTextField
          v-model="searchQuery"
          placeholder="Search by name, email or phone..."
          density="comfortable"
          prepend-inner-icon="tabler-search"
        />
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="customers"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleDateString('en-IN') }}
        </template>

        <template #item.actions="{ item }">
          <VBtn icon size="small" variant="text" @click="viewCustomer(item)">
            <VIcon icon="tabler-eye" size="20" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-users" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">
              No customers registered yet
            </p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalCustomers"
        noun="customers"
      />
    </VCard>

    <VDialog v-model="isDetailOpen" max-width="600" scrollable>
      <VCard v-if="selectedCustomer">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h5">{{ selectedCustomer.full_name }}</span>
          <VBtn icon variant="text" size="small" @click="isDetailOpen = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-block-size: 60vh;">
          <p class="text-body-2">
            Email: {{ selectedCustomer.email || '—' }}<br>
            Phone: {{ selectedCustomer.phone || '—' }}<br>
            Registered: {{ new Date(selectedCustomer.created_at).toLocaleDateString('en-IN') }}
          </p>

          <h3 class="text-body-1 font-weight-medium mt-4 mb-2">
            Addresses
          </h3>
          <p v-if="!selectedCustomer.addresses?.length" class="text-body-2 text-medium-emphasis">
            No saved addresses.
          </p>
          <VCard v-for="address in selectedCustomer.addresses" :key="address.id" variant="outlined" class="mb-2">
            <VCardText class="text-body-2">
              {{ address.name }}, {{ address.phone }}<br>
              {{ address.line1 }}, {{ address.city }}, {{ address.state }} - {{ address.pincode }}
            </VCardText>
          </VCard>

          <h3 class="text-body-1 font-weight-medium mt-4 mb-2">
            Order History
          </h3>
          <p v-if="!selectedCustomer.orders?.length" class="text-body-2 text-medium-emphasis">
            No orders yet.
          </p>
          <VTable v-else density="compact">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in selectedCustomer.orders" :key="order.id">
                <td>{{ order.order_no }}</td>
                <td>{{ order.status }}</td>
                <td>₹{{ Number(order.total).toLocaleString('en-IN') }}</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
