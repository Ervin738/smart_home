import express from 'express';

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务正常运行' });
});

// 在这里导入其他路由模块
// import userRoutes from './userRoutes.js';
// router.use('/users', userRoutes);

export default router;
