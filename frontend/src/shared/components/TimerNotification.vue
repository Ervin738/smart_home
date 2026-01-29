<!--
  定时器通知组件
  功能：定时器触发时显示通知消息
  位置：页面顶部居中
-->
<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()
</script>

<template>
  <transition name="notification">
    <div v-if="visible" class="timer-notification">
      <span class="notification-text">{{ message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.timer-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  padding: 14px 24px;
  background: rgba(74, 222, 128, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
}

.notification-enter-active, .notification-leave-active { transition: all 0.3s ease; }
.notification-enter-from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
.notification-leave-to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
</style>
