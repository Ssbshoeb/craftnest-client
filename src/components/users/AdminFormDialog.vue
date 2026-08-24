<script setup>
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
  admin: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)

const formData = ref({
  name: '',
  email: '',
  password: '',
  status: 'active',
})

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

// Validation rules
const nameRules = [
  v => !!v || 'Name is required',
  v => (v && v.length >= 3) || 'Name must be at least 3 characters',
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.[^\n\r@\u2028\u2029]*@.+\..+/.test(v) || 'Email must be valid',
]

const passwordRules = computed(() => {
  if (props.mode === 'add') {
    return [
      v => !!v || 'Password is required',
      v => (v && v.length >= 6) || 'Password must be at least 6 characters',
    ]
  }
  
  return [
    v => !v || v.length >= 6 || 'Password must be at least 6 characters',
  ]
})

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Admin' : 'Edit Admin'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Admin' : 'Update Admin'
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
    password: '',
    status: 'active',
  }
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.admin) {
    formData.value = {
      name: props.admin.name || '',
      email: props.admin.email || '',
      password: '', // Don't populate password for edit
      status: props.admin.status || 'active',
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true

  const payload = { ...formData.value }

  // Remove empty password for edit mode
  if (props.mode === 'edit' && !payload.password) {
    delete payload.password
  }

  if (props.mode === 'add') {
    // POST request
    ApiService.post('/admins', payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      error => {
        console.error('Form submission error:', error)
        loading.value = false
      },
    )
  } else {
    // PUT request
    ApiService.put(`/admins/${props.admin.id}`, payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      error => {
        console.error('Form submission error:', error)
        loading.value = false
      },
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
                label="Name"
                placeholder="Enter admin name"
                :rules="nameRules"
                required
              />
            </VCol>

            <!-- Email Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.email"
                label="Email"
                type="email"
                placeholder="admin@example.com"
                :rules="emailRules"
                required
              />
            </VCol>

            <!-- Password Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.password"
                label="Password"
                type="password"
                :placeholder="mode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'"
                :rules="passwordRules"
                :hint="mode === 'edit' ? 'Leave blank to keep current password' : ''"
                persistent-hint
              />
            </VCol>

            <!-- Status Field -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set admin account status
                  </p>
                </div>
                <VSwitch
                  v-model="formData.status"
                  true-value="active"
                  false-value="inactive"
                  color="success"
                  hide-details
                >
                  <template #label>
                    <span :class="formData.status === 'active' ? 'text-success' : 'text-error'">
                      {{ formData.status === 'active' ? 'Active' : 'Inactive' }}
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
