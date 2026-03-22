<!--
  导航栏组件
  功能：房间标签切换、添加房间、删除房间
  位置：页面顶部
-->
<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useTabsStore } from '@/features/layout/tabs'
import { useThemeStore } from '@/stores/theme'

const tabsStore = useTabsStore()
const themeStore = useThemeStore()
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteIndex = ref(-1)
const newTabName = ref('')
const isDuplicate = ref(false)

// 右键菜单
const contextMenu = ref({ visible: false, x: 0, y: 0, index: -1 })
const showRenameDialog = ref(false)
const renameIndex = ref(-1)
const renameName = ref('')
const renameIsDuplicate = ref(false)

const openContextMenu = (e: MouseEvent, index: number) => {
  e.preventDefault()
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, index }
}

const closeContextMenu = () => { contextMenu.value.visible = false }

const startRename = () => {
  renameIndex.value = contextMenu.value.index
  renameName.value = tabsStore.tabs[renameIndex.value] || ''
  renameIsDuplicate.value = false
  showRenameDialog.value = true
  closeContextMenu()
}

const confirmRename = async () => {
  const name = renameName.value.trim()
  if (!name) return
  if (name !== tabsStore.tabs[renameIndex.value] && tabsStore.tabs.includes(name)) {
    renameIsDuplicate.value = true
    return
  }
  await tabsStore.renameTab(renameIndex.value, name)
  showRenameDialog.value = false
}

const startDelete = () => {
  deleteIndex.value = contextMenu.value.index
  showDeleteDialog.value = true
  closeContextMenu()
}

const moveTab = async (dir: -1 | 1) => {
  const index = contextMenu.value.index
  const newIndex = index + dir
  if (newIndex < 0 || newIndex >= tabsStore.rooms.length) { closeContextMenu(); return }
  const newRooms = [...tabsStore.rooms]
  const [moved] = newRooms.splice(index, 1)
  newRooms.splice(newIndex, 0, moved)
  await tabsStore.reorderRooms(newRooms.map(r => r.id))
  if (tabsStore.activeIndex === index) tabsStore.setActiveIndex(newIndex)
  closeContextMenu()
}

watch(renameName, (v) => {
  const t = v.trim()
  renameIsDuplicate.value = t !== '' && t !== tabsStore.tabs[renameIndex.value] && tabsStore.tabs.includes(t)
})

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

const addTab = async () => {
  const name = newTabName.value.trim()
  if (!name) return
  
  if (tabsStore.tabs.includes(name)) {
    isDuplicate.value = true
    return
  }
  
  await tabsStore.addTab(name)
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
        @contextmenu.prevent="openContextMenu($event, index)"
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
      <!-- 右键菜单 -->
      <div v-if="contextMenu.visible" class="ctx-mask" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu">
        <div class="ctx-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
          <div class="ctx-item" @click="startRename">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2L11 4L4.5 10.5H2.5V8.5L9 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            改名
          </div>
          <div class="ctx-item" :class="{ disabled: contextMenu.index === 0 }" @click="moveTab(-1)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 10V3M3 6.5L6.5 3L10 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            左移
          </div>
          <div class="ctx-item" :class="{ disabled: contextMenu.index === tabsStore.tabs.length - 1 }" @click="moveTab(1)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 3V10M10 6.5L6.5 10L3 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            右移
          </div>
          <div class="ctx-divider"></div>
          <div class="ctx-item danger" @click="startDelete">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5H11M4.5 3.5V2.5H8.5V3.5M5 6V10M8 6V10M3 3.5L3.5 11H9.5L10 3.5H3Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            删除
          </div>
        </div>
      </div>

      <!-- 改名弹窗 -->
      <transition name="dialog">
        <div v-if="showRenameDialog" class="dialog-overlay" @click="showRenameDialog = false">
          <div class="dialog-content" @click.stop>
            <div class="dialog-header">改名</div>
            <input
              v-model="renameName"
              class="dialog-input"
              :class="{ error: renameIsDuplicate }"
              placeholder="输入新名称"
              @keyup.enter="confirmRename"
              autofocus
            />
            <div v-if="renameIsDuplicate" class="error-message">房间名称已存在</div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel" @click="showRenameDialog = false">取消</button>
              <button class="dialog-btn confirm" :disabled="renameIsDuplicate || !renameName.trim()" @click="confirmRename">确定</button>
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
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.25)"');
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(59, 130, 246, 0.2)"');
  border-radius: 26px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: v-bind('themeStore.currentTheme?.isDark ? "none" : "0 4px 16px rgba(59, 130, 246, 0.08)"');
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
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.15)"');
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 18px;
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
  box-shadow: 
    0 4px 16px v-bind('themeStore.currentTheme?.isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(59, 130, 246, 0.15)"'),
    inset 0 1px 2px v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.3)"'),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(59, 130, 246, 0.25)"');
}

.liquid-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)"'), transparent);
  opacity: 0.5;
}

.liquid-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%);
  border-radius: 18px;
  pointer-events: none;
  opacity: v-bind('themeStore.currentTheme?.isDark ? "0.6" : "0.4"');
}

.empty-hint {
  color: v-bind('themeStore.textColorSecondary');
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
  color: v-bind('themeStore.textColorSecondary');
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
  text-shadow: none;
}

.nav-item:hover {
  color: v-bind('themeStore.textColorHover');
}

.nav-item.active {
  color: v-bind('themeStore.textColor');
  font-weight: 600;
}

.nav-item.drag-over {
  border-left: 2px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.6)" : "rgba(59,130,246,0.8)"');
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.08)"');
}

.nav-item[draggable="true"] {
  cursor: grab;
}

.nav-item[draggable="true"]:active {
  cursor: grabbing;
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
  color: v-bind('themeStore.textColorSecondary');
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
  color: v-bind('themeStore.textColor');
}

.add-btn:hover::before {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 2px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.add-btn:active::before {
  background: rgba(255, 255, 255, 0.12);
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

/* 右键菜单 */
.ctx-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.ctx-menu {
  position: fixed;
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(10,30,40,0.92)" : "rgba(255,255,255,0.92)"');
  backdrop-filter: blur(16px);
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.12)" : "rgba(59,130,246,0.2)"');
  border-radius: 10px;
  padding: 4px;
  min-width: 100px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 2001;
}

.ctx-item {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 7px;
  cursor: pointer;
  color: v-bind('themeStore.textColor');
  transition: background 0.15s;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctx-item:hover {
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.1)"');
}

.ctx-item.danger {
  color: #f87171;
}

.ctx-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.ctx-item.disabled {
  opacity: 0.35;
  pointer-events: none;
}

.ctx-divider {
  height: 1px;
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"');
  margin: 3px 4px;
}
</style>
