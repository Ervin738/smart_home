// 房间路由 - 处理房间的增删改查及排序接口
const { Router } = require('express');
const { getAllRooms, createRoom, updateRoom, deleteRoom, reorderRooms } = require('../controllers/roomController');

const router = Router();
router.get('/',          getAllRooms);
router.post('/',         createRoom);
router.post('/reorder',  reorderRooms);
router.put('/:id',       updateRoom);
router.delete('/:id',    deleteRoom);

module.exports = router;
