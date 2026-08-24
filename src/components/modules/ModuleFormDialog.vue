<script setup>
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
  module: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)
const { encryptIt } = useCrypto()

const formData = ref({
  name: '',
  is_active: 1,
})

const statusOptions = [
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Module' : 'Edit Module'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Module' : 'Update Module'
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.module) {
    formData.value = {
      name: props.module.name || '',
      is_active: props.module.is_active !== undefined ? props.module.is_active : 1,
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  clearErrors()

  const payload = { ...formData.value }

  const handleError = error => {
    console.error('Form submission error:', error)
    if (error?.data?.errors) {
      setErrors(error.data.errors)
    }
    loading.value = false
  }

  if (props.mode === 'add') {
    // POST - Create
    ApiService.post('/modules', payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  } else {
    // PATCH - Update
    ApiService.patch(`/modules/${encryptIt(String(props.module.id))}`, payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  }
}

// Watchers
watch(() => props.isOpen, newVal => {
  if (newVal) {
    initializeForm()
  }
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
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <!-- Name Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Module Name"
                placeholder="Enter module name"
                :rules="[requiredValidator]"
                :error-messages="errors.name"
                required
              />
            </VCol>

            <!-- Status Switch -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set module status
                  </p>
                </div>
                <VSwitch
                  v-model="formData.is_active"
                  :true-value="1"
                  :false-value="0"
                  color="success"
                  hide-details
                >
                  <template #label>
                    <span :class="formData.is_active === 1 ? 'text-success' : 'text-error'">
                      {{ formData.is_active === 1 ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                </VSwitch>
              </div>
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
