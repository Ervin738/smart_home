<!--
  天气组件
  功能：显示当前天气信息（温度、天气状况）
  位置：页面左上角，时钟旁边
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type AMapWeatherLive = {
  weather: string
  temperature: string
  location: string
}

type AMapIPResponse = {
  status?: string
  adcode?: string
}

const weather = ref<AMapWeatherLive | null>(null)
const cityAdcode = ref<string | null>(null)

const amapKey = (import.meta as any).env?.VITE_AMAP_KEY as string | undefined
const fallbackCity = ((import.meta as any).env?.VITE_AMAP_CITY as string | undefined) || '440100'

async function fetchCityFromIP(): Promise<string | null> {
  if (!amapKey) return null
  try {
    const url = `https://restapi.amap.com/v3/ip?key=${encodeURIComponent(amapKey)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as AMapIPResponse
    if (data.status !== '1') return null
    const adcode = data.adcode?.trim()
    return adcode && adcode !== '[]' ? adcode : null
  } catch {
    return null
  }
}

async function resolveCityCode(): Promise<string | null> {
  if (cityAdcode.value) return cityAdcode.value
  const ipCity = await fetchCityFromIP()
  cityAdcode.value = ipCity || fallbackCity
  return cityAdcode.value
}

async function fetchWeather() {
  if (!amapKey) return
  const city = await resolveCityCode()
  if (!city) return

  const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${encodeURIComponent(amapKey)}&city=${encodeURIComponent(city)}&extensions=base`
  const res = await fetch(url)
  if (!res.ok) return

  const data = (await res.json()) as { lives?: Array<Record<string, string>> }
  const live = data.lives?.[0]
  if (!live) return

  weather.value = {
    weather: String(live.weather ?? ''),
    temperature: String(live.temperature ?? ''),
    location: String(live.city || live.province || city || fallbackCity)
  }
}

let timer: number | undefined

onMounted(() => {
  fetchWeather()
  timer = window.setInterval(fetchWeather, 10 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="weather">
    <span class="weather-text">
      <span>{{ weather?.weather || '—' }}</span>
      <span v-if="weather?.location" class="weather-location">{{ weather.location }}</span>
    </span>
    <span class="weather-temp">{{ weather?.temperature ? `${weather.temperature}°` : '—' }}</span>
  </div>
</template>

<style scoped>
.weather { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }

.weather-text {
  font-size: 15px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  letter-spacing: 0.15em;
  font-weight: 500;
  opacity: 0.9;
}

.weather-location {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.weather-temp { font-size: 48px; line-height: 1; font-weight: 600; }

@media (max-width: 600px) {
  .weather-text { font-size: 14px; flex-direction: column; gap: 4px; }
  .weather-location { font-size: 11px; }
  .weather-temp { font-size: 22px; }
}
</style>
