<script setup>
import { useApi } from '@/composables/useApi'
import { useCrypto } from '@/composables/useCrypto'
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'
import { onMounted } from 'vue'

const { encryptIt } = useCrypto()
const { can } = usePermission()

definePage({
  meta: {
    title: 'Values',
  },
})

// State
const isLoading = ref(false)
const isSaving = ref(false)
const saveDialog = ref(false)
const createFormDialog = ref(false)
const editFormDialog = ref(false)

// Delete dialogs
const isDeleteValueDialogOpen = ref(false)
const isDeleteValueListDialogOpen = ref(false)
const selectedDeleteValue = ref(null)
const selectedDeleteValueList = ref(null)

// Values (Left side)
const values = ref([])
const count = ref(0)
const selectedRow = ref(null)
const selectedValueId = ref(null)
const selectedValueName = ref('')

// Value Lists (Right side)
const valueLists = ref([])

// Forms
const createForm = ref({
  name: '',
})

const editForm = ref({
  id: null,
  name: '',
})

const errors = ref({
  name: '',
})

// Fetch all values
const getData = async () => {
  isLoading.value = true
  try {
    const { data, error } = await useApi('/values').json()
    if (!error.value && data.value) {
      values.value = data.value.data || []
      count.value = data.value.count || values.value.length
    }
  } catch (err) {
    console.error('Error fetching values:', err)
  } finally {
    isLoading.value = false
  }
}

// Create new value
const saveValue = async () => {
  try {
    isLoading.value = true
    errors.value = {}

    ApiService.post('/values', createForm.value,
      data => {
        isLoading.value = false
        createFormDialog.value = false
        createForm.value = { name: '' }
        getData()
      },
      error => {
        if (error?.data?.errors) {
          errors.value = error.data.errors
        }
        isLoading.value = false
      },
    )
  } catch (e) {
    isLoading.value = false
  }
}

// Get value for editing
const getValue = async valueId => {
  editForm.value = {}
  isLoading.value = true
  try {
    const encryptedId = encryptIt(String(valueId))

    const { data, error } = await useApi(`/values/${encryptedId}`).json()
    if (!error.value && data.value) {
      editForm.value = { ...data.value.data }
      editFormDialog.value = true
    }
  } catch (err) {
    console.error('Error fetching value:', err)
  } finally {
    isLoading.value = false
  }
}

// Update value
const updateValue = async valueId => {
  try {
    isLoading.value = true
    errors.value = {}
    const encryptedId = encryptIt(String(valueId))

    ApiService.patch(`/values/${encryptedId}`, editForm.value,
      data => {
        isLoading.value = false
        editFormDialog.value = false
        getData()

        // Refresh value lists if this value is selected
        if (selectedValueId.value === valueId) {
          getValueListData(valueId, selectedRow.value)
        }
      },
      error => {
        if (error?.data?.errors) {
          errors.value = error.data.errors
        }
        isLoading.value = false
      },
    )
  } catch (e) {
    isLoading.value = false
  }
}

// Delete value - open dialog
const handleDeleteValue = (value, index) => {
  selectedDeleteValue.value = { ...value, index }
  isDeleteValueDialogOpen.value = true
}

// Confirm delete value
const confirmDeleteValue = async () => {
  if (!selectedDeleteValue.value) return

  isLoading.value = true
  const encryptedId = encryptIt(String(selectedDeleteValue.value.id))

  ApiService.delete(`/values/${encryptedId}`,
    () => {
      isLoading.value = false
      isDeleteValueDialogOpen.value = false

      // Clear selection if deleted value was selected
      if (selectedValueId.value === selectedDeleteValue.value.id) {
        selectedValueId.value = null
        selectedValueName.value = ''
        valueLists.value = []
        selectedRow.value = null
      }

      selectedDeleteValue.value = null
      getData()
    },
    error => {
      console.error('Error deleting value:', error)
      isLoading.value = false
    },
  )
}

// Get value lists for a value
const getValueListData = async (valueId, index) => {
  if (selectedRow.value === index) {
    // Toggle: close if already selected
    selectedRow.value = null
    selectedValueId.value = null
    selectedValueName.value = ''
    valueLists.value = []
    
    return
  }

  selectedRow.value = index
  selectedValueId.value = valueId

  try {
    const encryptedId = encryptIt(String(valueId))

    const { data, error } = await useApi(`/values/${encryptedId}/value_lists`).json()
    if (!error.value && data.value) {
      valueLists.value = data.value.data || []

      const selectedValue = values.value.find(v => v.id === valueId)

      selectedValueName.value = selectedValue ? selectedValue.name : ''
    }
  } catch (err) {
    console.error('Error fetching value lists:', err)
  }
}

// Add empty row to value lists
const addEmptyValueList = () => {
  valueLists.value.push({
    value_id: selectedValueId.value,
    description: '',
    code: '',
    is_active: 1,
  })
}

// Save value lists (bulk)
const saveValueLists = async () => {
  if (valueLists.value.length === 0) return

  // Validation
  const hasErrors = valueLists.value.some(vl => !vl.description || !vl.code)
  if (hasErrors) {
    alert('Please fill in all Description and Code fields')
    
    return
  }

  isSaving.value = true

  try {
    const payload = {
      datas: valueLists.value.map(vl => ({
        id: vl.id || undefined,
        value_id: vl.value_id,
        description: vl.description.toUpperCase(),
        code: vl.code.toUpperCase(),
        is_active: vl.is_active,
      })),
    }

    const encryptedId = encryptIt(String(selectedValueId.value))

    ApiService.post(`/values/${encryptedId}/multiple_value_lists`, payload,
      data => {
        valueLists.value = data.data || []
        saveDialog.value = true
        setTimeout(() => {
          saveDialog.value = false
        }, 2500)
        isSaving.value = false
      },
      error => {
        console.error('Error saving value lists:', error)
        isSaving.value = false
      },
    )
  } catch (error) {
    console.error(error)
    isSaving.value = false
  }
}

// Delete value list - open dialog
const handleDeleteValueList = valueList => {
  selectedDeleteValueList.value = { ...valueList }
  isDeleteValueListDialogOpen.value = true
}

// Confirm delete value list
const confirmDeleteValueList = async () => {
  if (!selectedDeleteValueList.value) return

  isLoading.value = true
  const encryptedId = encryptIt(String(selectedDeleteValueList.value.id))

  ApiService.delete(`/value_lists/${encryptedId}`,
    () => {
      isLoading.value = false
      isDeleteValueListDialogOpen.value = false

      // Remove the deleted item from local array instead of reloading
      valueLists.value = valueLists.value.filter(
        vl => vl.id !== selectedDeleteValueList.value.id,
      )

      selectedDeleteValueList.value = null
    },
    error => {
      console.error('Error deleting value list:', error)
      isLoading.value = false
    },
  )
}

// Auto-uppercase for description
const handleDescriptionInput = index => {
  if (valueLists.value[index]?.description) {
    valueLists.value[index].description = valueLists.value[index].description.toUpperCase()
  }
}

// Auto-uppercase for code
const handleCodeInput = index => {
  if (valueLists.value[index]?.code) {
    valueLists.value[index].code = valueLists.value[index].code.toUpperCase()
  }
}

// Initialize
onMounted(() => {
  getData()
})
</script>

<template>
  <div class="values-page-wrapper">
    <VRow class="values-row">
      <!-- Left Side: Values List -->
      <VCol
        xl="5"
        lg="5"
        md="5"
        sm="12"
        cols="12"
        class="d-flex"
      >
        <VCard
          class="values-card d-flex flex-column"
          elevation="6"
        >
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Total Values ({{ count }})</span>
            <VBtn
              v-if="can('VALUES.CREATE')"
              color="primary"
              size="small"
              @click="createFormDialog = true"
            >
              + Add Value
            </VBtn>
          </VCardTitle>

          <VProgressLinear
            v-if="isLoading"
            indeterminate
            color="primary"
          />

          <div class="scrollable-content">
            <VTable
              fixed-header
              class="mx-2"
            >
              <thead>
                <tr>
                  <th class="text-start font-weight-bold">
                    Sr No
                  </th>
                  <th class="text-start font-weight-bold">
                    Name
                  </th>
                  <th
                    class="text-center font-weight-bold"
                    style="min-inline-size: 130px;"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody v-if="values.length > 0">
                <tr
                  v-for="(value, i) in values"
                  :key="`value${i}`"
                >
                  <td style="min-inline-size: 85px;">
  &nbsp;{{ i + 1 }}
                  </td>
                  <td>{{ value.name }}</td>
                  <td class="text-right">
                    <VBtn
                      v-if="can('VALUES.UPDATE')"
                      size="x-small"
                      icon
                      elevation="0"
                      color="primary"
                      @click="getValue(value.id)"
                    >
                      <VIcon size="15">
                        tabler-edit
                      </VIcon>
                    </VBtn>
                    <VBtn
                      class="mx-2"
                      size="x-small"
                      icon
                      elevation="0"
                      :color="selectedRow !== i ? 'primary' : 'success'"
                      @click="getValueListData(value.id, i)"
                    >
                      <VIcon
                        v-if="selectedRow !== i"
                        size="15"
                      >
                        tabler-plus
                      </VIcon>
                      <VIcon
                        v-else
                        size="15"
                      >
                        tabler-x
                      </VIcon>
                    </VBtn>
                    <VBtn
                      v-if="can('VALUES.DELETE')"
                      size="x-small"
                      icon
                      elevation="0"
                      color="error"
                      @click="handleDeleteValue(value, i)"
                    >
                      <VIcon size="15">
                        tabler-trash
                      </VIcon>
                    </VBtn>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td
                    colspan="3"
                    class="text-center"
                  >
                    No data found
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </VCard>
      </VCol>

      <!-- Right Side: Value Lists -->
      <VCol
        xl="7"
        lg="7"
        md="7"
        sm="12"
        cols="12"
        class="d-flex"
      >
        <VCard
          class="values-card d-flex flex-column"
          elevation="6"
        >
          <VCardTitle>Value List of: {{ selectedValueName || '' }}</VCardTitle>

          <div class="scrollable-content">
            <VTable fixed-header>
            <thead>
              <tr>
                <th
                  v-if="!$vuetify.display.smAndDown"
                  class="text-left"
                >
                  Sr No
                </th>
                <th
                  class="text-left"
                  style="min-inline-size: 200px;"
                >
                  Description
                </th>
                <th
                  class="text-left"
                  style="min-inline-size: 200px;"
                >
                  Code
                </th>
                <th class="text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody v-if="selectedValueId != null">
              <tr
                v-for="(valueList, i) in valueLists"
                :key="`valueList${i}`"
                style="block-size: 70px;"
              >
                <td v-if="!$vuetify.display.smAndDown">
                  {{ i + 1 }}
                </td>
                <td>
                  <AppTextField
                    v-model="valueList.description"
                    density="compact"
                    variant="outlined"
                    label="Description"
                    :error-messages="!valueList.description ? 'This description field is required' : ''"
                    hide-details="auto"
                    @input="handleDescriptionInput(i)"
                  />
                </td>
                <td>
                  <AppTextField
                    v-model="valueList.code"
                    density="compact"
                    variant="outlined"
                    label="Code"
                    :error-messages="!valueList.code ? 'This code field is required' : ''"
                    hide-details="auto"
                    @input="handleCodeInput(i)"
                  />
                </td>
                <td class="text-right">
                  <VTooltip location="bottom">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        size="small"
                        color="error"
                        icon
                        @click="handleDeleteValueList(valueList)"
                      >
                        <VIcon>tabler-trash</VIcon>
                      </VBtn>
                    </template>
                    <span>Delete</span>
                  </VTooltip>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td
                  :colspan="$vuetify.display.smAndDown ? 3 : 4"
                  class="text-center"
                >
                  Please Select any value from left
                </td>
              </tr>
            </tbody>
            </VTable>
          </div>

          <!-- Fixed Footer Actions -->
          <div
            v-if="selectedValueId != null"
            class="value-list-actions pa-4"
          >
            <VRow>
              <VCol
                cols="6"
                class="pe-2"
              >
                <VBtn
                  variant="outlined"
                  color="primary"
                  block
                  @click="addEmptyValueList"
                >
                  Add New {{ selectedValueName }}
                </VBtn>
              </VCol>
              <VCol
                cols="6"
                class="ps-2"
              >
                <VBtn
                  variant="elevated"
                  color="primary"
                  block
                  :loading="isSaving"
                  :disabled="isSaving"
                  @click="saveValueLists"
                >
                  Save
                </VBtn>
              </VCol>
            </VRow>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <!-- Create Form Dialog -->
    <VDialog
      v-model="createFormDialog"
      max-width="390"
    >
      <VCard class="px-1">
        <VCardText>
          <label>Name *</label>
          <AppTextField
            v-model="createForm.name"
            variant="outlined"
            placeholder="Enter value name *"
            :error-messages="errors.name"
            @input="createForm.name = createForm.name.toUpperCase()"
          />
          <VBtn
            :loading="isLoading"
            color="primary"
            class="mt-4"
            :disabled="isLoading"
            @click="saveValue"
          >
            Save Value
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Edit Form Dialog -->
    <VDialog
      v-model="editFormDialog"
      max-width="390"
    >
      <VCard class="px-1">
        <VCardText>
          <label>Name *</label>
          <AppTextField
            v-model="editForm.name"
            variant="outlined"
            placeholder="Enter value name *"
            :error-messages="errors.name"
            @input="editForm.name = editForm.name.toUpperCase()"
          />
          <VBtn
            :loading="isLoading"
            color="primary"
            :disabled="isLoading"
            @click="updateValue(editForm.id)"
          >
            Edit Value
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Success Dialog -->
    <VDialog
      v-model="saveDialog"
      width="300"
    >
      <VCard>
        <VCardText class="d-flex flex-column align-center">
          <VIcon
            size="80"
            color="success"
            class="mb-4"
          >
            tabler-circle-check
          </VIcon>
          <span class="text-center">
            New Value List Created Successfully
          </span>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete Value Confirmation Dialog -->
    <VDialog
      v-model="isDeleteValueDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete value
          <strong>{{ selectedDeleteValue?.name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="outlined"
            @click="isDeleteValueDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="isLoading"
            @click="confirmDeleteValue"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Value List Confirmation Dialog -->
    <VDialog
      v-model="isDeleteValueListDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Confirm Delete
        </VCardTitle>
        <VCardText>
          Are you sure you want to delete value list
          <strong>{{ selectedDeleteValueList?.description }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="outlined"
            @click="isDeleteValueListDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="isLoading"
            @click="confirmDeleteValueList"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.values-page-wrapper {
  block-size: calc(100vh - 180px);
  min-block-size: 400px;
  overflow: hidden;
}

.values-row {
  block-size: 100%;
  margin: 0 !important;
}

.values-row > :deep(.v-col) {
  block-size: 100%;
  padding-block: 12px;
}

.values-card {
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
}

.scrollable-content {
  position: relative;
  overflow-y: auto !important;
  overflow-x: hidden;
  flex: 1 1 0;
  min-block-size: 0;
  block-size: 0;
}

.value-list-actions {
  flex-shrink: 0;
  border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.v-table) {
  .v-table__wrapper {
    border-radius: 0;
    max-block-size: none !important;
    overflow: visible !important;
  }
}

@media (max-width: 960px) {
  .values-page-wrapper {
    block-size: auto;
    overflow: visible;
  }

  .values-row > :deep(.v-col) {
    block-size: auto;
  }

  .values-card {
    block-size: auto;
    max-block-size: 500px;
  }

  .scrollable-content {
    max-block-size: 400px;
  }
}
</style>
