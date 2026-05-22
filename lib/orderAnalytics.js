import { readOrders } from "./ordersStore"

export const CAFE_TIMEZONE = "Australia/Adelaide"

const REVENUE_STATUSES = new Set(["paid", "new", "preparing", "out_for_delivery", "completed"])

export function isRevenueOrder(order) {
  const status = order?.status || ""
  return REVENUE_STATUSES.has(status)
}

function toLocalDayKey(iso, timeZone = CAFE_TIMEZONE) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

function formatDayLabel(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })
}

function sumRevenue(orders) {
  return orders.filter(isRevenueOrder).reduce((sum, o) => sum + Number(o.total || 0), 0)
}

function buildDayBuckets(dayCount, timeZone = CAFE_TIMEZONE) {
  const buckets = []
  const now = new Date()
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d)
    buckets.push(key)
  }
  return buckets
}

export function computeOrderAnalytics(orders, { dailyDays = 14 } = {}) {
  const todayKey = toLocalDayKey(new Date().toISOString())
  const dailyKeys = buildDayBuckets(dailyDays)

  const dailyMap = Object.fromEntries(
    dailyKeys.map((key) => [key, { date: key, label: formatDayLabel(key), orders: 0, revenue: 0 }])
  )

  const statusCounts = {}
  const itemCounts = {}
  let todayOrders = 0
  let todayRevenue = 0
  let weekOrders = 0
  let weekRevenue = 0
  let monthOrders = 0
  let monthRevenue = 0
  let revenueOrderCount = 0
  let revenueTotal = 0
  let deliveryOrders = 0
  let allTimeOrders = orders.length

  const weekStart = dailyKeys[Math.max(0, dailyKeys.length - 7)]
  const monthStart = dailyKeys[0]

  for (const order of orders) {
    const dayKey = toLocalDayKey(order.createdAt)
    const status = order.status || "unknown"
    statusCounts[status] = (statusCounts[status] || 0) + 1

    const countsForRevenue = isRevenueOrder(order)
    const total = Number(order.total || 0)
    const deliveryFee = Number(order.deliveryFee || 0)
    if (deliveryFee > 0) deliveryOrders += 1

    if (countsForRevenue) {
      revenueOrderCount += 1
      revenueTotal += total
    }

    if (dayKey === todayKey) {
      todayOrders += 1
      if (countsForRevenue) todayRevenue += total
    }

    if (dayKey && dayKey >= weekStart) {
      weekOrders += 1
      if (countsForRevenue) weekRevenue += total
    }

    if (dayKey && dayKey >= monthStart) {
      monthOrders += 1
      if (countsForRevenue) monthRevenue += total
    }

    if (dayKey && dailyMap[dayKey]) {
      dailyMap[dayKey].orders += 1
      if (countsForRevenue) dailyMap[dayKey].revenue += total
    }

    if (countsForRevenue && dayKey && dayKey >= monthStart) {
      for (const line of order.items || []) {
        const name = line.name || line.id || "Unknown"
        const qty = Math.max(1, Number(line.qty || 1))
        itemCounts[name] = (itemCounts[name] || 0) + qty
      }
    }
  }

  const daily = dailyKeys.map((key) => {
    const row = dailyMap[key]
    return {
      ...row,
      revenue: Number(row.revenue.toFixed(2)),
      avgOrder: row.orders ? Number((row.revenue / row.orders).toFixed(2)) : 0
    }
  })

  const maxDailyOrders = Math.max(1, ...daily.map((d) => d.orders))

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, qty]) => ({ name, qty }))

  const statusBreakdown = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ status, count }))

  return {
    timezone: CAFE_TIMEZONE,
    today: {
      date: todayKey,
      orders: todayOrders,
      revenue: Number(todayRevenue.toFixed(2))
    },
    last7Days: {
      orders: weekOrders,
      revenue: Number(weekRevenue.toFixed(2))
    },
    last14Days: {
      orders: monthOrders,
      revenue: Number(monthRevenue.toFixed(2))
    },
    allTime: {
      orders: allTimeOrders,
      revenue: Number(revenueTotal.toFixed(2)),
      avgOrderValue: revenueOrderCount
        ? Number((revenueTotal / revenueOrderCount).toFixed(2))
        : 0,
      deliveryOrders,
      paidOrders: revenueOrderCount
    },
    daily,
    maxDailyOrders,
    statusBreakdown,
    topItems,
    generatedAt: new Date().toISOString()
  }
}

export function getOrderAnalytics(options) {
  return computeOrderAnalytics(readOrders(), options)
}
