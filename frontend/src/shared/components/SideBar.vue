<!--
  侧边栏组件（方案C：侧边栏收纳）
  功能：可收起侧边栏，包含页面导航、房间标签、模式切换、主题选择
-->
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTabsStore } from '@/features/layout/tabs'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteIndex = ref(-1)
const newTabName = ref('')
const isDuplicate = ref(false)

const navItems = [
  { label: '标准模式', to: '/', icon: '⊞' },
  { label: '平面图', to: '/floor-plan', icon: '⬡' },
  { label: '设备管理', to: '/equipment', icon: '⚙' },
]

watch(newTabName, (v) => {
  const t = v.trim()
  isDuplicate.value = t !== '' && tabsStore.tabs.includes(t)
})

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

const addTab = async () => {
  const name = newTabName.value.trim()
  if (!name || isDuplicate.value) return
  await tabsStore.addTab(name)
  closeAddDialog()
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
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- 收起/展开按钮 -->
    <button class="toggle-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
      <svg class="toggle-svg" :class="{ flipped: collapsed }" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 页面导航 -->
    <nav class="section">
      <div v-if="!collapsed" class="section-label">导航</div>
      <div
        v-for="item in navItems"
        :key="item.to"
        class="nav-item"
        :class="{ active: route.path === item.to }"
        @click="router.push(item.to)"
        :title="collapsed ? item.label : ''"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </div>
    </nav>

    <div class="divider"></div>

    <!-- 房间标签（仅标准模式显示） -->
    <div v-if="route.path === '/'" class="section rooms-section">
      <div v-if="!collapsed" class="section-label">房间</div>
      <div
        v-for="(tab, index) in tabsStore.tabs"
        :key="index"
        class="nav-item room-item"
        :class="{ active: tabsStore.activeIndex === index }"
        @click="tabsStore.setActiveIndex(index)"
        @contextmenu.prevent="confirmDelete(index)"
        :title="collapsed ? tab : ''"
      >
        <span class="nav-icon">🏠</span>
        <span v-if="!collapsed" class="nav-label">{{ tab }}</span>
      </div>
      <div class="nav-item add-room" @click="openAddDialog" :title="collapsed ? '添加房间' : ''">
        <span class="nav-icon">＋</span>
        <span v-if="!collapsed" class="nav-label">添加房间</span>
      </div>
    </div>

    <!-- 对话框 -->
    <teleport to="body">
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
              autofocus
            />
            <div v-if="isDuplicate" class="error-message">房间名称已存在</div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
              <button class="dialog-btn confirm" :disabled="isDuplicate || !newTabName.trim()" @click="addTab">确定</button>
            </div>
          </div>
        </div>
      </transition>
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
    </teleport>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 120px;
  min-width: 120px;
  height: 100%;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-right: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.15)"');
  border-radius: 0;
  padding: 10px 6px;
  gap: 2px;
  transition: width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
  flex-shrink: 0;
  z-index: 10;
}

.sidebar.collapsed {
  width: 44px;
  min-width: 44px;
}

.toggle-btn {
  position: absolute;
  top: 8px;
  right: 50%;
  transform: translateX(50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.18)" : "rgba(59,130,246,0.3)"');
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(0,30,40,0.7)" : "rgba(255,255,255,0.6)"');
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: v-bind('themeStore.textColor');
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.toggle-btn:hover {
  border-color: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.35)" : "rgba(59,130,246,0.5)"');
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  transform: translateX(50%) scale(1.08);
}

.toggle-svg {
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  color: v-bind('themeStore.textColor');
}

.toggle-svg.flipped {
  transform: rotate(180deg);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 44px;
}

.section:first-of-type {
  margin-top: 44px;
}

.rooms-section {
  margin-top: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: v-bind('themeStore.textColorSecondary');
  padding: 0 8px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: v-bind('themeStore.textColorSecondary');
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
}

.nav-item:hover {
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.1)"');
  color: v-bind('themeStore.textColor');
}

.nav-item.active {
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.12)" : "rgba(59,130,246,0.15)"');
  color: v-bind('themeStore.textColor');
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-room {
  opacity: 0.6;
}

.add-room:hover {
  opacity: 1;
}

.divider {
  height: 1px;
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.12)"');
  margin: 8px 4px;
  flex-shrink: 0;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(180deg, var(--dialog-bg-1) 0%, var(--dialog-bg-2) 50%, var(--dialog-bg-3) 100%);
  border-radius: 20px;
  padding: 24px;
  width: 320px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  font-size: 17px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
  text-align: center;
}

.dialog-message {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
}

.dialog-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  color: white;
  font-size: 14px;
  margin-bottom: 8px;
  outline: none;
  transition: all 0.2s ease;
}

.dialog-input:focus {
  border-color: rgba(58, 106, 154, 0.5);
  background: rgba(0, 0, 0, 0.35);
}

.dialog-input.error {
  border-color: rgba(239, 68, 68, 0.6);
}

.error-message {
  color: #fca5a5;
  font-size: 12px;
  margin-bottom: 12px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-btn {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.dialog-btn.confirm {
  background: rgba(59, 130, 246, 0.7);
  color: white;
}

.dialog-btn.delete {
  background: rgba(239, 68, 68, 0.7);
  color: white;
}

.dialog-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dialog-enter-active, .dialog-leave-active {
  transition: all 0.25s ease;
}

.dialog-enter-from, .dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
