// 设备路由 - 处理设备的增删改查及排序接口
const { Router } = require('express');
const { getAllDevices, createDevice, updateDevice, deleteDevice, reorderDevices } = require('../controllers/deviceController');

const router = Router();
router.get('/',            getAllDevices);
router.post('/',           createDevice);
router.post('/reorder',    reorderDevices);
router.put('/:id',         updateDevice);
router.delete('/:id',      deleteDevice);

module.exports = router;
