<script setup>
import { useAuthStore } from '@/stores/auth'
import { useCrypto } from '@/composables/useCrypto'
import ApiService from '@/services/api.service'
import avatar1 from '@images/avatars/avatar-1.png'

const authStore = useAuthStore()
const { encryptIt } = useCrypto()

// Profile dialog state
const isProfileDialogOpen = ref(false)
const isEditing = ref(false)
const isLoading = ref(false)
const imagePreview = ref(null)
const imageFile = ref(null)
const fileInput = ref(null)

// Form data
const profileForm = ref({
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
})

const errors = ref({})

const handleLogout = () => {
  authStore.logOut()
  window.location.reload()
}

const openProfileDialog = () => {
  // Reset to view mode and load current user data
  isEditing.value = false
  errors.value = {}
  profileForm.value = {
    full_name: authStore.user?.full_name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    password: '',
    confirm_password: '',
  }
  imagePreview.value = authStore.user?.profile_image_path || null
  imageFile.value = null
  isProfileDialogOpen.value = true
}

const startEditing = () => {
  isEditing.value = true
  errors.value = {}
}

const cancelEditing = () => {
  isEditing.value = false
  errors.value = {}
  profileForm.value = {
    full_name: authStore.user?.full_name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    password: '',
    confirm_password: '',
  }
  imagePreview.value = authStore.user?.profile_image_path || null
  imageFile.value = null
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleImageChange = event => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = e => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const uploadProfileImage = () => {
  return new Promise((resolve, reject) => {
    if (!imageFile.value) {
      resolve(null)

      return
    }

    const formData = new FormData()
    formData.append('id', authStore.user.id)
    formData.append('profile_image_path', imageFile.value)

    ApiService.postFormData('/users/upload_image', formData,
      response => {
        resolve(response.data?.profile_image_path || null)
      },
      error => {
        console.error('Error uploading image:', error)
        reject(error)
      },
    )
  })
}

const saveProfile = async () => {
  errors.value = {}

  // Validate password match
  if (profileForm.value.password && profileForm.value.password !== profileForm.value.confirm_password) {
    errors.value.confirm_password = 'Passwords do not match'

    return
  }

  isLoading.value = true

  try {
    // Upload image first if selected
    if (imageFile.value) {
      const imagePath = await uploadProfileImage()
      if (imagePath) {
        authStore.user = { ...authStore.user, profile_image_path: imagePath }
      }
    }

    // Update profile data
    const encryptedId = encryptIt(String(authStore.user.id))

    const payload = {
      full_name: profileForm.value.full_name,
      email: profileForm.value.email,
      phone: profileForm.value.phone,
    }

    // Only include password if provided
    if (profileForm.value.password) {
      payload.password = profileForm.value.password
    }

    ApiService.patch(`/users/${encryptedId}`, payload,
      response => {
        // Update auth store with new data
        if (response.data) {
          authStore.user = { ...authStore.user, ...response.data }
        }
        isEditing.value = false
        isLoading.value = false
        profileForm.value.password = ''
        profileForm.value.confirm_password = ''
      },
      error => {
        console.error('Error updating profile:', error)
        if (error?.data?.errors) {
          errors.value = error.data.errors
        }
        isLoading.value = false
      },
    )
  } catch (error) {
    console.error('Error updating profile:', error)
    isLoading.value = false
  }
}

const displayImage = computed(() => {
  // Use imagePreview if set (for dialog), otherwise use authStore user image
  const imagePath = imagePreview.value || authStore.user?.profile_image_path

  if (imagePath) {
    // Check if it's a data URL (local preview)
    if (imagePath.startsWith('data:')) {
      return imagePath
    }
    // Check if it's already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    // Construct full URL for remote images from Vultr storage
    const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || ''

    return `${mediaBaseUrl}${imagePath}`
  }

  return avatar1
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg :src="displayImage" />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="displayImage" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ authStore.user?.full_name || 'John Doe' }}
            </VListItemTitle>
            <VListItemSubtitle>{{ authStore.roleName || 'Admin' }}</VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- 👉 Profile -->
          <VListItem
            link
            @click="openProfileDialog"
          >
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-user"
                size="22"
              />
            </template>

            <VListItemTitle>Profile</VListItemTitle>
          </VListItem>

          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="handleLogout">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>

            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>

  <!-- Profile Dialog -->
  <VDialog
    v-model="isProfileDialogOpen"
    max-width="500"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <span class="text-h5">My Profile</span>
        <VBtn
          v-if="!isEditing"
          icon
          size="small"
          variant="text"
          @click="startEditing"
        >
          <VIcon icon="tabler-edit" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Avatar Section -->
        <div class="d-flex flex-column align-center mb-6">
          <div class="position-relative">
            <VAvatar
              size="100"
              color="primary"
              variant="tonal"
            >
              <VImg :src="displayImage" />
            </VAvatar>
            <VBtn
              v-if="isEditing"
              icon
              size="small"
              color="primary"
              class="avatar-edit-btn"
              @click="triggerFileInput"
            >
              <VIcon
                icon="tabler-camera"
                size="18"
              />
            </VBtn>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              hidden
              @change="handleImageChange"
            >
          </div>
          <h4 class="text-h5 mt-3 mb-1">
            {{ authStore.user?.full_name || 'John Doe' }}
          </h4>
          <VChip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ authStore.roleName || 'Admin' }}
          </VChip>
        </div>

        <!-- View Mode -->
        <VList
          v-if="!isEditing"
          class="card-list"
        >
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-mail"
                class="me-2"
              />
            </template>
            <VListItemTitle>Email</VListItemTitle>
            <VListItemSubtitle>{{ authStore.user?.email || 'N/A' }}</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-phone"
                class="me-2"
              />
            </template>
            <VListItemTitle>Phone</VListItemTitle>
            <VListItemSubtitle>{{ authStore.user?.phone || 'N/A' }}</VListItemSubtitle>
          </VListItem>
        </VList>

        <!-- Edit Mode -->
        <VForm
          v-else
          @submit.prevent="saveProfile"
        >
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="profileForm.full_name"
                label="Full Name"
                placeholder="Enter your full name"
                :error-messages="errors.full_name"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="profileForm.email"
                label="Email"
                placeholder="Enter your email"
                type="email"
                :error-messages="errors.email"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="profileForm.phone"
                label="Phone"
                placeholder="Enter your phone number"
                :error-messages="errors.phone"
              />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-2" />
              <p class="text-body-2 text-medium-emphasis mb-0">
                Change Password (leave blank to keep current)
              </p>
            </VCol>

            <VCol cols="12">
              <AppTextField
                v-model="profileForm.password"
                label="New Password"
                placeholder="Enter new password"
                :type="isPasswordVisible ? 'text' : 'password'"
                :error-messages="errors.password"
                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="profileForm.confirm_password"
                label="Confirm Password"
                placeholder="Confirm new password"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                :error-messages="errors.confirm_password"
                :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <template v-if="isEditing">
          <VBtn
            color="secondary"
            variant="outlined"
            @click="cancelEditing"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            :loading="isLoading"
            @click="saveProfile"
          >
            Save
          </VBtn>
        </template>
        <VBtn
          v-else
          color="primary"
          variant="elevated"
          @click="isProfileDialogOpen = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.position-relative {
  position: relative;
}

.avatar-edit-btn {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
}
</style>
