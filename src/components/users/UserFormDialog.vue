<script setup>
import { useFormErrors } from '@/composables/useFormErrors'
import ApiService from '@/services/api.service'
import { useAuthStore } from '@/stores'

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
  user: {
    type: Object,
    default: null,
  },
  positions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const isPasswordVisible = ref(false)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)
const { encryptIt } = useCrypto()

const formData = ref({
  full_name: '',
  email: '',
  phone: '',
  password: '',
  position_id: null,
  is_active: true,
  role_id: 3,
})

const statusOptions = [
  { title: 'Active', value: 1 },
  { title: 'Inactive', value: 0 },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New User' : 'Edit User'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create User' : 'Update User'
})

const positionOptions = computed(() => {
  return props.positions.map(position => ({
    title: position.name,
    value: position.id,
  }))
})


// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    full_name: '',
    email: '',
    phone: '',
    password: '',
    position_id: null,
    role_id: 3,
    is_active: true,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.user) {
    formData.value = {
      full_name: props.user.full_name || '',
      email: props.user.email || '',
      phone: props.user.phone ? String(props.user.phone) : '',
      password: '', // Don't populate password for edit
      position_id: props.user.position_id || null,
      is_active: props.user.is_active ?? true,
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

  // Remove empty password for edit mode
  if (props.mode === 'edit' && !payload.password) {
    delete payload.password
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
    ApiService.post('/users', payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  } else {
    // PATCH request
    ApiService.patch(`/users/${encryptIt(String(props.user.id))}`, payload,
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
            <!-- Full Name Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.full_name"
                label="Full Name"
                placeholder="Enter full name"
                :rules="[requiredValidator]"
                :error-messages="errors.full_name"
                required
              />
            </VCol>

            <!-- Phone Field -->
            <VCol cols="12">
              <AppPhoneInput
                v-model="formData.phone"
                label="User Mobile Number"
                placeholder="Enter User Mobile Number"
                :rules="[requiredValidator]"
                :error-messages="errors.phone"
                required
              />
            </VCol>

            <!-- Email Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.email"
                label="Email"
                type="email"
                placeholder="user@example.com"
                :rules="[emailValidator]"
                :error-messages="errors.email"
                required
              />
            </VCol>

            <!-- Password Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.password"
                label="Password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="Enter password"
                :rules="mode === 'add' ? [requiredValidator] : []"
                :error-messages="errors.password"
                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                :hint="mode === 'edit' ? 'Leave blank to keep current password' : ''"
                persistent-hint
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>

            <!-- Position Field -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.position_id"
                label="Position"
                :items="positionOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.position_id"
                placeholder="Select position"
                required
              />
            </VCol>

            <!-- Status Field -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set user account status
                  </p>
                </div>
                <VSwitch
                  v-model="formData.is_active"
                  :true-value="true"
                  :false-value="false"
                  color="success"
                  hide-details
                >
                  <template #label>
                    <span :class="formData.is_active ? 'text-success' : 'text-error'">
                      {{ formData.is_active ? 'Active' : 'Inactive' }}
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
