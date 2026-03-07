import { Router } from 'express';
import * as dbController from '../controllers/database';
import * as backupController from '../controllers/backup';

const router = Router();

// 数据库操作路由
router.post('/connect', dbController.connect);
router.post('/tables', dbController.getTables);
router.post('/schema', dbController.getSchema);
router.post('/query', dbController.executeQuery);
router.post('/count', dbController.getCount);
router.post('/views', dbController.getViews);
router.post('/triggers', dbController.getTriggers);

// 备份导出路由
router.post('/export', backupController.exportDatabase);
router.post('/backup', backupController.backup);

export default router;
