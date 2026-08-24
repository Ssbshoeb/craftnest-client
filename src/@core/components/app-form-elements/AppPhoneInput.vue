<script setup>
defineOptions({
  name: 'AppPhoneInput',
  inheritAttrs: false,
})

const elementId = computed(() => {
  const attrs = useAttrs()
  const _elementIdToken = attrs.id || attrs.label

  return _elementIdToken ? `app-phone-input-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}` : undefined
})

const isRequired = computed(() => useAttrs().required !== undefined && useAttrs().required !== false && useAttrs().required !== 0)


const label = computed(() => useAttrs().label)
</script>

<template>
  <div
    class="app-text-field flex-grow-1"
    :class="$attrs.class"
  >
    <VLabel
      v-if="label"
      :for="elementId"
      class="mb-1 text-body-2 text-high-emphasis"
      :text="label"
    >
      <span
        v-if="isRequired"
        class="text-error"
      >*</span>
    </VLabel>
    <VPhoneInput
      v-bind="{
        ...$attrs,
        class: null,
        label: $attrs.label,
        variant: 'outlined',
        id: elementId,
      }"
    >
      <template #label />
    </VPhoneInput>
  </div>
</template>

<style>
.v-phone-input .v-phone-input__country__input.v-input .v-field.v-field--variant-outlined {
  --v-input-chips-margin-top: 0px !important;
  --v-input-chips-margin-bottom: 0px !important;
}
</style>
