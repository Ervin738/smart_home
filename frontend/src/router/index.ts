/**
 * 路由配置
 * 路由：/ (标准模式), /equipment (添加设备), /floor-plan (平面图模式)
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'standard',
      component: () => import('@/views/StandardMode.vue')
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: () => import('@/views/AddDevice.vue')
    },
    {
      path: '/floor-plan',
      name: 'floor-plan',
      component: () => import('@/views/FloorPlan.vue')
    }
  ],
})

export default router
