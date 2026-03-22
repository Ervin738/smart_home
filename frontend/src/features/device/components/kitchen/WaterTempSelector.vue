<!--
  饮水机温度选择器
  功能：选择保温温度
-->
<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  currentTemp: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', temp: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 温度范围 40-100°C
const tempRange = Array.from({ length: 61 }, (_, i) => 40 + i)
const selectedTemp = ref(props.currentTemp)

// 监听当前温度变化
watch(() => props.currentTemp, (newTemp) => {
  selectedTemp.value = newTemp
})

// 确认选择
const confirmSelection = () => {
  emit('confirm', selectedTemp.value)
  emit('update:visible', false)
}

// 取消选择
const cancelSelection = () => {
  selectedTemp.value = props.currentTemp
  emit('update:visible', false)
}
</script>

<template>
  <transition name="selector">
    <div v-if="visible" class="selector-overlay" @click="cancelSelection">
      <div class="selector-content" @click.stop>
        <div class="selector-header">
          <div class="header-title">保温温度</div>
          <div class="header-subtitle">选择加热完成后的保温温度</div>
        </div>

        <!-- 温度列表 -->
        <div class="temp-list">
          <div 
            v-for="temp in tempRange" 
            :key="temp"
            class="temp-item"
            :class="{ selected: selectedTemp === temp }"
            @click="selectedTemp = temp"
          >
            <span class="temp-value">{{ temp }}°C</span>
            <svg v-if="selectedTemp === temp" class="check-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="selector-actions">
          <button class="action-btn cancel-btn" @click="cancelSelection">
            取消
          </button>
          <button class="action-btn confirm-btn" @click="confirmSelection">
            确定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
  backdrop-filter: blur(4px);
}

.selector-content {
  width: 320px;
  max-width: 90vw;
  max-height: 80vh;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.selector-header {
  margin-bottom: 20px;
  text-align: center;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* 温度列表 */
.temp-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 400px;
  padding-right: 4px;
}

/* 自定义滚动条 */
.temp-list::-webkit-scrollbar {
  width: 6px;
}

.temp-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.temp-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.temp-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.temp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.temp-item:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateX(4px);
}

.temp-item.selected {
  background: linear-gradient(135deg, rgba(38, 208, 206, 0.3) 0%, rgba(31, 161, 159, 0.25) 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.3);
}

.temp-value {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #26d0ce;
}

/* 按钮 */
.selector-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.cancel-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(38, 208, 206, 0.3);
}

.confirm-btn:hover {
  box-shadow: 0 6px 16px rgba(38, 208, 206, 0.4);
  transform: translateY(-2px);
}

/* 选择器动画 */
.selector-enter-active,
.selector-leave-active {
  transition: all 0.3s ease;
}

.selector-enter-from,
.selector-leave-to {
  opacity: 0;
}

.selector-enter-from .selector-content,
.selector-leave-to .selector-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
