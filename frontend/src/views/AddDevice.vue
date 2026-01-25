<!--
  添加设备页面
  功能：添加新设备，选择设备类型、子类型、所属房间等信息
  路由：/equipment
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useDevicesStore } from '@/features/device/devices.store'
import { useTabsStore } from '@/features/layout/tabs'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useNameOverflow } from '@/shared/composables'
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

const devicesStore = useDevicesStore()
const tabsStore = useTabsStore()
const router = useRouter()
const showForm = ref(false)
const { checkNameOverflow, isNameOverflow } = useNameOverflow()

const formData = ref({ name: '', type: '', lightType: '', switchType: '', cleanerType: '', securityType: '', environmentType: '', personalType: '', bathroomType: '', kitchenType: '', networkType: '', entertainmentType: '', otherType: '', location: '' })

// 使用导入的设备类型常量
const deviceTypes = DEVICE_TYPES
const lightTypes = LIGHT_TYPES
const switchTypes = SWITCH_TYPES
const cleanerTypes = CLEANER_TYPES
const securityTypes = SECURITY_TYPES
const environmentTypes = ENVIRONMENT_TYPES
const personalTypes = PERSONAL_TYPES
const bathroomTypes = BATHROOM_TYPES
const kitchenTypes = KITCHEN_TYPES
const networkTypes = NETWORK_TYPES
const entertainmentTypes = ENTERTAINMENT_TYPES
const otherTypes = OTHER_TYPES

const openAddForm = () => {
  if (tabsStore.tabs.length === 0) {
    ElMessage.warning('请先在标准模式下添加房间导航')
    return
  }
  showForm.value = !showForm.value
}

const addDevice = () => {
  if (!formData.value.name || !formData.value.location) return
  
  // 获取当前设备的子类型
  const getCurrentSubType = () => {
    switch (formData.value.type) {
      case 'light': return formData.value.lightType
      case 'switch': return formData.value.switchType
      case 'cleaner': return formData.value.cleanerType
      case 'security': return formData.value.securityType
      case 'environment': return formData.value.environmentType
      case 'personal': return formData.value.personalType
      case 'bathroom': return formData.value.bathroomType
      case 'kitchen': return formData.value.kitchenType
      case 'network': return formData.value.networkType
      case 'entertainment': return formData.value.entertainmentType
      case 'other': return formData.value.otherType
      default: return ''
    }
  }
  
  // 获取已有设备的子类型
  const getDeviceSubType = (d: typeof devicesStore.devices[0]) => {
    switch (d.type) {
      case 'light': return d.lightType
      case 'switch': return d.switchType
      case 'cleaner': return d.cleanerType
      case 'security': return d.securityType
      case 'environment': return d.environmentType
      case 'personal': return d.personalType
      case 'bathroom': return d.bathroomType
      case 'kitchen': return d.kitchenType
      case 'network': return d.networkType
      case 'entertainment': return d.entertainmentType
      case 'other': return d.otherType
      default: return ''
    }
  }
  
  const currentSubType = getCurrentSubType()
  const isDuplicate = devicesStore.devices.some(
    d => d.name === formData.value.name && d.type === formData.value.type && getDeviceSubType(d) === currentSubType
  )
  
  if (isDuplicate) {
    ElMessage.warning('该设备已存在，请勿重复添加')
    return
  }
  
  devicesStore.addDevice({
    id: Date.now().toString(),
    ...formData.value,
    status: 'online'
  })
  formData.value = { name: '', type: '', lightType: '', switchType: '', cleanerType: '', securityType: '', environmentType: '', personalType: '', bathroomType: '', kitchenType: '', networkType: '', entertainmentType: '', otherType: '', location: '' }
  showForm.value = false
  router.push('/')
}

const getTypeLabel = (type: string) => getLabelByValue(deviceTypes, type)
const getLightTypeLabel = (lightType: string) => getLabelByValue(lightTypes, lightType)
const getSwitchTypeLabel = (switchType: string) => getLabelByValue(switchTypes, switchType)
const getCleanerTypeLabel = (cleanerType: string) => getLabelByValue(cleanerTypes, cleanerType)
const getSecurityTypeLabel = (securityType: string) => getLabelByValue(securityTypes, securityType)
const getEnvironmentTypeLabel = (environmentType: string) => getLabelByValue(environmentTypes, environmentType)
const getPersonalTypeLabel = (personalType: string) => getLabelByValue(personalTypes, personalType)
const getBathroomTypeLabel = (bathroomType: string) => getLabelByValue(bathroomTypes, bathroomType)
const getKitchenTypeLabel = (kitchenType: string) => getLabelByValue(kitchenTypes, kitchenType)
const getNetworkTypeLabel = (networkType: string) => getLabelByValue(networkTypes, networkType)
const getEntertainmentTypeLabel = (entertainmentType: string) => getLabelByValue(entertainmentTypes, entertainmentType)
const getOtherTypeLabel = (otherType: string) => getLabelByValue(otherTypes, otherType)
</script>

<template>
  <div class="mode-content">
    <div class="header">
      <h2>设备管理</h2>
      <div class="add-button" @click="openAddForm">
        <span class="add-text">{{ showForm ? '取消' : '+ 添加设备' }}</span>
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
                v-for="type in deviceTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="灯具类型" v-if="formData.type === 'light'">
            <el-select 
              v-model="formData.lightType" 
              placeholder="选择灯具类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="light in lightTypes"
                :key="light.value"
                :label="light.label"
                :value="light.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="开关类型" v-if="formData.type === 'switch'">
            <el-select 
              v-model="formData.switchType" 
              placeholder="选择开关类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="sw in switchTypes"
                :key="sw.value"
                :label="sw.label"
                :value="sw.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="清洁电器类型" v-if="formData.type === 'cleaner'">
            <el-select 
              v-model="formData.cleanerType" 
              placeholder="选择清洁电器类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="cleaner in cleanerTypes"
                :key="cleaner.value"
                :label="cleaner.label"
                :value="cleaner.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="安防类型" v-if="formData.type === 'security'">
            <el-select 
              v-model="formData.securityType" 
              placeholder="选择安防类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="security in securityTypes"
                :key="security.value"
                :label="security.label"
                :value="security.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="环境电器类型" v-if="formData.type === 'environment'">
            <el-select 
              v-model="formData.environmentType" 
              placeholder="选择环境电器类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="env in environmentTypes"
                :key="env.value"
                :label="env.label"
                :value="env.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="个护与起居类型" v-if="formData.type === 'personal'">
            <el-select 
              v-model="formData.personalType" 
              placeholder="选择个护与起居类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="personal in personalTypes"
                :key="personal.value"
                :label="personal.label"
                :value="personal.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="卫浴类型" v-if="formData.type === 'bathroom'">
            <el-select 
              v-model="formData.bathroomType" 
              placeholder="选择卫浴类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="bathroom in bathroomTypes"
                :key="bathroom.value"
                :label="bathroom.label"
                :value="bathroom.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="厨房电器类型" v-if="formData.type === 'kitchen'">
            <el-select 
              v-model="formData.kitchenType" 
              placeholder="选择厨房电器类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="kitchen in kitchenTypes"
                :key="kitchen.value"
                :label="kitchen.label"
                :value="kitchen.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="路由网关类型" v-if="formData.type === 'network'">
            <el-select 
              v-model="formData.networkType" 
              placeholder="选择路由网关类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="network in networkTypes"
                :key="network.value"
                :label="network.label"
                :value="network.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="影音娱乐类型" v-if="formData.type === 'entertainment'">
            <el-select 
              v-model="formData.entertainmentType" 
              placeholder="选择影音娱乐类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="entertainment in entertainmentTypes"
                :key="entertainment.value"
                :label="entertainment.label"
                :value="entertainment.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="其他类型" v-if="formData.type === 'other'">
            <el-select 
              v-model="formData.otherType" 
              placeholder="选择其他类型" 
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="other in otherTypes"
                :key="other.value"
                :label="other.label"
                :value="other.value"
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
        <div class="device-name" :ref="(el) => checkNameOverflow(el as HTMLElement, device.id)">
          <span class="name-text" :class="{ overflow: isNameOverflow(device.id) }">{{ device.name }}</span>
        </div>
        <div class="device-meta">
          <span class="meta-item">{{ device.lightType ? getLightTypeLabel(device.lightType) : (device.switchType ? getSwitchTypeLabel(device.switchType) : (device.cleanerType ? getCleanerTypeLabel(device.cleanerType) : (device.securityType ? getSecurityTypeLabel(device.securityType) : (device.environmentType ? getEnvironmentTypeLabel(device.environmentType) : (device.personalType ? getPersonalTypeLabel(device.personalType) : (device.bathroomType ? getBathroomTypeLabel(device.bathroomType) : (device.kitchenType ? getKitchenTypeLabel(device.kitchenType) : (device.networkType ? getNetworkTypeLabel(device.networkType) : (device.entertainmentType ? getEntertainmentTypeLabel(device.entertainmentType) : (device.otherType ? getOtherTypeLabel(device.otherType) : getTypeLabel(device.type))))))))))) }}</span>
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
          <el-button size="small" round type="danger" @click="devicesStore.removeDevice(device.id)">
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
}

.header h2 {
  margin: 0;
  color: white;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.add-button {
  padding: 12px 26px;
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
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(10, 14, 26, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(
    135deg,
    rgba(26, 42, 78, 0.55) 0%,
    rgba(42, 58, 90, 0.5) 30%,
    rgba(58, 90, 122, 0.55) 70%,
    rgba(42, 58, 90, 0.5) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(10, 14, 26, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12);
}

.add-button:active { 
  transform: translateY(0) scale(0.98);
}

.add-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.form-card {
  background: linear-gradient(
    135deg,
    rgba(26, 42, 78, 0.85) 0%,
    rgba(42, 58, 90, 0.8) 30%,
    rgba(58, 90, 122, 0.85) 70%,
    rgba(42, 58, 90, 0.8) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.5),
    0 4px 16px rgba(10, 14, 26, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  position: relative;
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
    rgba(58, 106, 154, 0.04) 100%
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
  color: white;
  margin-bottom: 24px;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.device-form :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.device-form :deep(.el-input__wrapper),
.device-form :deep(.el-select__wrapper) {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  border-radius: 12px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.device-form :deep(.el-input__wrapper:hover),
.device-form :deep(.el-select__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
}

.device-form :deep(.el-input__wrapper.is-focus),
.device-form :deep(.el-select__wrapper.is-focus) {
  border-color: rgba(58, 106, 154, 0.5);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 0 0 3px rgba(58, 106, 154, 0.1);
}

.device-form :deep(.el-input__inner),
.device-form :deep(.el-select__placeholder),
.device-form :deep(.el-select__selected-item) {
  color: white;
  font-weight: 400;
}

.device-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.device-form :deep(.el-select__suffix),
.device-form :deep(.el-select__caret) {
  color: rgba(255, 255, 255, 0.6);
}

.device-form :deep(.el-button) {
  background: linear-gradient(
    135deg,
    rgba(58, 106, 154, 0.35) 0%,
    rgba(42, 58, 90, 0.28) 50%,
    rgba(58, 106, 154, 0.32) 100%
  );
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.device-form :deep(.el-button:hover) {
  background: linear-gradient(
    135deg,
    rgba(58, 106, 154, 0.45) 0%,
    rgba(42, 58, 90, 0.38) 50%,
    rgba(58, 106, 154, 0.42) 100%
  );
  border-color: rgba(255, 255, 255, 0.2);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 24px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  transition: all 0.3s ease;
  min-width: 200px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.device-card:hover {
  transform: translateY(-4px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
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
</style>
