<script setup>
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api.service'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/learning.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  login_id: '',
  password: '',
  remember: false,
})

// Forgot Password states
const showForgotPassword = ref(false)
const forgotPasswordStep = ref(1) // 1: Email, 2: OTP, 3: Reset Password

const forgotPasswordForm = ref({
  email: '',
  otp: '',
  password: '',
  password_confirmation: '',
  soft_password: '',
})

const isPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await authStore.logIn({
      login_id: form.value.login_id,
      password: form.value.password,
    })

    console.log('login data', data)

    if (!error && data) {
      router.push('/')
    } else {
      errorMessage.value = error?.data?.message || error?.message || 'Login failed. Please try again.'
    }
  } catch (err) {
    errorMessage.value = 'An error occurred. Please try again.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const toggleForgotPassword = () => {
  showForgotPassword.value = !showForgotPassword.value
  errorMessage.value = ''
  successMessage.value = ''
  forgotPasswordStep.value = 1
  forgotPasswordForm.value = {
    email: '',
    otp: '',
    password: '',
    password_confirmation: '',
    soft_password: '',
  }
}

// Step 1: Send OTP to email
const sendOTP = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    email: forgotPasswordForm.value.email,
  }

  ApiService.post('/forgot_password', payload,
    data => {
      successMessage.value = 'OTP has been sent to your email!'
      forgotPasswordStep.value = 2
      loading.value = false
    },
    error => {
      errorMessage.value = error?.data?.message || 'Failed to send OTP'
      loading.value = false
    },
  )
}

// Step 2: Verify OTP
const verifyOTP = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    email: forgotPasswordForm.value.email,
    otp: forgotPasswordForm.value.otp,
  }

  ApiService.post('/forgot_password', payload,
    data => {
      successMessage.value = 'OTP verified successfully!'
      forgotPasswordStep.value = 3
      loading.value = false
    },
    error => {
      errorMessage.value = error?.data?.message || 'Invalid OTP'
      loading.value = false
    },
  )
}

// Step 3: Reset Password
const resetPassword = async () => {
  if (forgotPasswordForm.value.password !== forgotPasswordForm.value.password_confirmation) {
    errorMessage.value = 'Passwords do not match'
    
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    email: forgotPasswordForm.value.email,
    password: forgotPasswordForm.value.password,
    password_confirmation: forgotPasswordForm.value.password_confirmation,
    soft_password: forgotPasswordForm.value.soft_password || forgotPasswordForm.value.password,
  }

  ApiService.post('/forgot_password', payload,
    data => {
      successMessage.value = 'Password reset successfully! You can now login.'
      setTimeout(() => {
        toggleForgotPassword()
      }, 2000)
      loading.value = false
    },
    error => {
      errorMessage.value = error?.data?.message || 'Failed to reset password'
      loading.value = false
    },
  )
}
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h2 class="auth-title">
        {{ themeConfig.app.title }}
      </h2>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            max-width="613"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <img
          class="auth-footer-mask flip-in-rtl"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            <span v-if="!showForgotPassword">Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻</span>
            <span v-else>Forgot Password? 🔐</span>
          </h4>
          <p class="mb-0">
            <span v-if="!showForgotPassword">Please sign-in to your account and start the adventure</span>
            <span v-else-if="forgotPasswordStep === 1">Enter your email to receive an OTP</span>
            <span v-else-if="forgotPasswordStep === 2">Enter the OTP sent to your email</span>
            <span v-else>Enter your new password</span>
          </p>
        </VCardText>
        <VCardText>
          <!-- LOGIN FORM -->
          <VForm
            v-if="!showForgotPassword"
            @submit.prevent="handleLogin"
          >
            <VRow>
              <!-- login_id -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.login_id"
                  autofocus
                  label="Email or Phone"
                  type="text"
                  placeholder="email@example.com or 9876543210"
                  :disabled="loading"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :disabled="loading"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <!-- error message -->
                <VAlert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mt-4"
                >
                  {{ errorMessage }}
                </VAlert>

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                    :disabled="loading"
                  />
                  <a
                    class="text-primary"
                    href="javascript:void(0)"
                    @click="toggleForgotPassword"
                  >
                    Forgot Password?
                  </a>
                </div>

                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block">
                  New on our platform?
                </span>
                <a
                  class="text-primary ms-1 d-inline-block text-body-1"
                  href="javascript:void(0)"
                >
                  Create an account
                </a>
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>

          <!-- FORGOT PASSWORD FORM -->
          <VForm
            v-else
            @submit.prevent="forgotPasswordStep === 1 ? sendOTP() : forgotPasswordStep === 2 ? verifyOTP() : resetPassword()"
          >
            <VRow>
              <!-- Step 1: Email -->
              <VCol
                v-if="forgotPasswordStep === 1"
                cols="12"
              >
                <AppTextField
                  v-model="forgotPasswordForm.email"
                  autofocus
                  label="Email"
                  type="email"
                  placeholder="johndoe@email.com"
                  :disabled="loading"
                  :rules="[requiredValidator, emailValidator]"
                />
              </VCol>

              <!-- Step 2: OTP -->
              <VCol
                v-if="forgotPasswordStep === 2"
                cols="12"
              >
                <AppTextField
                  v-model="forgotPasswordForm.otp"
                  autofocus
                  label="OTP"
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  :disabled="loading"
                  maxlength="4"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <!-- Step 3: New Password -->
              <template v-if="forgotPasswordStep === 3">
                <VCol cols="12">
                  <AppTextField
                    v-model="forgotPasswordForm.password"
                    label="New Password"
                    placeholder="············"
                    :type="isNewPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                    :disabled="loading"
                    :rules="[requiredValidator]"
                    @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="forgotPasswordForm.password_confirmation"
                    label="Confirm Password"
                    placeholder="············"
                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                    :disabled="loading"
                    :rules="[requiredValidator]"
                    @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  />
                </VCol>
              </template>

              <!-- Success/Error Messages -->
              <VCol
                v-if="successMessage"
                cols="12"
              >
                <VAlert
                  type="success"
                  variant="tonal"
                >
                  {{ successMessage }}
                </VAlert>
              </VCol>

              <VCol
                v-if="errorMessage"
                cols="12"
              >
                <VAlert
                  type="error"
                  variant="tonal"
                >
                  {{ errorMessage }}
                </VAlert>
              </VCol>

              <!-- Submit Button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                >
                  <span v-if="forgotPasswordStep === 1">Send OTP</span>
                  <span v-else-if="forgotPasswordStep === 2">Verify OTP</span>
                  <span v-else>Reset Password</span>
                </VBtn>
              </VCol>

              <!-- Back to Login -->
              <VCol
                cols="12"
                class="text-center"
              >
                <a
                  class="text-primary d-inline-block"
                  href="javascript:void(0)"
                  @click="toggleForgotPassword"
                >
                  ← Back to Login
                </a>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
