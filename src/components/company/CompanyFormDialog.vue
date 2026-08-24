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
  company: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

const { mediaUrl, getMediaPath } = useMedia()

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)
const { encryptIt } = useCrypto()

const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  logo_path: '',
  is_active: 1,
})

const statusOptions = [
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Company' : 'Edit Company'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Company' : 'Update Company'
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    logo_path: '',
    is_active: 1,
  }
  companyImage.value = null
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.company) {
    formData.value = {
      name: props.company.name || '',
      email: props.company.email || '',
      phone: props.company.phone ? String(props.company.phone) : '',
      address: props.company.address || '',
      logo_path: props.company.logo_path || '',
      is_active: props.company.is_active !== undefined ? props.company.is_active : 1,
    }
    companyImage.value = null
  } else {
    resetForm()
  }
}


const companyImage = ref(null)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  clearErrors()

  const payload = { ...formData.value }

  // Remove empty logo field if not provided
  if (!payload.logo_path) {
    delete payload.logo_path
  }

  const handleError = error => {
    console.error('Form submission error:', error)
    if (error?.data?.errors) {
      setErrors(error.data.errors)
    }
    loading.value = false
  }

  if (props.mode === 'add') {
    // POST request
    ApiService.post('/companies', payload,
      async data => {
        if (companyImage.value) {
          await ApiService.upload(`/companies/${data.id}/logo`, companyImage.value, () => { }, handleError)
        }
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  } else {
    // PATCH request
    ApiService.patch(`/companies/${encryptIt(String(props.company.id))}`, payload,
      async data => {
        if (companyImage.value) {
          await ApiService.upload(`/companies/${props.company.id}/logo`, companyImage.value, () => { }, handleError)
        }
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
    max-width="700"
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
            <!-- Company Name Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Company Name"
                placeholder="Enter company name"
                :rules="[requiredValidator]"
                :error-messages="errors.name"
                required
              />
            </VCol>

            <!-- Email Field -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="formData.email"
                label="Email"
                type="email"
                placeholder="company@example.com"
                :rules="[emailValidator]"
                :error-messages="errors.email"
                required
              />
            </VCol>

            <!-- Phone Field -->
            <VCol
              cols="12"
              md="6"
            >
              <AppPhoneInput
                v-model="formData.phone"
                label="Company Phone Number"
                placeholder="Enter Company Phone Number"
                :rules="[requiredValidator]"
                :error-messages="errors.phone"
                required
              />
            </VCol>

            <!-- Address Field -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.address"
                label="Address"
                placeholder="Enter company address"
                :rows="3"
                :error-messages="errors.address"
              />
            </VCol>

            <!-- Logo Upload Field (Optional) -->
            <VCol cols="12">
              <!-- Show existing logo if available -->
              <div
                v-if="formData.logo_path && !companyImage"
                class="mb-4"
              >
                <label class="text-body-2 font-weight-medium mb-2 d-block">Current Logo</label>
                <VAvatar
                  size="100"
                  rounded
                >
                  <VImg
                    :src="mediaUrl + formData.logo_path"
                    cover
                  />
                </VAvatar>
              </div>

              <VFileInput
                v-model="companyImage"
                label="Upload Logo"
                prepend-icon="tabler-file-import"
                accept="image/*"
                :error-messages="errors.logo_path"
                :hint="formData.logo_path && !companyImage ? 'Upload a new logo to replace the current one' : ''"
                persistent-hint
              />
            </VCol>

            <!-- Status Field -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set company status
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
