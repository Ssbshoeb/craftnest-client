<script setup>
import { useCrypto } from '@/composables/useCrypto'
import { useFormErrors } from '@/composables/useFormErrors'
import ApiService from '@/services/api.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    required: true,
    validator: value => ['add', 'edit'].includes(value),
  },
  category: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

const { encryptIt } = useCrypto()

const loading = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

const formData = ref({
  name: '',
  sort_order: 0,
  is_featured: 1,
  is_active: 1,
})

const nameRules = [requiredValidator]

const dialogTitle = computed(() => props.mode === 'add' ? 'Add Category' : 'Edit Category')
const submitButtonText = computed(() => props.mode === 'add' ? 'Create Category' : 'Update Category')

const resetForm = () => {
  formData.value = {
    name: '',
    sort_order: 0,
    is_featured: 1,
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.category) {
    formData.value = {
      name: props.category.name || '',
      sort_order: props.category.sort_order ?? 0,
      is_featured: props.category.is_featured ? 1 : 0,
      is_active: props.category.is_active !== undefined ? (props.category.is_active ? 1 : 0) : 1,
    }
  } else {
    resetForm()
  }
}

const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  clearErrors()

  const handleError = error => {
    if (error?.data?.errors) setErrors(error.data.errors)
    loading.value = false
  }

  const onSuccess = () => {
    emit('submit')
    closeDialog()
    loading.value = false
  }

  if (props.mode === 'add') {
    ApiService.post('/categories', formData.value, onSuccess, handleError)
  } else {
    const encryptedId = encryptIt(String(props.category.id))

    ApiService.put(`/categories/${encryptedId}`, formData.value, onSuccess, handleError)
  }
}

watch(() => props.isOpen, newVal => {
  if (newVal) initializeForm()
})
</script>

<template>
  <VDialog
    :model-value="isOpen"
    max-width="600"
    persistent
    @update:model-value="closeDialog"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">{{ dialogTitle }}</span>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="closeDialog"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Category Name"
                placeholder="e.g. Sofa"
                :rules="nameRules"
                :error-messages="errors.name"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="formData.sort_order"
                label="Sort Order"
                type="number"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
              class="d-flex align-center gap-4"
            >
              <VSwitch
                v-model="formData.is_featured"
                :true-value="1"
                :false-value="0"
                label="Featured"
                hide-details
              />
              <VSwitch
                v-model="formData.is_active"
                :true-value="1"
                :false-value="0"
                label="Active"
                hide-details
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeDialog"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
