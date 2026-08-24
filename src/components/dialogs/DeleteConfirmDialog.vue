<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Delete Confirmation',
  },
  message: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:isOpen', 'confirm', 'cancel'])

const closeDialog = () => {
  emit('update:isOpen', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <VDialog
    :model-value="isOpen"
    max-width="500"
    persistent
    @update:model-value="closeDialog"
  >
    <VCard>
      <VCardText class="text-center pt-8 pb-6">
        <VIcon
          icon="tabler-trash"
          size="64"
          color="error"
          class="mb-4"
        />

        <h2 class="text-h5 mb-2">
          {{ title }}
        </h2>

        <p class="text-body-1 text-medium-emphasis mb-2">
          {{ message }}
        </p>

        <p
          v-if="itemName"
          class="text-body-1 font-weight-bold text-error"
        >
          {{ itemName }}
        </p>

        <p class="text-caption text-disabled mt-4">
          This action cannot be undone.
        </p>
      </VCardText>

      <VCardActions class="pb-6 px-6">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="loading"
          @click="closeDialog"
        >
          {{ cancelText }}
        </VBtn>
        <VBtn
          color="error"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
