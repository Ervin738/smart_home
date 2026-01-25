<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: number | string
  color?: string
}>()

const iconSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size || '24px'
})

const iconColor = computed(() => props.color || 'currentColor')

const icons: Record<string, string> = {
  power: `<path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  timer: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  
  countdown: `<circle cx="12" cy="13" r="9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7v6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 2h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="7" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="17" cy="4" r="1.5" fill="currentColor"/>`,
  
  play: `<path d="M5 3l14 9-14 9V3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>`,
  
  pause: `<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>`,
  
  home: `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  up: `<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  down: `<path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  bell: `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  temperature: `<path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="11.5" cy="18.5" r="1.5" fill="currentColor"/>`,
  
  settings: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  
  water: `<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  schedule: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.5 3.5L19 6M7.5 3.5L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  
  restart: `<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  volume: `<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  stop: `<rect x="5" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>
    <rect x="14" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>`,
  
  package: `<path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  sweep: `<path d="M4 20h16M8 16v4M16 16v4M6 16h12l-2-8H8l-2 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/>`,
  
  mop: `<path d="M12 3v10M8 13h8l2 8H6l2-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 17h8M9 20h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  
  'sweep-mop': `<path d="M4 20h7M17 20h3M8 16v4M6 16h6l-1-6H7l-1 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 13h6l1 7h-8l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5"/>`,
  
  'sweep-then-mop': `<path d="M3 18h8M7 14v4M5 14h4l-1-5H6l-1 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 8l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 10h6l1 8h-8l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  
  brightness: `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  
  arrow: `<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
}
</script>

<template>
  <svg 
    :width="iconSize" 
    :height="iconSize" 
    viewBox="0 0 24 24" 
    fill="none"
    :style="{ color: iconColor }"
    v-html="icons[name]"
  />
</template>

<style scoped>
svg {
  display: inline-block;
  vertical-align: middle;
}
</style>
