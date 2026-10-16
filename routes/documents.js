const express = require('express');
const controller = require('../controllers/documentsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Публичные страницы — доступны и гостю.
router.get('/', controller.list);
router.get('/item/:id', controller.show);

// Защищённые страницы: requireAuth выполняется только для этих маршрутов,
// перед контроллером (цепочка из нескольких middleware).
router.get('/add', requireAuth, controller.addForm);
router.post('/add', requireAuth, controller.create);

module.exports = router;
