export function useFormErrors(formRef) {
  const errors = ref({})

  const setErrors = apiErrors => {
    errors.value = apiErrors || {}
  }

  const clearErrors = () => {
    errors.value = {}

    // Reset VForm validation if ref provided
    if (formRef?.value) {
      formRef.value.resetValidation()
    }
  }

  const clearError = field => {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  const getError = field => {
    return errors.value[field]
  }

  const hasError = field => {
    return errors.value[field] && errors.value[field].length > 0
  }

  return {
    errors,
    setErrors,
    clearErrors,
    clearError,
    getError,
    hasError,
  }
}
