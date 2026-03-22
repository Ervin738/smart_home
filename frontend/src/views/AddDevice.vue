<!--
  添加设备页面
  功能：添加新设备，选择设备类型、子类型、所属房间等信息
  路由：/equipment
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDevicesStore, type Device } from '@/features/device/store/devices.store'
import { useTabsStore } from '@/features/layout/tabs'
import { useRouter } from 'vue-router'
import { ElMessage } from '@/plugins/element-plus'
import { Grid, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useNameOverflow } from '@/shared/composables'
import { useThemeStore } from '@/stores/theme'
import { deviceApi } from '@/services/api'
import {
  DEVICE_TYPES,
  LIGHT_TYPES,
  SWITCH_TYPES,
  CLEANER_TYPES,
  SECURITY_TYPES,
  ENVIRONMENT_TYPES,
  PERSONAL_TYPES,
  BATHROOM_TYPES,
  KITCHEN_TYPES,
  NETWORK_TYPES,
  ENTERTAINMENT_TYPES,
  OTHER_TYPES,
  getLabelByValue
} from '@/constants/deviceOptions'

// 初始表单数据
const INITIAL_FORM_DATA = {
  name: '',
  type: '',
  lightType: '',
  switchType: '',
  cleanerType: '',
  securityType: '',
  environmentType: '',
  personalType: '',
  bathroomType: '',
  kitchenType: '',
  networkType: '',
  entertainmentType: '',
  otherType: '',
  location: ''
}

// 子类型配置映射
const SUB_TYPE_CONFIG = {
  light: { key: 'lightType', options: LIGHT_TYPES, label: '灯具类型' },
  switch: { key: 'switchType', options: SWITCH_TYPES, label: '开关类型' },
  cleaner: { key: 'cleanerType', options: CLEANER_TYPES, label: '清洁电器类型' },
  security: { key: 'securityType', options: SECURITY_TYPES, label: '安防类型' },
  environment: { key: 'environmentType', options: ENVIRONMENT_TYPES, label: '环境电器类型' },
  personal: { key: 'personalType', options: PERSONAL_TYPES, label: '个护与起居类型' },
  bathroom: { key: 'bathroomType', options: BATHROOM_TYPES, label: '卫浴类型' },
  kitchen: { key: 'kitchenType', options: KITCHEN_TYPES, label: '厨房电器类型' },
  network: { key: 'networkType', options: NETWORK_TYPES, label: '路由网关类型' },
  entertainment: { key: 'entertainmentType', options: ENTERTAINMENT_TYPES, label: '影音娱乐类型' },
  other: { key: 'otherType', options: OTHER_TYPES, label: '其他类型' }
} as const

const devicesStore = useDevicesStore()
const tabsStore = useTabsStore()
const router = useRouter()
const themeStore = useThemeStore()
const showForm = ref(false)
const { checkNameOverflow, isNameOverflow } = useNameOverflow()

const formData = ref({ ...INITIAL_FORM_DATA })

// 统计数据
const onlineDevicesCount = computed(() => 
  devicesStore.devices.filter(d => d.status === 'online').length
)

const offlineDevicesCount = computed(() => 
  devicesStore.devices.filter(d => d.status === 'offline').length
)

// 计算当前设备类型的子类型配置
const currentSubTypeConfig = computed(() => {
  return formData.value.type ? SUB_TYPE_CONFIG[formData.value.type as keyof typeof SUB_TYPE_CONFIG] : null
})

/**
 * 获取设备的子类型值
 * @param device - 设备对象（可以是 formData 或 store 中的设备）
 */
const getDeviceSubType = (device: any): string => {
  const config = SUB_TYPE_CONFIG[device.type as keyof typeof SUB_TYPE_CONFIG]
  return config ? device[config.key] || '' : ''
}

/**
 * 获取设备的显示标签
 * @param device - 设备对象
 */
const getDeviceLabel = (device: any): string => {
  const subType = getDeviceSubType(device)
  if (subType) {
    const config = SUB_TYPE_CONFIG[device.type as keyof typeof SUB_TYPE_CONFIG]
    return getLabelByValue(config.options, subType)
  }
  return getLabelByValue(DEVICE_TYPES, device.type)
}

/**
 * 重置表单数据
 */
const resetForm = () => {
  formData.value = { ...INITIAL_FORM_DATA }
}

/**
 * 打开/关闭添加表单
 */
const openAddForm = () => {
  if (tabsStore.tabs.length === 0) {
    ElMessage.warning('请先在标准模式下添加房间导航')
    return
  }
  showForm.value = !showForm.value
}

/**
 * 添加设备
 */
const addDevice = async () => {
  if (!formData.value.name || !formData.value.location) {
    ElMessage.warning('请填写设备名称和位置')
    return
  }

  const currentSubType = getDeviceSubType(formData.value)
  const isDuplicate = devicesStore.devices.some(
    d => d.name === formData.value.name &&
         d.type === formData.value.type &&
         getDeviceSubType(d) === currentSubType
  )
  if (isDuplicate) {
    ElMessage.warning('该设备已存在，请勿重复添加')
    return
  }

  const extra: Record<string, unknown> = {
    lightType:         formData.value.lightType,
    switchType:        formData.value.switchType,
    cleanerType:       formData.value.cleanerType,
    securityType:      formData.value.securityType,
    environmentType:   formData.value.environmentType,
    personalType:      formData.value.personalType,
    bathroomType:      formData.value.bathroomType,
    kitchenType:       formData.value.kitchenType,
    networkType:       formData.value.networkType,
    entertainmentType: formData.value.entertainmentType,
    otherType:         formData.value.otherType,
    ...(formData.value.type === 'environment' && formData.value.environmentType === 'heater'
      ? { targetTemp: 25 } : {}),
  }

  try {
    const created = await deviceApi.create({
      name:     formData.value.name,
      type:     formData.value.type,
      location: formData.value.location,
      status:   { power: false },
      extra,
    })
    devicesStore.addDevice({
      id:       String(created.id),
      name:     formData.value.name,
      type:     formData.value.type,
      location: formData.value.location,
      status:   'offline',
      ...extra,
    } as unknown as Device)
    resetForm()
    showForm.value = false
    router.push('/')
  } catch (err) {
    ElMessage.error('添加设备失败，请检查后端连接')
    console.error(err)
  }
}

const handleDeleteDevice = async (id: string) => {
  try {
    await deviceApi.delete(id)
    devicesStore.removeDevice(id)
  } catch (err) {
    ElMessage.error('删除设备失败')
    console.error(err)
  }
}

// 改名
const editingId = ref<string | null>(null)
const editingName = ref('')

const startRename = (device: Device) => {
  editingId.value = device.id
  editingName.value = device.name
}

const confirmRename = async (device: Device) => {
  const name = editingName.value.trim()
  if (!name) {
    ElMessage.warning('设备名称不能为空')
    return
  }
  if (name === device.name) {
    editingId.value = null
    return
  }
  try {
    await deviceApi.update(device.id, { name })
    devicesStore.setDeviceExtra(device.id, { name })
    ElMessage.success('改名成功')
  } catch (err) {
    ElMessage.error('改名失败')
    console.error(err)
  }
  editingId.value = null
}
</script>

<template>
  <div class="mode-content">
    <div class="header">
      <h2>设备管理</h2>
      
      <!-- 设备状态可视化统计面板 -->
      <div class="stats-panel">
        <el-card class="stat-card total-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="24"><Grid /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总设备</div>
              <div class="stat-value">{{ devicesStore.devices.length }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card online-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon :size="24"><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">在线设备</div>
              <div class="stat-value online">{{ onlineDevicesCount }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card offline-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon offline">
              <el-icon :size="24"><CircleCloseFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">离线设备</div>
              <div class="stat-value offline">{{ offlineDevicesCount }}</div>
            </div>
          </div>
        </el-card>
      </div>
      
      <div class="add-button" @click="openAddForm">
        <span class="add-text">{{ showForm ? '取消' : '+ 设备管理' }}</span>
      </div>
    </div>

    <transition name="slide">
      <div v-if="showForm" class="form-card">
        <div class="form-header">
          <span>添加新设备</span>
        </div>
        <el-form label-position="top" class="device-form">
          <el-form-item label="设备名称">
            <el-input 
              v-model="formData.name" 
              placeholder="例如：客厅主灯"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item label="设备类型">
            <el-select 
              v-model="formData.type" 
              placeholder="选择设备类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="type in DEVICE_TYPES"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>

          <!-- 动态子类型选择 -->
          <el-form-item 
            v-if="currentSubTypeConfig" 
            :label="currentSubTypeConfig.label"
          >
            <el-select 
              v-model="formData[currentSubTypeConfig.key]" 
              placeholder="选择子类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="option in currentSubTypeConfig.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="设备位置">
            <el-select 
              v-model="formData.location" 
              placeholder="选择设备位置" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="tab in tabsStore.tabs"
                :key="tab"
                :label="tab"
                :value="tab"
              />
            </el-select>
          </el-form-item>

          <el-button class="dialog-btn" size="large" style="width: 100%" @click="addDevice">
            确认添加
          </el-button>
        </el-form>
      </div>
    </transition>

    <div v-if="devicesStore.devices.length === 0 && !showForm" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" width="64" height="64">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p>还没有添加任何设备</p>
      <p class="empty-hint">点击上方按钮添加你的第一个设备</p>
    </div>

    <transition-group name="list" tag="div" class="devices-grid">
      <div v-for="device in devicesStore.devices" :key="device.id" class="device-card">
        <div class="device-name" :ref="(el) => el && checkNameOverflow(el as HTMLElement, device.id)">
          <template v-if="editingId === device.id">
            <el-input
              v-model="editingName"
              size="small"
              autofocus
              @blur="confirmRename(device)"
              @keyup.enter="confirmRename(device)"
              @keyup.esc="editingId = null"
              style="width: 100%"
            />
          </template>
          <template v-else>
            <span
              class="name-text"
              :class="{ overflow: isNameOverflow(device.id) }"
              title="点击改名"
              @click="startRename(device)"
            >{{ device.name }}</span>
          </template>
        </div>
        <div class="device-meta">
          <span class="meta-item">{{ getDeviceLabel(device) }}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item">{{ device.location }}</span>
        </div>
        <div class="device-status" :class="device.status">
          <span class="status-dot"></span>
          {{ device.status === 'online' ? '在线' : '离线' }}
        </div>
        <div class="device-actions">
          <el-button 
            :type="device.status === 'online' ? 'warning' : 'success'" 
            size="small" 
            round
            @click="devicesStore.toggleStatus(device.id)"
          >
            {{ device.status === 'online' ? '关闭' : '开启' }}
          </el-button>
          <el-button size="small" round type="danger" @click="handleDeleteDevice(device.id)">
            删除
          </el-button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.mode-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header h2 {
  margin: 0;
  color: white;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.add-button {
  padding: 12px 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 26px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.add-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 35%,
    transparent 65%,
    rgba(58, 106, 154, 0.04) 100%
  );
  pointer-events: none;
}

.add-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.add-button:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.18) 100%);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.08);
}

.add-button:active { 
  transform: translateY(0) scale(0.98);
}

.add-text {
  color: v-bind('themeStore.textColor');
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
  position: relative;
  z-index: 1;
}

.form-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  position: relative;
  color: v-bind('themeStore.textColor');
}

.form-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 35%,
    transparent 65%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 24px;
  pointer-events: none;
  z-index: 0;
}

.form-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 60%
  );
  border-radius: 24px;
  pointer-events: none;
  z-index: 0;
}

.form-card > * {
  position: relative;
  z-index: 1;
}

.form-header {
  font-size: 20px;
  font-weight: 600;
  color: v-bind('themeStore.textColor');
  margin-bottom: 24px;
  letter-spacing: 0.05em;
}

.device-form :deep(.el-form-item__label) {
  color: v-bind('themeStore.textColor');
  font-weight: 500;
  letter-spacing: 0.02em;
}

.device-form :deep(.el-input__wrapper),
.device-form :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: none;
  border-radius: 12px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.device-form :deep(.el-input__wrapper:hover),
.device-form :deep(.el-select__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.25);
}

.device-form :deep(.el-input__wrapper.is-focus),
.device-form :deep(.el-select__wrapper.is-focus) {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
}

.device-form :deep(.el-input__inner),
.device-form :deep(.el-select__placeholder),
.device-form :deep(.el-select__selected-item) {
  color: v-bind('themeStore.textColor');
  font-weight: 400;
}

.device-form :deep(.el-input__inner::placeholder) {
  color: v-bind('themeStore.textColorSecondary');
}

.device-form :deep(.el-select__suffix),
.device-form :deep(.el-select__caret) {
  color: v-bind('themeStore.textColorSecondary');
}

.device-form :deep(.el-button) {
  background: rgba(255, 255, 255, 0.3);
  color: v-bind('themeStore.textColor');
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.device-form :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
}

.device-form :deep(.el-button:active) {
  transform: scale(0.98);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.8);
}

.empty-icon { 
  margin-bottom: 16px; 
  display: flex;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}
.empty-state p { margin: 8px 0; font-size: 18px; font-weight: 500; }
.empty-hint { opacity: 0.6; font-size: 14px !important; }

.devices-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px 0;
}

.device-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 24px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  text-align: center;
  transition: all 0.3s ease;
  min-width: 200px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.device-card:hover {
  transform: translateY(-4px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.18) 100%);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.device-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  margin-left: auto;
  margin-right: auto;
}

.name-text {
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: border-color 0.2s;
}

.name-text:hover {
  border-bottom-color: rgba(255, 255, 255, 0.6);
}

.device-meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
}

.meta-divider { margin: 0 6px; }

.device-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.device-status.online {
  background: rgba(74, 222, 128, 0.35);
  color: #1b5e20;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.device-status.offline {
  background: rgba(248, 113, 113, 0.35);
  color: #b71c1c;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.device-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-20px); }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: scale(0.8); }

/* 统计面板样式 */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
  max-width: 600px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.stat-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: v-bind('themeStore.textColor');
  flex-shrink: 0;
}

.stat-icon.online {
  background: rgba(74, 222, 128, 0.25);
  color: #22c55e;
}

.stat-icon.offline {
  background: rgba(248, 113, 113, 0.25);
  color: #ef4444;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: v-bind('themeStore.textColorSecondary');
  margin-bottom: 2px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: v-bind('themeStore.textColor');
  line-height: 1;
}

.stat-value.online {
  color: #22c55e;
}

.stat-value.offline {
  color: #ef4444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-panel {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header h2 {
    text-align: center;
  }
  
  .stats-panel {
    max-width: 100%;
  }
}
</style>
