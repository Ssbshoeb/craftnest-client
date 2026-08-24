<script setup>
import { useApi } from '@/composables/useApi'
import { hexToRgb } from '@core/utils/colorConverter'
import ApiService from '@/services/api.service'
import { useTheme } from 'vuetify'

definePage({
  meta: { title: 'Reports' },
})

const vuetifyTheme = useTheme()

const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const from = ref(startOfMonth.toISOString().slice(0, 10))
const to = ref(new Date().toISOString().slice(0, 10))
const loading = ref(false)
const report = ref(null)

const rupees = value => `₹${Number(value || 0).toLocaleString('en-IN')}`

const headers = [
  { title: 'Product', key: 'product_name', sortable: false },
  { title: 'Units sold', key: 'total_qty', sortable: false, align: 'end' },
  { title: 'Revenue', key: 'total_revenue', sortable: false, align: 'end' },
]

const presets = [
  { label: 'This month', from: () => startOfMonth, to: () => new Date() },
  { label: 'Last 30 days', from: () => new Date(Date.now() - 29 * 864e5), to: () => new Date() },
  { label: 'Last 90 days', from: () => new Date(Date.now() - 89 * 864e5), to: () => new Date() },
]

const applyPreset = preset => {
  from.value = preset.from().toISOString().slice(0, 10)
  to.value = preset.to().toISOString().slice(0, 10)
  fetchReport()
}

const topProducts = computed(() => report.value?.best_selling_products ?? [])

const averageOrder = computed(() => {
  const r = report.value

  if (!r || !r.order_count) return 0

  return r.sales_total / r.order_count
})

/*
 * One colour for every bar.
 *
 * The first version stepped a light-to-dark ramp by rank, which was wrong on
 * two counts: bar length already encodes the magnitude, so colour repeated it
 * for nothing, and the pale end of the ramp fell to 1.25:1 against the card —
 * a bar you cannot see. Sequential ramps belong where colour itself carries
 * the value (heatmaps), not on bars.
 */
const barSeries = computed(() => [{
  name: 'Units sold',
  data: topProducts.value.map(p => Number(p.total_qty)),
}])

const barOptions = computed(() => {
  const theme = vuetifyTheme.current.value.colors
  const muted = vuetifyTheme.current.value.variables['medium-emphasis-opacity']

  // hexToRgb: Vuetify returns hex, rgba() needs channels. See dashboard.
  const onSurface = hexToRgb(theme['on-surface'])
  const ink = `rgba(${ onSurface }, ${ muted })`

  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeout', speed: 650 },
      fontFamily: 'inherit',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '62%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    colors: [theme.primary],
    legend: { show: false }, // one series, so the title and axis carry identity
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 8,
      style: { fontSize: '11px', fontWeight: 500, colors: [`rgba(${ onSurface }, 0.9)`] },
      formatter: value => `${value}`,
    },
    grid: {
      borderColor: `rgba(${ onSurface }, 0.1)`,
      strokeDashArray: 4,
      yaxis: { lines: { show: false } },
      padding: { left: 8, right: 16 },
    },
    xaxis: {
      categories: topProducts.value.map(p => p.product_name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: ink, fontSize: '11px' } },
    },
    yaxis: {
      labels: { style: { colors: ink, fontSize: '12px' }, maxWidth: 220 },
    },
    tooltip: {
      y: {
        formatter: (value, ctx) => {
          const row = topProducts.value[ctx.dataPointIndex]

          return `${value} units · ${rupees(row?.total_revenue)}`
        },
      },
    },
  }
})

const fetchReport = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi(createUrl('/reports/summary', {
      query: { from: from.value, to: to.value },
    }))

    if (!error.value && data.value) report.value = data.value.data
  } finally {
    loading.value = false
  }
}

const exportCsv = () => {
  ApiService.download(
    createUrl('/reports/export_orders', { query: { from: from.value, to: to.value } }),
    'orders_report.csv',
  )
}

onMounted(() => fetchReport())
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Reports
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Sales, best sellers and how many enquiries turned into work
      </p>
    </div>

    <!-- Filters, in one row above the charts -->
    <VCard class="mb-6">
      <VCardText>
        <VRow align="end">
          <VCol cols="12" md="3">
            <AppTextField v-model="from" label="From" type="date" />
          </VCol>
          <VCol cols="12" md="3">
            <AppTextField v-model="to" label="To" type="date" />
          </VCol>
          <VCol cols="12" md="6" class="d-flex flex-wrap align-center gap-2">
            <VBtn color="primary" :loading="loading" @click="fetchReport">Apply</VBtn>
            <VBtn
              v-for="preset in presets"
              :key="preset.label"
              variant="tonal"
              size="small"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </VBtn>
            <VBtn
              variant="text"
              size="small"
              prepend-icon="tabler-file-export"
              class="ms-auto"
              @click="exportCsv"
            >
              Export CSV
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <template v-if="report">
      <!-- Headline numbers. Hero figures, not charts — a single value does not
           need a plot to be understood. -->
      <VRow>
        <VCol cols="12" md="3" class="stagger" :style="{ '--i': 0 }">
          <VCard class="h-100">
            <VCardText>
              <p class="text-caption text-medium-emphasis mb-1">Sales total</p>
              <p class="text-h4 mb-0">{{ rupees(report.sales_total) }}</p>
              <p class="text-caption text-medium-emphasis mb-0 mt-1">
                excludes cancelled orders
              </p>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3" class="stagger" :style="{ '--i': 1 }">
          <VCard class="h-100">
            <VCardText>
              <p class="text-caption text-medium-emphasis mb-1">Orders</p>
              <p class="text-h4 mb-0">{{ report.order_count }}</p>
              <p class="text-caption text-medium-emphasis mb-0 mt-1">in this period</p>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3" class="stagger" :style="{ '--i': 2 }">
          <VCard class="h-100">
            <VCardText>
              <p class="text-caption text-medium-emphasis mb-1">Average order</p>
              <p class="text-h4 mb-0">{{ rupees(Math.round(averageOrder)) }}</p>
              <p class="text-caption text-medium-emphasis mb-0 mt-1">sales ÷ orders</p>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3" class="stagger" :style="{ '--i': 3 }">
          <VCard class="h-100">
            <VCardText>
              <p class="text-caption text-medium-emphasis mb-1">Enquiries won</p>
              <p class="text-h4 mb-0">{{ report.enquiry_conversion_rate }}%</p>
              <!-- A share of a whole: a meter reads it faster than a pie. -->
              <VProgressLinear
                :model-value="report.enquiry_conversion_rate"
                color="primary"
                height="6"
                rounded
                class="mt-2"
              />
              <p class="text-caption text-medium-emphasis mb-0 mt-1">
                {{ report.enquiries_won }} won of {{ report.enquiries_total }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Best sellers -->
      <VRow class="mt-2">
        <VCol cols="12" class="stagger" :style="{ '--i': 4 }">
          <VCard>
            <VCardItem>
              <VCardTitle>Best-selling products</VCardTitle>
              <VCardSubtitle>By units sold, {{ report.from }} to {{ report.to }}</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts
                v-if="topProducts.length"
                type="bar"
                :height="Math.max(200, topProducts.length * 46 + 60)"
                :options="barOptions"
                :series="barSeries"
              />
              <p v-else class="text-medium-emphasis text-center py-8 mb-0">
                No sales in this period.
              </p>
            </VCardText>

            <!-- The same data as a table, for anyone who needs the exact figures. -->
            <template v-if="topProducts.length">
              <VDivider />
              <VDataTable
                :headers="headers"
                :items="topProducts"
                hide-default-footer
                :items-per-page="-1"
                density="comfortable"
              >
                <template #item.total_revenue="{ item }">
                  {{ rupees(item.total_revenue) }}
                </template>
              </VDataTable>
            </template>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <VCard v-else-if="loading">
      <VCardText>
        <VSkeletonLoader type="article" />
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.stagger {
  animation: rise 0.4s cubic-bezier(0.16, 0.84, 0.3, 1) backwards;
  animation-delay: calc(var(--i, 0) * 45ms);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stagger {
    animation: none;
  }
}
</style>
