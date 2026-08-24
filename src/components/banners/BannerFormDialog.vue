<script setup>
import { useCrypto } from '@/composables/useCrypto'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  mode: { type: String, required: true, validator: v => ['add', 'edit'].includes(v) },
  banner: { type: Object, default: null },
})

const emit = defineEmits(['update:isOpen', 'submit'])
const { encryptIt } = useCrypto()

const loading = ref(false)
const formRef = ref(null)
const imageFile = ref(null)

const placementOptions = [
  { title: 'Home Slider', value: 'home_slider' },
  { title: 'Offer Strip', value: 'offer_strip' },
]

const defaultForm = () => ({
  title: '',
  subtitle: '',
  link_url: '',
  placement: 'home_slider',
  sort_order: 0,
  starts_at: null,
  ends_at: null,
  is_active: 1,
})

const formData = ref(defaultForm())

const dialogTitle = computed(() => props.mode === 'add' ? 'Add Banner' : 'Edit Banner')

const resetForm = () => {
  formData.value = defaultForm()
  imageFile.value = null
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.banner) {
    formData.value = {
      title: props.banner.title || '',
      subtitle: props.banner.subtitle || '',
      link_url: props.banner.link_url || '',
      placement: props.banner.placement || 'home_slider',
      sort_order: props.banner.sort_order ?? 0,
      starts_at: props.banner.starts_at,
      ends_at: props.banner.ends_at,
      is_active: props.banner.is_active ? 1 : 0,
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

  Object.entries(formData.value).forEach(([key, value]) => {
    if (value !== null && value !== undefined) payload.append(key, value)
  })
  if (imageFile.value) payload.append('image', imageFile.value)

  const onSuccess = () => {
    emit('submit')
    closeDialog()
    loading.value = false
  }

  const onError = () => {
    loading.value = false
  }

  if (props.mode === 'add') {
    ApiService.postFormData('/banners', payload, onSuccess, onError)
  } else {
    const encryptedId = encryptIt(String(props.banner.id))

    ApiService.postFormData(`/banners/${encryptedId}/update`, payload, onSuccess, onError)
  }
}

watch(() => props.isOpen, newVal => {
  if (newVal) initializeForm()
})
</script>

<template>
  <VDialog :model-value="isOpen" max-width="600" persistent @update:model-value="closeDialog">
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn icon variant="text" size="small" @click="closeDialog">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VForm ref="formRef" @submit.prevent="handleSubmit">
          <VRow>
            <VCol cols="12">
              <AppTextField v-model="formData.title" label="Title" required />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="formData.subtitle" label="Subtitle" />
            </VCol>
            <VCol cols="12">
              <label class="text-body-2">Banner Image</label>
              <input type="file" accept="image/*" class="d-block mt-1" @change="handleFileChange">
              <VImg v-if="banner?.image_url" :src="banner.image_url" height="100" class="mt-2 rounded" />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect v-model="formData.placement" :items="placementOptions" item-title="title" item-value="value" label="Placement" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="formData.sort_order" label="Sort Order" type="number" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="formData.link_url" label="Link URL (optional)" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="formData.starts_at" label="Starts On" type="date" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="formData.ends_at" label="Ends On" type="date" />
            </VCol>
            <VCol cols="12">
              <VSwitch v-model="formData.is_active" :true-value="1" :false-value="0" label="Active" />
            </VCol>
          </VRow>
        </VForm>
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
