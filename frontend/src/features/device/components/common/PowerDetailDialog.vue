<!--
  电量详情对话框
  功能：显示设备的电量统计图表（今日、本周、本月）
  触发：在插座对话框中点击"电量详情"按钮
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent])

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const powerDetailTab = ref<'week' | 'month' | 'year'>('week')
const selectedDate = ref(new Date())
const barSelectedIndex = ref(-1)

// 根据日期生成固定的随机数据
const getSeededData = (seed: number, count: number, max: number) => {
  const data: number[] = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    data.push((s / 233280) * max)
  }
  return data
}

// 折线图配置
const switchChartOption = computed(() => {
  let xData: string[] = []
  let yData: number[] = []
  const date = selectedDate.value
  
  if (powerDetailTab.value === 'week') {
    const day = date.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const seed = monday.getFullYear() * 10000 + (monday.getMonth() + 1) * 100 + monday.getDate()
    yData = getSeededData(seed, 7, 8).map(v => Math.floor(v) + 1)
  } else if (powerDetailTab.value === 'month') {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    xData = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`)
    const seed = year * 100 + month
    yData = getSeededData(seed, daysInMonth, 8).map(v => Math.floor(v) + 1)
  } else {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const seed = date.getFullYear()
    yData = getSeededData(seed, 12, 50).map(v => Math.floor(v) + 30)
  }
  
  return {
    grid: { left: 40, right: 20, top: 25, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: 'rgba(100, 180, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(100, 180, 255, 0.1)', type: 'dashed' } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 40, 80, 0.95)',
      borderColor: 'rgba(100, 180, 255, 0.4)',
      borderWidth: 1,
      borderRadius: 12,
      padding: [10, 14],
      textStyle: { color: '#fff', fontSize: 13 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'rgba(100, 180, 255, 0.5)', type: 'dashed' }
      }
    },
    series: [{
      type: 'line',
      data: yData,
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 8,
      showSymbol: false,
      lineStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#667eea' },
            { offset: 0.5, color: '#4facfe' },
            { offset: 1, color: '#00f2fe' }
          ]
        },
        width: 3,
        shadowColor: 'rgba(79, 172, 254, 0.5)',
        shadowBlur: 10,
        shadowOffsetY: 5
      },
      itemStyle: {
        color: '#4facfe',
        borderColor: '#fff',
        borderWidth: 2,
        shadowColor: 'rgba(79, 172, 254, 0.8)',
        shadowBlur: 8
      },
      emphasis: {
        showSymbol: true,
        symbolSize: 12,
        itemStyle: {
          color: '#00f2fe',
          borderColor: '#fff',
          borderWidth: 3,
          shadowColor: 'rgba(0, 242, 254, 0.8)',
          shadowBlur: 15
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79, 172, 254, 0.4)' },
            { offset: 0.5, color: 'rgba(79, 172, 254, 0.15)' },
            { offset: 1, color: 'rgba(79, 172, 254, 0.02)' }
          ]
        }
      }
    }]
  }
})

// 柱状图配置
const powerBarChartOption = computed(() => {
  let xData: string[] = []
  let yData: number[] = []
  let defaultSelected = 0
  const date = selectedDate.value
  
  if (powerDetailTab.value === 'week') {
    const day = date.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const seed = monday.getFullYear() * 10000 + (monday.getMonth() + 1) * 100 + monday.getDate() + 1000
    yData = getSeededData(seed, 7, 0.2).map(v => Number((v + 0.01).toFixed(2)))
    defaultSelected = 6
  } else if (powerDetailTab.value === 'month') {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    xData = Array.from({ length: daysInMonth }, (_, i) => `${month + 1}/${String(i + 1).padStart(2, '0')}`)
    const seed = year * 100 + month + 2000
    yData = getSeededData(seed, daysInMonth, 0.25).map(v => Number((v + 0.01).toFixed(2)))
    defaultSelected = daysInMonth - 1
  } else {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const seed = date.getFullYear() + 3000
    yData = getSeededData(seed, 12, 5).map(v => Number((v + 1).toFixed(2)))
    defaultSelected = 11
  }
  
  const activeIndex = barSelectedIndex.value >= 0 ? barSelectedIndex.value : defaultSelected
  
  return {
    grid: { left: 35, right: 10, top: 15, bottom: 25 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, interval: powerDetailTab.value === 'month' ? 9 : 0 },
      axisTick: { show: false }
    },
    yAxis: { type: 'value', show: false },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 40, 80, 0.95)',
      borderColor: 'rgba(100, 180, 255, 0.4)',
      borderWidth: 1,
      borderRadius: 12,
      padding: [10, 14],
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: any) => `${params[0].name}: ${params[0].value.toFixed(2)}度`
    },
    series: [{
      type: 'bar',
      data: yData.map((val, idx) => ({
        value: val,
        itemStyle: {
          color: idx === activeIndex ? {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#00f2fe' },
              { offset: 0.5, color: '#4facfe' },
              { offset: 1, color: '#667eea' }
            ]
          } : 'rgba(255, 255, 255, 0.15)',
          shadowColor: idx === activeIndex ? 'rgba(79, 172, 254, 0.6)' : 'transparent',
          shadowBlur: idx === activeIndex ? 10 : 0,
          shadowOffsetY: idx === activeIndex ? 3 : 0
        }
      })),
      barWidth: powerDetailTab.value === 'month' ? 6 : 20,
      barGap: '50%',
      itemStyle: { borderRadius: [6, 6, 2, 2] },
      emphasis: {
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#00f2fe' },
              { offset: 1, color: '#4facfe' }
            ]
          },
          shadowColor: 'rgba(79, 172, 254, 0.8)',
          shadowBlur: 15
        }
      }
    }]
  }
})

const onBarChartClick = (params: any) => {
  barSelectedIndex.value = params.dataIndex
}

watch(powerDetailTab, () => {
  barSelectedIndex.value = -1
  selectedDate.value = new Date()
})

const selectedBarData = computed(() => {
  let yData: number[] = []
  let xData: string[] = []
  let defaultSelected = 0
  const date = selectedDate.value
  
  if (powerDetailTab.value === 'week') {
    const day = date.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const seed = monday.getFullYear() * 10000 + (monday.getMonth() + 1) * 100 + monday.getDate() + 1000
    yData = getSeededData(seed, 7, 0.2).map(v => Number((v + 0.01).toFixed(2)))
    defaultSelected = 6
  } else if (powerDetailTab.value === 'month') {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    xData = Array.from({ length: daysInMonth }, (_, i) => `${month + 1}/${String(i + 1).padStart(2, '0')}`)
    const seed = year * 100 + month + 2000
    yData = getSeededData(seed, daysInMonth, 0.25).map(v => Number((v + 0.01).toFixed(2)))
    defaultSelected = daysInMonth - 1
  } else {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const seed = date.getFullYear() + 3000
    yData = getSeededData(seed, 12, 5).map(v => Number((v + 1).toFixed(2)))
    defaultSelected = 11
  }
  
  const idx = barSelectedIndex.value >= 0 ? barSelectedIndex.value : defaultSelected
  return { value: yData[idx] || 0, label: xData[idx] || '' }
})

const getDateRange = () => {
  const date = selectedDate.value
  if (powerDetailTab.value === 'week') {
    const day = date.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return `${String(monday.getMonth() + 1).padStart(2, '0')}/${String(monday.getDate()).padStart(2, '0')}-${String(sunday.getMonth() + 1).padStart(2, '0')}/${String(sunday.getDate()).padStart(2, '0')}`
  } else if (powerDetailTab.value === 'month') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  } else {
    return `${date.getFullYear()}年`
  }
}

const adjustDate = (direction: number) => {
  const date = new Date(selectedDate.value)
  if (powerDetailTab.value === 'week') {
    date.setDate(date.getDate() + direction * 7)
  } else if (powerDetailTab.value === 'month') {
    date.setMonth(date.getMonth() + direction)
  } else {
    date.setFullYear(date.getFullYear() + direction)
  }
  selectedDate.value = date
  barSelectedIndex.value = -1
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content power-detail-dialog" @click.stop>
        <div class="dialog-header">用电信息</div>
        
        <div class="power-stats-grid">
          <div class="power-stat-item">
            <div class="power-stat-value">0.0</div>
            <div class="power-stat-label">当前功率(w)</div>
          </div>
          <div class="power-stat-item">
            <div class="power-stat-value">&lt;0.1</div>
            <div class="power-stat-label">今日用电(度)</div>
          </div>
          <div class="power-stat-item">
            <div class="power-stat-value">&lt;0.1</div>
            <div class="power-stat-label">近一月用电(度)</div>
          </div>
          <div class="power-stat-item">
            <div class="power-stat-value">--</div>
            <div class="power-stat-label">昨日用电(度)</div>
          </div>
        </div>
        
        <div class="section-divider"></div>
        
        <div class="power-switch-count">
          <div class="switch-count-value">4</div>
          <div class="switch-count-label">今日开关次数</div>
        </div>
        
        <div class="power-chart-area">
          <v-chart :option="switchChartOption" autoresize class="switch-chart" />
        </div>
        
        <div class="power-tab-bar">
          <div class="power-tab" :class="{ active: powerDetailTab === 'week' }" @click="powerDetailTab = 'week'">周</div>
          <div class="power-tab" :class="{ active: powerDetailTab === 'month' }" @click="powerDetailTab = 'month'">月</div>
          <div class="power-tab" :class="{ active: powerDetailTab === 'year' }" @click="powerDetailTab = 'year'">年</div>
        </div>
        
        <div class="power-date-range">
          <span class="date-arrow" @click="adjustDate(-1)">‹</span>
          <span class="date-text">{{ getDateRange() }}</span>
          <span class="date-arrow" @click="adjustDate(1)">›</span>
        </div>
        
        <div class="section-divider"></div>
        
        <div class="power-total-section">
          <div class="power-total-label">电量</div>
          <div class="power-total-value">{{ selectedBarData.value.toFixed(2) }}<span class="power-total-unit">度</span></div>
          <div class="power-total-sub">{{ selectedBarData.label }}电量</div>
        </div>
        
        <div class="power-bar-chart-area">
          <v-chart :option="powerBarChartOption" autoresize class="power-bar-chart-echart" @click="onBarChartClick" />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    rgba(13, 13, 26, 0.95) 0%,
    rgba(26, 26, 46, 0.95) 25%,
    rgba(42, 58, 90, 0.95) 50%,
    rgba(58, 90, 122, 0.95) 75%,
    rgba(58, 106, 154, 0.95) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.power-detail-dialog {
  width: 360px;
  max-height: 80vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.power-detail-dialog::-webkit-scrollbar { display: none; }

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  margin: 20px 0;
}

.power-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.power-stat-item { text-align: left; }
.power-stat-value { font-size: 28px; font-weight: 600; color: white; }
.power-stat-label { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 4px; }

.power-switch-count { margin-bottom: 24px; }
.switch-count-value { font-size: 28px; font-weight: 600; color: white; }
.switch-count-label { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 4px; }

.power-chart-area {
  height: 160px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.4) 0%, rgba(20, 40, 70, 0.3) 100%);
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(100, 180, 255, 0.15);
}

.switch-chart { width: 100%; height: 100%; }

.power-tab-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 4px;
}

.power-tab {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px 24px;
  border-radius: 10px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.power-tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.08);
}

.power-tab.active {
  color: white;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
}

.power-date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.date-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  user-select: none;
}

.date-arrow:hover {
  color: white;
  background: rgba(79, 172, 254, 0.3);
}

.date-arrow:active {
  transform: scale(0.95);
}

.date-text {
  min-width: 120px;
  text-align: center;
  font-weight: 500;
}

.power-total-section { padding-top: 12px; }
.power-total-label { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px; }
.power-total-value {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.power-total-unit { font-size: 16px; font-weight: 400; margin-left: 4px; }
.power-total-sub { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 4px; }

.power-bar-chart-area {
  height: 110px;
  margin-top: 16px;
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.3) 0%, rgba(20, 40, 70, 0.2) 100%);
  border-radius: 12px;
  padding: 8px;
}
.power-bar-chart-echart { width: 100%; height: 100%; }

.dialog-enter-active, .dialog-leave-active { transition: all 0.3s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-content, .dialog-leave-to .dialog-content { transform: scale(0.9); opacity: 0; }
</style>
