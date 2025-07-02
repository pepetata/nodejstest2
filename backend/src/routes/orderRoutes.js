const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateOrder } = require('../utils/validationUtils');

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

router.post('/', validateOrder, orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
