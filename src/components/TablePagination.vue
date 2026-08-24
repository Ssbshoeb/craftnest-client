<script setup>
/**
 * The pagination footer every list screen shares.
 *
 * The panel's tables previously offered only Previous / Next, which tells the
 * owner nothing about where they are or how much is left. This adds the range
 * and the total — the two facts you actually want when working through a list
 * of orders — and keeps the controls identical on every screen.
 */
const props = defineProps({
  page: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  total: { type: Number, default: 0 },
  /** Word for the rows, used in the summary line. */
  noun: { type: String, default: 'results' },
})

const emit = defineEmits(['update:page', 'update:itemsPerPage'])

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.itemsPerPage)))

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.itemsPerPage + 1))
const to = computed(() => Math.min(props.page * props.itemsPerPage, props.total))

const perPage = computed({
  get: () => props.itemsPerPage,
  set: value => {
    // Changing the page size while deep in a list can land you past the end.
    emit('update:itemsPerPage', value)
    emit('update:page', 1)
  },
})
</script>

<template>
  <div>
    <VDivider />
    <VCardText>
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div class="d-flex align-center gap-2">
          <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
          <AppSelect
            v-model="perPage"
            :items="[10, 25, 50, 100]"
            density="compact"
            variant="outlined"
            style="max-inline-size: 84px; min-inline-size: 84px;"
          />
        </div>

        <div class="d-flex align-center gap-4">
          <span class="text-body-2 text-medium-emphasis">
            <template v-if="total">Showing {{ from }}–{{ to }} of {{ total }} {{ noun }}</template>
            <template v-else>No {{ noun }}</template>
          </span>

          <div class="d-flex align-center gap-1">
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="page <= 1"
              aria-label="Previous page"
              @click="emit('update:page', page - 1)"
            >
              <VIcon icon="tabler-chevron-left" size="20" />
            </VBtn>
            <span class="text-body-2 px-2">{{ page }} / {{ lastPage }}</span>
            <VBtn
              icon
              variant="text"
              size="small"
              :disabled="page >= lastPage"
              aria-label="Next page"
              @click="emit('update:page', page + 1)"
            >
              <VIcon icon="tabler-chevron-right" size="20" />
            </VBtn>
          </div>
        </div>
      </div>
    </VCardText>
  </div>
</template>
