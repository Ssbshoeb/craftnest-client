<script setup>
import { useFormErrors } from '@/composables/useFormErrors'
import { useCrypto } from '@/composables/useCrypto'
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
  notification: {
    type: Object,
    default: null,
  },
  users: {
    type: Array,
    default: () => [],
  },
  roles: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

const { encryptIt } = useCrypto()

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

const formData = ref({
  title: '',
  body: '',
  type: 'general',
  target_type: 'all',
  target_ids: [],
  is_active: 1,
})

// Options
const typeOptions = [
  { title: 'General', value: 'general' },
  { title: 'Alert', value: 'alert' },
  { title: 'Reminder', value: 'reminder' },
  { title: 'Promotional', value: 'promotional' },
  { title: 'System', value: 'system' },
]

const targetTypeOptions = [
  { title: 'All Users', value: 'all' },
  { title: 'Specific Users', value: 'user' },
  { title: 'By Role', value: 'role' },
]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Send New Notification' : 'Edit Notification'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Send Notification' : 'Update Notification'
})

const showTargetSelect = computed(() => {
  return formData.value.target_type !== 'all'
})

const targetSelectLabel = computed(() => {
  if (formData.value.target_type === 'user') return 'Select Users'
  if (formData.value.target_type === 'role') return 'Select Roles'

  return 'Select Targets'
})

const targetSelectOptions = computed(() => {
  if (formData.value.target_type === 'user') {
    return props.users.map(user => ({
      title: user.full_name || user.email,
      value: user.id,
    }))
  }
  if (formData.value.target_type === 'role') {
    return props.roles.map(role => ({
      title: role.name,
      value: role.id,
    }))
  }

  return []
})

// Methods
const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    title: '',
    body: '',
    type: 'general',
    target_type: 'all',
    target_ids: [],
    is_active: 1,
  }
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.notification) {
    formData.value = {
      title: props.notification.title || '',
      body: props.notification.body || '',
      type: props.notification.type || 'general',
      target_type: props.notification.target_type || 'all',
      target_ids: props.notification.target_ids || [],
      is_active: props.notification.is_active !== undefined ? props.notification.is_active : 1,
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

  // Only include target_ids if not targeting all
  if (payload.target_type === 'all') {
    delete payload.target_ids
  }

  const handleError = error => {
    console.error('Form submission error:', error)
    if (error?.data?.errors) {
      setErrors(error.data.errors)
    }
    loading.value = false
  }

  if (props.mode === 'add') {
    ApiService.post('/notifications', payload,
      () => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  } else {
    ApiService.patch(`/notifications/${encryptIt(String(props.notification.id))}`, payload,
      () => {
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

watch(() => formData.value.target_type, () => {
  // Reset target_ids when target_type changes
  formData.value.target_ids = []
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
            <!-- Title Field -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.title"
                label="Title"
                placeholder="Enter notification title"
                :rules="[requiredValidator]"
                :error-messages="errors.title"
                required
              />
            </VCol>

            <!-- Body Field -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.body"
                label="Body"
                placeholder="Enter notification message"
                rows="3"
                :error-messages="errors.body"
              />
            </VCol>

            <!-- Type Dropdown -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="formData.type"
                label="Type"
                :items="typeOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.type"
                required
              />
            </VCol>

            <!-- Target Type Dropdown -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="formData.target_type"
                label="Target Audience"
                :items="targetTypeOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.target_type"
                required
              />
            </VCol>

            <!-- Target Selection (Users/Roles) -->
            <VCol
              v-if="showTargetSelect"
              cols="12"
            >
              <AppSelect
                v-model="formData.target_ids"
                :label="targetSelectLabel"
                :items="targetSelectOptions"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
                :error-messages="errors.target_ids"
                multiple
                chips
                closable-chips
                required
              />
            </VCol>

            <!-- Status Switch -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set notification status
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
