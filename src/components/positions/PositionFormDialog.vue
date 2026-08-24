<script setup>
import { useApi } from '@/composables/useApi'
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
  position: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit'])

// State
const loading = ref(false)
const formValid = ref(false)
const formRef = ref(null)
const permissions = ref([])
const loadingPermissions = ref(false)
const selectedPermissions = ref([])
const { errors, setErrors, clearErrors } = useFormErrors(formRef)

const formData = ref({
  name: '',
  role_id: 3,
  is_active: 1,
  position_permissions: [],
})

// Validation rules
const nameRules = [requiredValidator]

// Computed
const dialogTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Position' : 'Edit Position'
})

const submitButtonText = computed(() => {
  return props.mode === 'add' ? 'Create Position' : 'Update Position'
})

// Group permissions by module
const permissionsByModule = computed(() => {
  const grouped = {}

  permissions.value.forEach(permission => {
    const moduleName = permission.module?.name || 'Other'
    if (!grouped[moduleName]) {
      grouped[moduleName] = []
    }
    grouped[moduleName].push(permission)
  })
  
  return grouped
})

// Methods
const fetchPermissions = async () => {
  loadingPermissions.value = true
  try {
    const { data, error } = await useApi('/permissions').json()
    if (!error.value && data.value) {
      permissions.value = data.value.data || data.value
    }
  } catch (err) {
    console.error('Error fetching permissions:', err)
  } finally {
    loadingPermissions.value = false
  }
}

const isPermissionSelected = permissionId => {
  return selectedPermissions.value.includes(permissionId)
}

const togglePermission = permissionId => {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (index > -1) {
    selectedPermissions.value.splice(index, 1)
  } else {
    selectedPermissions.value.push(permissionId)
  }
}

const toggleModulePermissions = (modulePermissions, value) => {
  modulePermissions.forEach(permission => {
    const index = selectedPermissions.value.indexOf(permission.id)
    if (value && index === -1) {
      selectedPermissions.value.push(permission.id)
    } else if (!value && index > -1) {
      selectedPermissions.value.splice(index, 1)
    }
  })
}

const isModuleFullySelected = modulePermissions => {
  return modulePermissions.every(p => selectedPermissions.value.includes(p.id))
}

const isModulePartiallySelected = modulePermissions => {
  const selected = modulePermissions.filter(p => selectedPermissions.value.includes(p.id))
  
  return selected.length > 0 && selected.length < modulePermissions.length
}

const closeDialog = () => {
  emit('update:isOpen', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    role_id: 3,
    is_active: 1,
    position_permissions: [],
  }
  selectedPermissions.value = []
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.position) {
    formData.value = {
      name: props.position.name || '',
      role_id: props.position.role_id || 3,
      is_active: props.position.is_active !== undefined ? props.position.is_active : 1,
      position_permissions: [],
    }

    // Set selected permissions from position_permissions
    if (props.position.position_permissions && Array.isArray(props.position.position_permissions)) {
      selectedPermissions.value = props.position.position_permissions.map(pp => pp.permission_id)
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

  // Transform selected permissions to position_permissions format
  const position_permissions = selectedPermissions.value.map(permissionId => {
    // Find existing position_permission for edit mode
    const existing = props.position?.position_permissions?.find(pp => pp.permission_id === permissionId)
    
    return {
      id: existing?.id || null,
      permission_id: permissionId,
      is_active: 1,
    }
  })

  const payload = {
    ...formData.value,
    position_permissions,
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
    ApiService.post('/positions', payload,
      data => {
        emit('submit')
        closeDialog()
        loading.value = false
      },
      handleError,
    )
  } else {
    // POST request (using store method for updates)
    payload.id = props.position.id
    ApiService.post('/positions', payload,
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
    fetchPermissions()
    initializeForm()
  }
})
</script>

<template>
  <VDialog
    :model-value="isOpen"
    max-width="900"
    persistent
    scrollable
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

      <VCardText style="max-block-size: 70vh;">
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
                label="Position Name"
                placeholder="Enter position name"
                :rules="nameRules"
                :error-messages="errors.name"
                required
              />
            </VCol>

            <!-- Status Field -->
            <VCol cols="12">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <label class="text-body-1 font-weight-medium">Status</label>
                  <p class="text-caption text-disabled mb-0">
                    Set position status
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

            <!-- Permissions Section -->
            <VCol cols="12">
              <VDivider class="my-4" />

              <div class="mb-4">
                <h3 class="text-h6 mb-1">
                  Permissions
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Select permissions for this position
                </p>
              </div>

              <VProgressLinear
                v-if="loadingPermissions"
                indeterminate
                color="primary"
                class="mb-4"
              />

              <!-- Permission Modules -->
              <VRow v-if="!loadingPermissions">
                <VCol
                  v-for="(modulePermissions, moduleName) in permissionsByModule"
                  :key="moduleName"
                  cols="12"
                  md="6"
                >
                  <VCard
                    variant="outlined"
                    class="permission-card"
                  >
                    <VCardText>
                      <!-- Module Header -->
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div class="d-flex align-center gap-2">
                          <VAvatar
                            color="primary"
                            size="32"
                            variant="tonal"
                          >
                            <VIcon
                              icon="tabler-folder"
                              size="18"
                            />
                          </VAvatar>
                          <h4 class="text-body-1 font-weight-semibold">
                            {{ moduleName }}
                          </h4>
                        </div>

                        <VCheckbox
                          :model-value="isModuleFullySelected(modulePermissions)"
                          :indeterminate="isModulePartiallySelected(modulePermissions)"
                          color="primary"
                          hide-details
                          @update:model-value="toggleModulePermissions(modulePermissions, $event)"
                        >
                          <template #label>
                            <span class="text-caption">All</span>
                          </template>
                        </VCheckbox>
                      </div>

                      <!-- Permission Checkboxes -->
                      <VRow dense>
                        <VCol
                          v-for="permission in modulePermissions"
                          :key="permission.id"
                          cols="12"
                        >
                          <VCheckbox
                            :model-value="isPermissionSelected(permission.id)"
                            color="primary"
                            density="compact"
                            hide-details
                            @update:model-value="togglePermission(permission.id)"
                          >
                            <template #label>
                              <span class="text-body-2">{{ permission.name }}</span>
                            </template>
                          </VCheckbox>
                        </VCol>
                      </VRow>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>

              <VAlert
                v-if="!loadingPermissions && Object.keys(permissionsByModule).length === 0"
                type="info"
                variant="tonal"
                class="mt-4"
              >
                No permissions available
              </VAlert>
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

<style scoped>
.permission-card {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.permission-card:hover {
  box-shadow: 0 4px 8px rgba(var(--v-theme-on-surface), 0.08);
}
</style>
