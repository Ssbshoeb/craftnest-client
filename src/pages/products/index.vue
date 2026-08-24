<script setup>
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Products',
  },
})

const searchQuery = ref('')
const selectedStatus = ref('')
const products = ref([])
const loading = ref(false)
const totalProducts = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedProduct = ref(null)
const formMode = ref('add')

const statusOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Product', key: 'name', sortable: false },
  { title: 'Category', key: 'category', sortable: false },
  { title: 'Price', key: 'price', sortable: false },
  { title: 'Sale Type', key: 'sale_type', sortable: false },
  { title: 'Stock', key: 'stock_qty', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/products', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: {
          is_active: selectedStatus.value,
        },
      },
    }))

    if (!error.value && data.value) {
      products.value = data.value.data || []
      totalProducts.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

const handleAddProduct = () => {
  formMode.value = 'add'
  selectedProduct.value = null
  isFormDialogOpen.value = true
}

const handleEditProduct = product => {
  formMode.value = 'edit'
  selectedProduct.value = { ...product }
  isFormDialogOpen.value = true
}

const handleDeleteProduct = product => {
  selectedProduct.value = product
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedProduct.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedProduct.value.id))

  ApiService.delete(`/products/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchProducts()
      loading.value = false
    },
    () => {
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  await fetchProducts()

  // Refresh the selected product so the Images tab shows the newly created id
  if (selectedProduct.value?.id) {
    const updated = products.value.find(p => p.id === selectedProduct.value.id)

    if (updated) selectedProduct.value = { ...updated }
  }
}

const handleProductCreated = createdProduct => {
  selectedProduct.value = { ...createdProduct }
  formMode.value = 'edit'
}

watch([paged, itemsPerPage, selectedStatus], () => {
  fetchProducts()
})

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchProducts()
}, { debounce: 350 })

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Products
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage your furniture catalogue
          </p>
        </div>
        <VBtn
          v-if="can('PRODUCTS.CREATE')"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleAddProduct"
        >
          Add Product
        </VBtn>
      </div>
    </div>

    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="9"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search by name, SKU..."
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
      <VDataTable
        :headers="headers"
        :items="products"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.id="{ index }">
          <span class="text-body-2 text-medium-emphasis">
            #{{ (paged - 1) * itemsPerPage + index + 1 }}
          </span>
        </template>

        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar
              size="40"
              rounded
            >
              <VImg
                v-if="item.images?.[0]?.url"
                :src="item.images[0].url"
              />
              <VIcon
                v-else
                icon="tabler-armchair"
                size="20"
              />
            </VAvatar>
            <div>
              <p class="text-body-1 font-weight-medium mb-0">
                {{ item.name }}
              </p>
              <p
                v-if="item.sku"
                class="text-caption text-medium-emphasis mb-0"
              >
                SKU: {{ item.sku }}
              </p>
            </div>
          </div>
        </template>

        <template #item.category="{ item }">
          {{ item.category?.name || '—' }}
        </template>

        <template #item.price="{ item }">
          ₹{{ Number(item.price).toLocaleString('en-IN') }}
        </template>

        <template #item.sale_type="{ item }">
          <VChip
            :color="item.sale_type === 'online_buy' ? 'primary' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ item.sale_type === 'online_buy' ? 'Online Buy' : 'Enquiry Only' }}
          </VChip>
        </template>

        <template #item.is_active="{ item }">
          <VChip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

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
                v-if="can('PRODUCTS.UPDATE')"
                @click="handleEditProduct(item)"
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
                v-if="can('PRODUCTS.DELETE')"
                @click="handleDeleteProduct(item)"
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

        <template #loading>
          <VSkeletonLoader type="table-row@10" />
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              size="48"
              icon="tabler-database-off"
              class="mb-4"
            />
            <p class="text-body-1 text-medium-emphasis">
              No products found
            </p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalProducts"
        noun="products"
      />
    </VCard>

    <ProductFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :product="selectedProduct"
      @submit="handleFormSubmit"
      @created="handleProductCreated"
    />

    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete product
          <strong>{{ selectedProduct?.name }}</strong>?
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
