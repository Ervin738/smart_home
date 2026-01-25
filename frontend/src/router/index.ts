/**
 * 路由配置
 * 路由：/ (标准模式), /equipment (添加设备)
 */
import { createRouter, createWebHistory } from 'vue-router'
import StandardMode from '@/views/StandardMode.vue'
import AddDevice from '@/views/AddDevice.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'standard',
      component: StandardMode
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: AddDevice
    }
  ],
})

export default router
