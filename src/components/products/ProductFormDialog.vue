<script setup>
import { useApi } from '@/composables/useApi'
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
  product: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isOpen', 'submit', 'created'])

const { encryptIt } = useCrypto()

const loading = ref(false)
const uploadingImages = ref(false)
const formRef = ref(null)
const { errors, setErrors, clearErrors } = useFormErrors(formRef)
const categories = ref([])
const activeTab = ref('basic')
const productImages = ref([])
const fileInput = ref(null)
const loadingMasters = ref(false)
const masters = ref({ wood_types: [], colours: [], fabrics: [], warranties: [] })

const saleTypeOptions = [
  { title: 'Online Buy (fixed price, add to cart)', value: 'online_buy' },
  { title: 'Enquiry Only (custom quote)', value: 'enquiry_only' },
]

const defaultForm = () => ({
  name: '',
  category_id: null,
  short_description: '',
  description: '',
  sale_type: 'online_buy',
  price: 0,
  sale_price: null,
  stock_qty: 0,
  manage_stock: 1,
  length_cm: null,
  width_cm: null,
  height_cm: null,
  weight_kg: null,
  warranty: '',
  is_featured: 0,
  is_active: 1,

  // Drive the storefront filter rail. Sent as value_list ids; the API turns
  // them into product_options rows.
  material_value_list_id: null,
  colour_option_ids: [],
  fabric_option_ids: [],
})

const formData = ref(defaultForm())

const nameRules = [requiredValidator]
const priceRules = [requiredValidator]

const dialogTitle = computed(() => props.mode === 'add' ? 'Add Product' : 'Edit Product')
const submitButtonText = computed(() => props.mode === 'add' ? 'Create Product' : 'Update Product')
const encryptedProductId = computed(() => props.product ? encryptIt(String(props.product.id)) : null)

const fetchCategories = async () => {
  const { data, error } = await useApi(createUrl('/categories', { query: { itemsPerPage: 100 } }))
  if (!error.value && data.value) categories.value = data.value.data || []
}

const fetchMasters = async () => {
  loadingMasters.value = true
  try {
    const { data, error } = await useApi('/products/masters')

    if (!error.value && data.value?.data) masters.value = { ...masters.value, ...data.value.data }
  } finally {
    loadingMasters.value = false
  }
}

/** Pull the ids of one option type off the product's saved options. */
const optionIds = (product, type) =>
  (product.options || [])
    .filter(option => option.option_type === type)
    .map(option => option.value_list_id)

const resetForm = () => {
  formData.value = defaultForm()
  productImages.value = []
  activeTab.value = 'basic'
  clearErrors()
  formRef.value?.reset()
}

const initializeForm = () => {
  if (props.mode === 'edit' && props.product) {
    const p = props.product

    formData.value = {
      name: p.name || '',
      category_id: p.category_id || null,
      short_description: p.short_description || '',
      description: p.description || '',
      sale_type: p.sale_type || 'online_buy',
      price: p.price || 0,
      sale_price: p.sale_price || null,
      stock_qty: p.stock_qty || 0,
      manage_stock: p.manage_stock ? 1 : 0,
      length_cm: p.length_cm || null,
      width_cm: p.width_cm || null,
      height_cm: p.height_cm || null,
      weight_kg: p.weight_kg || null,
      warranty: p.warranty || '',
      is_featured: p.is_featured ? 1 : 0,
      is_active: p.is_active !== undefined ? (p.is_active ? 1 : 0) : 1,
      material_value_list_id: p.material_value_list_id || null,
      colour_option_ids: optionIds(p, 'colour'),
      fabric_option_ids: optionIds(p, 'fabric'),
    }
    productImages.value = p.images || []
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

  const onSuccess = response => {
    // In add mode, keep the dialog open on the Images tab so the owner can upload photos right away
    if (props.mode === 'add' && response?.data?.id) {
      emit('submit')
      emit('created', response.data)
      activeTab.value = 'images'
      loading.value = false

      return
    }
    emit('submit')
    closeDialog()
    loading.value = false
  }

  if (props.mode === 'add') {
    ApiService.post('/products', formData.value, onSuccess, handleError)
  } else {
    ApiService.put(`/products/${encryptedProductId.value}`, formData.value, onSuccess, handleError)
  }
}

const triggerFileInput = () => fileInput.value?.click()

const handleFilesSelected = async event => {
  const files = Array.from(event.target.files || [])
  if (!files.length || !props.product?.id) return

  uploadingImages.value = true

  try {
    // uploadFile sends one file per call, so upload sequentially
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await ApiService.uploadFile(`/products/${encryptedProductId.value}/images`, file)
    }

    const { data } = await useApi(createUrl(`/products/${encryptedProductId.value}`, {}))

    if (data.value?.data?.images) productImages.value = data.value.data.images
  } catch (err) {
    console.error('Image upload failed:', err)
  } finally {
    uploadingImages.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const setPrimaryImage = async image => {
  ApiService.post(`/products/${encryptedProductId.value}/images/${image.id}/primary`, {}, () => {
    productImages.value = productImages.value.map(img => ({ ...img, is_primary: img.id === image.id }))
  })
}

const deleteImage = async image => {
  ApiService.delete(`/products/${encryptedProductId.value}/images/${image.id}`, () => {
    productImages.value = productImages.value.filter(img => img.id !== image.id)
  })
}

watch(() => props.isOpen, newVal => {
  if (newVal) {
    fetchCategories()
    fetchMasters()
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

      <VTabs v-model="activeTab">
        <VTab value="basic">
          Basic
        </VTab>
        <VTab value="pricing">
          Pricing & Stock
        </VTab>
        <VTab value="dimensions">
          Dimensions
        </VTab>
        <VTab value="images">
          Images
        </VTab>
      </VTabs>

      <VDivider />

      <VCardText style="max-block-size: 60vh;">
        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VWindow v-model="activeTab">
            <!-- Basic -->
            <VWindowItem value="basic">
              <VRow>
                <VCol cols="12">
                  <AppTextField
                    v-model="formData.name"
                    label="Product Name"
                    :rules="nameRules"
                    :error-messages="errors.name"
                    required
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="formData.category_id"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="Category"
                    clearable
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="formData.sale_type"
                    :items="saleTypeOptions"
                    item-title="title"
                    item-value="value"
                    label="Sale Type"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="formData.short_description"
                    label="Short Description"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextarea
                    v-model="formData.description"
                    label="Full Description"
                    rows="4"
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
                  />
                  <VSwitch
                    v-model="formData.is_active"
                    :true-value="1"
                    :false-value="0"
                    label="Active"
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Pricing & Stock -->
            <VWindowItem value="pricing">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="formData.price"
                    label="Price (₹)"
                    type="number"
                    :rules="priceRules"
                    :error-messages="errors.price"
                    required
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="formData.sale_price"
                    label="Sale Price (₹, optional)"
                    type="number"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="formData.stock_qty"
                    label="Stock Quantity"
                    type="number"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="formData.manage_stock"
                    :true-value="1"
                    :false-value="0"
                    label="Manage Stock"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="formData.warranty"
                    label="Warranty (e.g. 1 Year)"
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Dimensions -->
            <VWindowItem value="dimensions">
              <VRow>
                <VCol
                  cols="12"
                  md="3"
                >
                  <AppTextField
                    v-model="formData.length_cm"
                    label="Length (cm)"
                    type="number"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="3"
                >
                  <AppTextField
                    v-model="formData.width_cm"
                    label="Width (cm)"
                    type="number"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="3"
                >
                  <AppTextField
                    v-model="formData.height_cm"
                    label="Height (cm)"
                    type="number"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="3"
                >
                  <AppTextField
                    v-model="formData.weight_kg"
                    label="Weight (kg)"
                    type="number"
                  />
                </VCol>

                <!--
                  Material and colour drive the storefront's filter rail
                  (proposal Section 04). Both come from Masters, so the owner
                  can add a new wood or shade without a code change.
                -->
                <VCol cols="12">
                  <VDivider class="mb-4" />
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    Material and colours appear as filters on the website.
                  </p>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="formData.material_value_list_id"
                    :items="masters.wood_types"
                    item-title="description"
                    item-value="id"
                    label="Material / Wood Type"
                    :loading="loadingMasters"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="formData.colour_option_ids"
                    :items="masters.colours"
                    item-title="description"
                    item-value="id"
                    label="Colour Options"
                    :loading="loadingMasters"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="formData.fabric_option_ids"
                    :items="masters.fabrics"
                    item-title="description"
                    item-value="id"
                    label="Fabric Options"
                    :loading="loadingMasters"
                    multiple
                    chips
                    closable-chips
                    clearable
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Images -->
            <VWindowItem value="images">
              <div v-if="!product?.id">
                <VAlert
                  type="info"
                  variant="tonal"
                >
                  Save the product first, then come back here to upload photos.
                </VAlert>
              </div>
              <div v-else>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  @change="handleFilesSelected"
                >
                <VBtn
                  prepend-icon="tabler-upload"
                  :loading="uploadingImages"
                  class="mb-4"
                  @click="triggerFileInput"
                >
                  Upload Photos
                </VBtn>

                <VRow>
                  <VCol
                    v-for="image in productImages"
                    :key="image.id"
                    cols="6"
                    md="3"
                  >
                    <VCard
                      variant="outlined"
                      class="position-relative"
                    >
                      <VImg
                        :src="image.url"
                        height="120"
                        cover
                      />
                      <VCardText class="d-flex align-center justify-space-between pa-2">
                        <VChip
                          v-if="image.is_primary"
                          size="x-small"
                          color="primary"
                        >
                          Main
                        </VChip>
                        <VBtn
                          v-else
                          size="x-small"
                          variant="text"
                          @click="setPrimaryImage(image)"
                        >
                          Set Main
                        </VBtn>
                        <VBtn
                          icon
                          size="x-small"
                          variant="text"
                          color="error"
                          @click="deleteImage(image)"
                        >
                          <VIcon
                            icon="tabler-trash"
                            size="16"
                          />
                        </VBtn>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>

                <VAlert
                  v-if="!productImages.length"
                  type="info"
                  variant="tonal"
                  class="mt-4"
                >
                  No photos uploaded yet.
                </VAlert>
              </div>
            </VWindowItem>
          </VWindow>
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
          Close
        </VBtn>
        <VBtn
          v-if="activeTab !== 'images'"
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
