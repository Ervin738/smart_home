import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') + '/api',
  timeout: 8000,
})

export interface DevicePayload {
  name: string
  type: string
  location?: string
  status?: Record<string, unknown>
  extra?: Record<string, unknown>
}

export const deviceApi = {
  getAll: () => api.get('/devices').then(r => r.data),
  create: (data: DevicePayload) => api.post('/devices', data).then(r => r.data),
  update: (id: string | number, data: Partial<DevicePayload>) =>
    api.put(`/devices/${id}`, data).then(r => r.data),
  delete: (id: string | number) => api.delete(`/devices/${id}`),
  getState: (id: string | number) =>
    api.get(`/devices/${id}/state`).then(r => r.data),
  updateState: (id: string | number, fields: Record<string, unknown>, subType?: string) =>
    api.patch(`/devices/${id}/state`, { subType, ...fields }).then(r => r.data),
  reorder: (ids: (string|number)[]) => api.post('/devices/reorder', { ids }).then(r => r.data),
}

export const roomApi = {
  getAll: () => api.get('/rooms').then(r => r.data),
  create: (name: string) => api.post('/rooms', { name }).then(r => r.data),
  update: (id: number, fields: Record<string, unknown>) => api.put(`/rooms/${id}`, fields).then(r => r.data),
  delete: (id: number) => api.delete(`/rooms/${id}`),
  reorder: (ids: number[]) => api.post('/rooms/reorder', { ids }).then(r => r.data),
}

export const sceneApi = {
  getAll: () => api.get('/scenes').then(r => r.data),
  create: (data: { name: string; rules: unknown[] }) =>
    api.post('/scenes', data).then(r => r.data),
  trigger: (id: string | number) =>
    api.post(`/scenes/${id}/trigger`).then(r => r.data),
}

export default api
