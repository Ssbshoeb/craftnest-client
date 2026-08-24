<script setup>
import { useCrypto } from '@/composables/useCrypto'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  mode: { type: String, required: true, validator: v => ['add', 'edit'].includes(v) },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:isOpen', 'submit'])
const { encryptIt } = useCrypto()

const loading = ref(false)
const imageFile = ref(null)

const groupOptions = [
  { title: 'Factory', value: 'factory' },
  { title: 'Workshop', value: 'workshop' },
  { title: 'Delivered Projects', value: 'delivered' },
]

const defaultForm = () => ({ title: '', group: 'workshop', sort_order: 0, is_active: 1 })
const formData = ref(defaultForm())

const dialogTitle = computed(() => props.mode === 'add' ? 'Add Gallery Photo' : 'Edit Gallery Photo')

const resetForm = () => {
  formData.value = defaultForm()
  imageFile.value = null
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.item) {
    formData.value = {
      title: props.item.title || '',
      group: props.item.group || 'workshop',
      sort_order: props.item.sort_order ?? 0,
      is_active: props.item.is_active ? 1 : 0,
    }
  } else {
    resetForm()
  }
}

const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const handleFileChange = e => {
  imageFile.value = e.target.files?.[0] || null
}

const handleSubmit = () => {
  loading.value = true

  const payload = new FormData()

  Object.entries(formData.value).forEach(([key, value]) => payload.append(key, value))
  if (imageFile.value) payload.append('image', imageFile.value)

  const onSuccess = () => {
    emit('submit')
    closeDialog()
    loading.value = false
  }

  const onError = () => { loading.value = false }

  if (props.mode === 'add') {
    ApiService.postFormData('/gallery_items', payload, onSuccess, onError)
  } else {
    const encryptedId = encryptIt(String(props.item.id))

    ApiService.postFormData(`/gallery_items/${encryptedId}/update`, payload, onSuccess, onError)
  }
}

watch(() => props.isOpen, newVal => {
  if (newVal) initializeForm()
})
</script>

<template>
  <VDialog :model-value="isOpen" max-width="500" persistent @update:model-value="closeDialog">
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn icon variant="text" size="small" @click="closeDialog">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VRow>
          <VCol cols="12">
            <AppTextField v-model="formData.title" label="Title (optional)" />
          </VCol>
          <VCol cols="12">
            <label class="text-body-2">Photo</label>
            <input type="file" accept="image/*" class="d-block mt-1" @change="handleFileChange">
            <VImg v-if="item?.image_url" :src="item.image_url" height="100" class="mt-2 rounded" />
          </VCol>
          <VCol cols="12" md="6">
            <AppSelect v-model="formData.group" :items="groupOptions" item-title="title" item-value="value" label="Group" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="formData.sort_order" label="Sort Order" type="number" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="outlined" @click="closeDialog">Cancel</VBtn>
        <VBtn color="primary" :loading="loading" @click="handleSubmit">Save</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
