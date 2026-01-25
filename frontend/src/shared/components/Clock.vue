<!--
  时钟组件
  功能：显示当前日期和时间
  位置：页面左上角
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const now = ref(new Date())

const dateText = computed(() => {
  const d = now.value
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${String(day).padStart(2, '0')}日 ${weekdays[d.getDay()]}`
})

const timeText = computed(() => {
  const d = now.value
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
})

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="clock">
    <div class="clock-date">{{ dateText }}</div>
    <div class="clock-time">{{ timeText }}</div>
  </div>
</template>

<style scoped>
.clock { display: flex; flex-direction: column; gap: 6px; }
.clock-date { font-size: 15px; letter-spacing: 0.15em; font-weight: 500; opacity: 0.9; }
.clock-time { font-size: 48px; line-height: 1; font-weight: 600; letter-spacing: -0.01em; }

@media (max-width: 600px) {
  .clock-date { font-size: 15px; }
  .clock-time { font-size: 52px; }
}
</style>
