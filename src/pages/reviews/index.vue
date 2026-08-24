<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Reviews',
  },
})

const searchQuery = ref('')
const reviews = ref([])
const loading = ref(false)
const totalReviews = ref(0)
const paged = ref(1)
const itemsPerPage = ref(10)

const headers = [
  { title: 'Product', key: 'product', sortable: false },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Rating', key: 'rating', sortable: false },
  { title: 'Comment', key: 'comment', sortable: false },
  { title: 'Status', key: 'is_approved', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '140px' },
]

const fetchReviews = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/reviews', {
      query: {
        paged: paged.value,
        itemsPerPage: itemsPerPage.value,
        keyword: searchQuery.value,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    }))

    if (!error.value && data.value) {
      reviews.value = data.value.data || []
      totalReviews.value = data.value.count || 0
    }
  } finally {
    loading.value = false
  }
}

const toggleApproval = (review, approve) => {
  const encryptedId = encryptIt(String(review.id))

  ApiService.put(`/reviews/${encryptedId}`, { is_approved: approve }, () => fetchReviews())
}

const deleteReview = review => {
  const encryptedId = encryptIt(String(review.id))

  ApiService.delete(`/reviews/${encryptedId}`, () => fetchReviews())
}

watch([paged, itemsPerPage], () => fetchReviews())

watchDebounced(searchQuery, () => {
  paged.value = 1
  fetchReviews()
}, { debounce: 350 })

onMounted(() => fetchReviews())
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Reviews
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Approve or reject customer reviews before they go live
      </p>
    </div>

    <VCard>
      <VCardText>
        <AppTextField
          v-model="searchQuery"
          placeholder="Search by name or comment..."
          density="comfortable"
          prepend-inner-icon="tabler-search"
        />
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <VDataTable
        :headers="headers"
        :items="reviews"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template #item.product="{ item }">
          {{ item.product?.name || '—' }}
        </template>

        <template #item.rating="{ item }">
          <span class="text-warning">{{ '★'.repeat(item.rating) }}{{ '☆'.repeat(5 - item.rating) }}</span>
        </template>

        <template #item.comment="{ item }">
          <span class="text-truncate d-inline-block" style="max-inline-size: 250px;">{{ item.comment }}</span>
        </template>

        <template #item.is_approved="{ item }">
          <VChip :color="item.is_approved ? 'success' : 'warning'" size="small" variant="tonal">
            {{ item.is_approved ? 'Approved' : 'Pending' }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            v-if="can('REVIEWS.UPDATE') && !item.is_approved"
            icon
            size="small"
            variant="text"
            color="success"
            @click="toggleApproval(item, true)"
          >
            <VIcon icon="tabler-check" size="20" />
          </VBtn>
          <VBtn
            v-if="can('REVIEWS.UPDATE') && item.is_approved"
            icon
            size="small"
            variant="text"
            @click="toggleApproval(item, false)"
          >
            <VIcon icon="tabler-eye-off" size="20" />
          </VBtn>
          <VBtn
            v-if="can('REVIEWS.DELETE')"
            icon
            size="small"
            variant="text"
            color="error"
            @click="deleteReview(item)"
          >
            <VIcon icon="tabler-trash" size="20" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon size="48" icon="tabler-star-off" class="mb-4" />
            <p class="text-body-1 text-medium-emphasis">No reviews yet</p>
          </div>
        </template>
      </VDataTable>

      <TablePagination
        v-model:page="paged"
        v-model:items-per-page="itemsPerPage"
        :total="totalReviews"
        noun="reviews"
      />
    </VCard>
  </div>
</template>
