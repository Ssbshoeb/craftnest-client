<script setup>
import { useApi } from '@/composables/useApi'
import { hexToRgb } from '@core/utils/colorConverter'
import { useTheme } from 'vuetify'

definePage({
  meta: {
    title: 'Dashboard',
  },
})

const vuetifyTheme = useTheme()

const loading = ref(true)
const stats = ref({
  orders_today: 0, total_orders: 0, total_products: 0, total_customers: 0, revenue_this_month: 0,
})
const attention = ref({
  orders_pending: 0, enquiries_new: 0, reviews_pending: 0, messages_unread: 0, out_of_stock: 0,
})
const recentOrders = ref([])
const recentEnquiries = ref([])
const revenueChart = ref([])

const STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'info' },
  in_production: { label: 'In Production', color: 'primary' },
  shipped: { label: 'Shipped', color: 'secondary' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
}

const rupees = value => `₹${Number(value || 0).toLocaleString('en-IN')}`

/*
 * Work waiting on the owner, ordered by how much it costs to ignore.
 * A zero here is good news, so it is rendered quiet rather than loud — only
 * counts above zero get emphasis and a colour.
 */
const attentionTiles = computed(() => [
  { key: 'orders_pending', label: 'Orders to process', icon: 'tabler-package', to: '/orders' },
  { key: 'enquiries_new', label: 'Enquiries to quote', icon: 'tabler-message-dots', to: '/custom-enquiries' },
  { key: 'messages_unread', label: 'Unread messages', icon: 'tabler-mail', to: '/contact-messages' },
  { key: 'reviews_pending', label: 'Reviews to approve', icon: 'tabler-star', to: '/reviews' },
  { key: 'out_of_stock', label: 'Out of stock', icon: 'tabler-alert-triangle', to: '/products' },
].map(tile => ({ ...tile, count: attention.value[tile.key] ?? 0 })))

const totals = computed(() => [
  { label: 'Orders today', value: stats.value.orders_today, icon: 'tabler-shopping-cart' },
  { label: 'Total orders', value: stats.value.total_orders, icon: 'tabler-receipt' },
  { label: 'Customers', value: stats.value.total_customers, icon: 'tabler-users' },
  { label: 'Active products', value: stats.value.total_products, icon: 'tabler-armchair' },
])

/*
 * Revenue trend. One series, so no legend — the card title names it.
 * Thin stroke, recessive grid, and a soft fill so the shape reads without the
 * chart shouting over the numbers beside it.
 */
const chartSeries = computed(() => [{
  name: 'Revenue',
  data: revenueChart.value.map(point => Number(point.total)),
}])

const chartOptions = computed(() => {
  const theme = vuetifyTheme.current.value.colors
  const muted = vuetifyTheme.current.value.variables['medium-emphasis-opacity']

  // Vuetify hands back hex; rgba() needs the channels. Without hexToRgb these
  // strings are invalid CSS and ApexCharts silently drops the grid and labels.
  const onSurface = hexToRgb(theme['on-surface'])
  const mutedInk = `rgba(${ onSurface }, ${ muted })`
  const gridInk = `rgba(${ onSurface }, 0.1)`

  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      animations: { enabled: true, easing: 'easeout', speed: 700 },
      fontFamily: 'inherit',
    },
    colors: [theme.primary],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 0.6, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 95] },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridInk,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      padding: { top: -8, left: 8, right: 8 },
    },
    xaxis: {
      categories: revenueChart.value.map(point => point.date),
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: mutedInk, fontSize: '11px' },
        format: 'dd MMM',
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: mutedInk, fontSize: '11px' },
        formatter: value => (value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`),
      },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: { formatter: value => rupees(value) },
    },
    markers: { size: 0, hover: { size: 5 } },
  }
})

const fetchDashboard = async () => {
  loading.value = true
  try {
    const { data, error } = await useApi('/dashboard')

    if (!error.value && data.value?.data) {
      const d = data.value.data

      stats.value = d.stats
      attention.value = d.attention ?? attention.value
      recentOrders.value = d.recent_orders || []
      recentEnquiries.value = d.recent_enquiries || []
      revenueChart.value = d.revenue_chart || []
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchDashboard())
</script>

<template>
  <div class="dashboard">
    <div class="mb-6">
      <h2 class="text-h4 mb-1">
        Dashboard
      </h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        What needs you today, and how the month is going
      </p>
    </div>

    <!-- Work waiting. First, because this is what the panel is opened for. -->
    <p class="text-overline text-medium-emphasis mb-3">
      Needs you today
    </p>
    <VRow class="mb-2">
      <VCol
        v-for="(tile, index) in attentionTiles"
        :key="tile.key"
        cols="6"
        md="4"
        lg="2"
        class="stagger"
        :style="{ '--i': index }"
      >
        <VCard
          :to="tile.to"
          class="attention-tile h-100"
          :class="{ 'attention-tile--idle': tile.count === 0 }"
          variant="outlined"
        >
          <VCardText class="d-flex flex-column h-100 pa-4">
            <VIcon
              :icon="tile.icon"
              size="20"
              :color="tile.count > 0 ? 'primary' : undefined"
              :class="tile.count === 0 ? 'text-disabled' : ''"
            />
            <span
              class="text-h4 mt-3 font-weight-medium"
              :class="tile.count === 0 ? 'text-disabled' : ''"
            >{{ tile.count }}</span>
            <span class="text-caption text-medium-emphasis mt-1">{{ tile.label }}</span>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-2">
      <!-- Revenue trend -->
      <VCol cols="12" lg="8" class="stagger" :style="{ '--i': 5 }">
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Revenue, last 14 days</VCardTitle>
            <template #append>
              <div class="text-end">
                <p class="text-h5 mb-0">{{ rupees(stats.revenue_this_month) }}</p>
                <p class="text-caption text-medium-emphasis mb-0">this month</p>
              </div>
            </template>
          </VCardItem>
          <VCardText>
            <VueApexCharts
              v-if="revenueChart.length"
              type="area"
              height="260"
              :options="chartOptions"
              :series="chartSeries"
            />
            <VSkeletonLoader v-else type="image" height="260" />
            <p class="text-caption text-medium-emphasis mb-0 mt-2">
              Every order except cancelled ones, on the day it was placed.
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Totals, deliberately quieter than the attention row -->
      <VCol cols="12" lg="4" class="stagger" :style="{ '--i': 6 }">
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>At a glance</VCardTitle>
          </VCardItem>
          <VCardText>
            <div
              v-for="total in totals"
              :key="total.label"
              class="d-flex align-center justify-space-between py-3 border-b"
            >
              <div class="d-flex align-center gap-3">
                <VAvatar size="34" variant="tonal" color="primary" rounded>
                  <VIcon :icon="total.icon" size="18" />
                </VAvatar>
                <span class="text-body-2">{{ total.label }}</span>
              </div>
              <span class="text-h6 mb-0">{{ total.value }}</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-2">
      <VCol cols="12" md="6" class="stagger" :style="{ '--i': 7 }">
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Recent orders</VCardTitle>
            <template #append>
              <VBtn variant="text" size="small" to="/orders">View all</VBtn>
            </template>
          </VCardItem>
          <VDivider />
          <VList v-if="recentOrders.length" lines="two" class="py-0">
            <VListItem
              v-for="order in recentOrders"
              :key="order.id"
              :to="'/orders'"
            >
              <VListItemTitle class="font-weight-medium">
                {{ order.order_no }}
              </VListItemTitle>
              <VListItemSubtitle>
                {{ order.customer?.full_name || '—' }} · {{ rupees(order.total) }}
              </VListItemSubtitle>
              <template #append>
                <VChip :color="STATUS[order.status]?.color" size="small" variant="tonal">
                  {{ STATUS[order.status]?.label || order.status }}
                </VChip>
              </template>
            </VListItem>
          </VList>
          <VCardText v-else class="text-medium-emphasis">
            No orders yet.
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="6" class="stagger" :style="{ '--i': 8 }">
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Recent enquiries</VCardTitle>
            <template #append>
              <VBtn variant="text" size="small" to="/custom-enquiries">View all</VBtn>
            </template>
          </VCardItem>
          <VDivider />
          <VList v-if="recentEnquiries.length" lines="two" class="py-0">
            <VListItem
              v-for="enquiry in recentEnquiries"
              :key="enquiry.id"
              to="/custom-enquiries"
            >
              <VListItemTitle class="font-weight-medium">
                {{ enquiry.name }}
              </VListItemTitle>
              <VListItemSubtitle>
                {{ (enquiry.requirement || '').slice(0, 64) }}
              </VListItemSubtitle>
              <template #append>
                <VChip size="small" variant="tonal">{{ enquiry.status }}</VChip>
              </template>
            </VListItem>
          </VList>
          <VCardText v-else class="text-medium-emphasis">
            No enquiries yet.
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
/*
  A short, once-only settle on first paint. This screen is opened every
  morning, so the motion stays brief — anything longer becomes a delay you
  have to sit through daily.
*/
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

.attention-tile {
  transition:
    transform 0.2s cubic-bezier(0.16, 0.84, 0.3, 1),
    box-shadow 0.2s cubic-bezier(0.16, 0.84, 0.3, 1);
}

.attention-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px -12px rgb(36 27 20 / 0.4);
}

/* Nothing to do is good news; it should not compete for attention. */
.attention-tile--idle {
  opacity: 0.66;
}

@media (prefers-reduced-motion: reduce) {
  .stagger,
  .attention-tile {
    animation: none;
    transition: none;
  }

  .attention-tile:hover {
    transform: none;
  }
}
</style>
