<script setup>
import { usePermission } from '@/composables/usePermission'
import ApiService from '@/services/api.service'

const { can } = usePermission()

definePage({
  meta: {
    title: 'Settings',
  },
})

const loading = ref(false)
const saving = ref(false)

const form = ref({
  shop: {
    shop_name: '',
    shop_tagline: '',
    shop_address: '',
    working_hours: '',
  },
  contact: {
    phone: '',
    whatsapp_number: '',
    email: '',
    map_embed_url: '',
  },
  social: {
    facebook_url: '',
    instagram_url: '',
  },
  commerce: {
    delivery_charge: 0,
    free_delivery_above: 0,
    cod_enabled: true,
    online_payment_enabled: false,
  },
})

const fetchSettings = () => {
  loading.value = true
  ApiService.get('/settings',
    response => {
      const data = response?.data || {}

      for (const group of Object.keys(form.value)) {
        if (data[group]) {
          form.value[group] = { ...form.value[group], ...data[group] }
        }
      }
      loading.value = false
    },
    () => {
      loading.value = false
    },
  )
}

const saveSettings = () => {
  saving.value = true

  const flatSettings = {
    ...form.value.shop,
    ...form.value.contact,
    ...form.value.social,
    ...form.value.commerce,
  }

  ApiService.put('/settings', { settings: flatSettings },
    () => {
      saving.value = false
    },
    () => {
      saving.value = false
    },
  )
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Settings
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Shop details, contact info and commerce options
      </p>
    </div>

    <VForm @submit.prevent="saveSettings">
      <VRow>
        <!-- Shop -->
        <VCol cols="12">
          <VCard title="Shop">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.shop.shop_name"
                    label="Shop Name"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.shop.shop_tagline"
                    label="Tagline"
                    :disabled="loading"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextarea
                    v-model="form.shop.shop_address"
                    label="Address"
                    rows="2"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.shop.working_hours"
                    label="Working Hours"
                    :disabled="loading"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Contact -->
        <VCol cols="12">
          <VCard title="Contact">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.contact.phone"
                    label="Phone"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.contact.whatsapp_number"
                    label="WhatsApp Number"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.contact.email"
                    label="Email"
                    :disabled="loading"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="form.contact.map_embed_url"
                    label="Google Maps Embed URL"
                    :disabled="loading"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Social -->
        <VCol cols="12">
          <VCard title="Social Links">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.social.facebook_url"
                    label="Facebook URL"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.social.instagram_url"
                    label="Instagram URL"
                    :disabled="loading"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Commerce -->
        <VCol cols="12">
          <VCard title="Commerce">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.commerce.delivery_charge"
                    label="Delivery Charge (₹)"
                    type="number"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.commerce.free_delivery_above"
                    label="Free Delivery Above (₹)"
                    type="number"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="form.commerce.cod_enabled"
                    label="Cash on Delivery Enabled"
                    :disabled="loading"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="form.commerce.online_payment_enabled"
                    label="Online Payment Enabled"
                    :disabled="loading"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          class="d-flex justify-end"
        >
          <VBtn
            v-if="can('SETTINGS.UPDATE')"
            type="submit"
            color="primary"
            :loading="saving"
            :disabled="loading"
          >
            Save Settings
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>
