<script setup>
import CategoryFormDialog from '@/components/categories/CategoryFormDialog.vue'
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Categories',
  },
})

const searchQuery = ref('')
const categories = ref([])
const loading = ref(false)
const totalCategories = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedCategory = ref(null)
const formMode = ref('add')

const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Sort Order', key: 'sort_order', sortable: false },
  { title: 'Featured', key: 'is_featured', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' },
]

const fetchCategories = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/categories', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'sort_order',
        sortOrder: 'asc',
      },
    }))

    if (!error.value && data.value) {
      categories.value = data.value.data || []
      totalCategories.value = data.value.count || 0
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
  } finally {
    loading.value = false
  }
}

const handleAddCategory = () => {
  formMode.value = 'add'
  selectedCategory.value = null
  isFormDialogOpen.value = true
}

const handleEditCategory = category => {
  formMode.value = 'edit'
  selectedCategory.value = { ...category }
  isFormDialogOpen.value = true
}

const handleDeleteCategory = category => {
  selectedCategory.value = category
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedCategory.value) return

  loading.value = true
  const encryptedId = encryptIt(String(selectedCategory.value.id))

  ApiService.delete(`/categories/${encryptedId}`,
    () => {
      isDeleteDialogOpen.value = false
      fetchCategories()
      loading.value = false
    },
    () => {
      loading.value = false
    },
  )
}

const handleFormSubmit = async () => {
  isFormDialogOpen.value = false
  await fetchCategories()
}

watch([paged, itemsPerPage], () => {
  fetchCategories()
})

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchCategories()
}, { debounce: 350 })

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h2 class="text-h4 mb-1">
            Categories
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Manage product categories
          </p>
        </div>
        <VBtn
          v-if="can('CATEGORIES.CREATE')"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleAddCategory"
        >
          Add Category
        </VBtn>
      </div>
    </div>

    <VCard>
      <VCardText>
        <AppTextField
          v-model="searchQuery"
          placeholder="Search by name..."
          density="comfortable"
          prepend-inner-icon="tabler-search"
        />
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="categories"
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
              color="primary"
              size="40"
            >
              <VIcon
                icon="tabler-category"
                size="20"
              />
            </VAvatar>
            <p class="text-body-1 font-weight-medium mb-0">
              {{ item.name }}
            </p>
          </div>
        </template>

        <template #item.is_featured="{ item }">
          <VChip
            :color="item.is_featured ? 'primary' : 'secondary'"
            size="small"
            variant="tonal"
          >
            {{ item.is_featured ? 'Yes' : 'No' }}
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
                v-if="can('CATEGORIES.UPDATE')"
                @click="handleEditCategory(item)"
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
                v-if="can('CATEGORIES.DELETE')"
                @click="handleDeleteCategory(item)"
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
              No categories found
            </p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalCategories"
        noun="categories"
      />
    </VCard>

    <CategoryFormDialog
      v-model:is-open="isFormDialogOpen"
      :mode="formMode"
      :category="selectedCategory"
      @submit="handleFormSubmit"
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
          Are you sure you want to delete category
          <strong>{{ selectedCategory?.name }}</strong>?
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
