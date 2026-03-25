<!--
  根组件
  功能：应用主框架，支持侧边栏布局和经典顶部导航布局切换
-->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useLayoutStore } from '@/stores/layout'
import Clock from '@/shared/components/Clock.vue'
import Weather from '@/shared/components/Weather.vue'
import BackgroundEffects from '@/shared/components/BackgroundEffects.vue'
import SideBar from '@/shared/components/SideBar.vue'
import NavBar from '@/shared/components/NavBar.vue'
import ModeBadge from '@/shared/components/Switchmode.vue'
import { useBackendSync } from '@/composables/useBackendSync'

const route = useRoute()
const themeStore = useThemeStore()
const layoutStore = useLayoutStore()
useBackendSync()
</script>

<template>
  <div class="app-container" :class="{ 'layout-sidebar': layoutStore.useSidebar, 'layout-classic': !layoutStore.useSidebar }">
    <BackgroundEffects />

    <!-- 侧边栏布局 -->
    <template v-if="layoutStore.useSidebar">
      <SideBar />
      <div class="main-content">
        <div class="top-section">
          <Clock />
          <Weather />
          <div class="theme-switcher">
            <span class="theme-label">主题</span>
            <div class="theme-dots">
              <button
                v-for="(theme, key) in themeStore.themes"
                :key="key"
                class="theme-dot"
                :class="{ active: themeStore.currentThemeName === key }"
                :title="theme.displayName"
                @click="themeStore.setTheme(key)"
                :style="{ background: `linear-gradient(135deg, ${theme.colors.gradientStops.slice(0,2).join(', ')})` }"
              ></button>
            </div>
          </div>
        </div>
        <div class="middle-section">
          <router-view />
        </div>
      </div>
    </template>

    <!-- 经典布局 -->
    <template v-else>
      <div class="top-section">
        <div class="left-info">
          <Clock />
          <Weather />
        </div>
      </div>
      <ModeBadge />
      <NavBar v-if="route.path === '/'" />
      <div class="middle-section">
        <router-view />
      </div>
    </template>

    <!-- 布局切换按钮（始终显示） -->
    <button class="layout-toggle-btn" @click="layoutStore.toggle" :title="layoutStore.useSidebar ? '切换到经典布局' : '切换到侧边栏布局'">
      <svg v-if="layoutStore.useSidebar" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/>
        <line x1="5" y1="1" x2="5" y2="15" stroke="currentColor" stroke-width="1.4"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/>
        <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" stroke-width="1.4"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  color: v-bind('themeStore.textColor');
  font-weight: v-bind('themeStore.fontWeight');
}

.layout-sidebar {
  display: flex;
  flex-direction: row;
  padding: 0;
  gap: 0;
}

.layout-sidebar .main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  overflow: hidden;
  padding: 24px 24px 24px 20px;
}

.layout-sidebar .top-section {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-shrink: 0;
  justify-content: space-between;
}

.theme-switcher {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  margin-left: auto;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.15)" : "rgba(59,130,246,0.25)"');
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"');
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.theme-label {
  font-size: 12px;
  font-weight: 600;
  color: v-bind('themeStore.textColorSecondary');
  letter-spacing: 0.05em;
}

.theme-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.theme-dot:hover {
  transform: scale(1.15);
}

.theme-dot.active {
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.layout-classic {
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 24px;
}

.layout-classic .top-section {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.layout-classic .left-info {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.middle-section {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.middle-section::-webkit-scrollbar { display: none; }

.layout-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.15)" : "rgba(59,130,246,0.25)"');
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(0,30,40,0.6)" : "rgba(255,255,255,0.5)"');
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: v-bind('themeStore.textColorSecondary');
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 200;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.layout-toggle-btn:hover {
  color: v-bind('themeStore.textColor');
  border-color: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.3)" : "rgba(59,130,246,0.4)"');
  transform: scale(1.05);
}

.app-container :deep(.glass-card) {
  color: v-bind('themeStore.textColor');
  font-weight: v-bind('themeStore.fontWeight');
}

.app-container :deep(.glass-card *) {
  color: inherit;
}
</style>
