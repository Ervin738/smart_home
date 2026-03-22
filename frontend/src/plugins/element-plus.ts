/**
 * Element Plus 按需导入配置
 * 只导入项目中实际使用的组件，减少打包体积
 */
import { 
  ElMessage,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElCard,
  ElIcon
} from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import type { App } from 'vue'

// 导出需要全局使用的组件
export { ElMessage }

// 导出安装函数，用于注册组件
export function setupElementPlus(app: App) {
  app.component('ElForm', ElForm)
  app.component('ElFormItem', ElFormItem)
  app.component('ElInput', ElInput)
  app.component('ElSelect', ElSelect)
  app.component('ElOption', ElOption)
  app.component('ElButton', ElButton)
  app.component('ElCard', ElCard)
  app.component('ElIcon', ElIcon)
  
  // 注册所有图标组件
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
}
