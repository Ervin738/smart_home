<!--
  导航栏组件
  功能：房间标签切换、添加房间、删除房间
  位置：页面顶部
-->
<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useTabsStore } from '@/features/layout/tabs'

const tabsStore = useTabsStore()
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteIndex = ref(-1)
const newTabName = ref('')
const isDuplicate = ref(false)

// 液态效果相关
const navItemsRef = ref<HTMLElement[]>([])
const liquidBgStyle = ref({
  left: '0px',
  width: '0px',
  opacity: 0
})

const setNavItemRef = (el: any, index: number) => {
  if (el) {
    navItemsRef.value[index] = el as HTMLElement
  }
}

const updateLiquidBg = () => {
  nextTick(() => {
    const activeEl = navItemsRef.value[tabsStore.activeIndex]
    if (activeEl) {
      const parent = activeEl.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        liquidBgStyle.value = {
          left: `${activeRect.left - parentRect.left}px`,
          width: `${activeRect.width}px`,
          opacity: 1
        }
      }
    } else {
      liquidBgStyle.value.opacity = 0
    }
  })
}

watch(() => tabsStore.activeIndex, updateLiquidBg)
watch(() => tabsStore.tabs.length, updateLiquidBg)

// 组件挂载时初始化液态背景
onMounted(() => {
  updateLiquidBg()
})

// 监听输入变化，检测重复
watch(newTabName, (value) => {
  const trimmedName = value.trim()
  isDuplicate.value = trimmedName !== '' && tabsStore.tabs.includes(trimmedName)
})

const selectTab = (index: number) => {
  tabsStore.setActiveIndex(index)
}

const confirmDelete = (index: number) => {
  deleteIndex.value = index
  showDeleteDialog.value = true
}

const deleteTab = () => {
  if (deleteIndex.value >= 0) {
    tabsStore.removeTab(deleteIndex.value)
    showDeleteDialog.value = false
    deleteIndex.value = -1
  }
}

const openAddDialog = () => {
  showAddDialog.value = true
  newTabName.value = ''
  isDuplicate.value = false
}

const closeAddDialog = () => {
  showAddDialog.value = false
  newTabName.value = ''
  isDuplicate.value = false
}

const addTab = () => {
  const name = newTabName.value.trim()
  if (!name) return
  
  if (tabsStore.tabs.includes(name)) {
    isDuplicate.value = true
    return
  }
  
  tabsStore.addTab(name)
  closeAddDialog()
  updateLiquidBg()
}
</script>

<template>
  <div class="navbar">
    <div class="nav-items">
      <!-- 液态背景指示器 -->
      <div 
        class="liquid-bg"
        :style="{
          left: liquidBgStyle.left,
          width: liquidBgStyle.width,
          opacity: liquidBgStyle.opacity
        }"
      ></div>
      
      <div 
        v-for="(tab, index) in tabsStore.tabs" 
        :key="index"
        :ref="(el) => setNavItemRef(el, index)"
        class="nav-item"
        :class="{ active: tabsStore.activeIndex === index }"
        @click="selectTab(index)"
        @contextmenu.prevent="confirmDelete(index)"
      >
        {{ tab }}
      </div>
      <div v-if="tabsStore.tabs.length === 0" class="empty-hint">
        点击右侧 + 添加房间
      </div>
    </div>
    
    <div class="nav-divider"></div>
    
    <div class="add-btn" @click="openAddDialog">
      <span style="transform: translateY(-2px);">+</span>
    </div>

    <teleport to="body">
      <transition name="dialog">
        <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
          <div class="dialog-content" @click.stop>
            <div class="dialog-header">删除房间</div>
            <div class="dialog-message">确定要删除「{{ tabsStore.tabs[deleteIndex] }}」吗？</div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel" @click="showDeleteDialog = false">取消</button>
              <button class="dialog-btn delete" @click="deleteTab">删除</button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="dialog">
        <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddDialog">
          <div class="dialog-content" @click.stop>
            <div class="dialog-header">添加房间</div>
            <input 
              v-model="newTabName"
              class="dialog-input" 
              :class="{ error: isDuplicate }"
              placeholder="输入房间名称"
              @keyup.enter="addTab"
            />
            <div v-if="isDuplicate" class="error-message">房间名称已存在</div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
              <button class="dialog-btn confirm" :disabled="isDuplicate || !newTabName.trim()" @click="addTab">确定</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: stretch;
  height: 52px;
  background: linear-gradient(
    135deg,
    rgba(26, 42, 78, 0.45) 0%,
    rgba(42, 58, 90, 0.4) 30%,
    rgba(58, 90, 122, 0.45) 70%,
    rgba(42, 58, 90, 0.4) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  overflow: hidden;
  position: relative;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  padding: 0 12px;
  position: relative;
  z-index: 1;
  width: 100%;
}

.liquid-bg {
  position: absolute;
  top: 8px;
  bottom: 8px;
  background: linear-gradient(
    135deg,
    rgba(58, 90, 122, 0.6) 0%,
    rgba(42, 58, 90, 0.5) 100%
  );
  border-radius: 18px;
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(58, 106, 154, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liquid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 35%,
    transparent 65%,
    rgba(58, 106, 154, 0.08) 100%
  );
  border-radius: 18px;
  pointer-events: none;
}

.liquid-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 60%
  );
  border-radius: 18px;
  pointer-events: none;
}

.empty-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.3px;
  padding: 0 16px;
  user-select: none;
  flex: 1;
  text-align: center;
}

.nav-item {
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  height: 100%;
  position: relative;
  letter-spacing: 0.05em;
  flex: 1;
  min-width: 0;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.nav-item.active {
  color: white;
  font-weight: 600;
}

.nav-divider {
  width: 1px;
  height: 28px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 100%
  );
  align-self: center;
  margin: 0 8px;
  position: relative;
  z-index: 1;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 100%;
  color: rgba(255, 255, 255, 0.75);
  font-size: 24px;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.add-btn > * {
  position: relative;
  z-index: 1;
}

.add-btn::before {
  content: '';
  position: absolute;
  inset: 8px;
  background: rgba(255, 255, 255, 0);
  border-radius: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.add-btn:hover {
  color: rgba(255, 255, 255, 0.95);
}

.add-btn:hover::before {
  background: linear-gradient(
    135deg,
    rgba(58, 106, 154, 0.2) 0%,
    rgba(42, 58, 90, 0.15) 100%
  );
  box-shadow: 
    0 2px 12px rgba(58, 106, 154, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.add-btn:active::before {
  background: linear-gradient(
    135deg,
    rgba(58, 106, 154, 0.3) 0%,
    rgba(42, 58, 90, 0.25) 100%
  );
  transform: scale(0.95);
}

.dialog-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-size: 15px;
  margin-bottom: 8px;
  outline: none;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.dialog-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.dialog-input:focus {
  border-color: rgba(58, 106, 154, 0.5);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 0 0 3px rgba(58, 106, 154, 0.1);
}

.dialog-input.error {
  border-color: rgba(239, 68, 68, 0.6);
  background: rgba(239, 68, 68, 0.08);
}

.dialog-input.error:focus {
  border-color: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-message {
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
  letter-spacing: 0.02em;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.dialog-message {
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.6;
  word-wrap: break-word;
  letter-spacing: 0.02em;
}

.dialog-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
