<!--
  根组件
  功能：应用主框架，包含顶部信息栏（时钟、天气、模式切换）、路由视图、底部亮度控制
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Clock from '@/shared/components/Clock.vue'
import Weather from '@/shared/components/Weather.vue'
import ModeBadge from '@/shared/components/Switchmode.vue'

const route = useRoute()
</script>

<template>
  <div class="app-container">
    <!-- 顶部：日期天气 -->
    <div class="top-section">
      <div class="left-info">
        <Clock />
        <Weather />
      </div>
    </div>

    <!-- 模式按钮 -->
    <ModeBadge />

    <!-- 中间：卡片区域（路由切换） -->
    <div class="middle-section">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 24px;
  overflow: hidden;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 8px 32px rgba(15, 60, 120, 0.35);
}

.left-info {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.middle-section {
  flex: 1;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.middle-section::-webkit-scrollbar {
  display: none;
}

.middle-section {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

@media (max-width: 600px) {
  .app-container {
    padding: 18px;
    gap: 16px;
  }

  .top-section {
    flex-direction: column;
    gap: 16px;
  }

  .left-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
