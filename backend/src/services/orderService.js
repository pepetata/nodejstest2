const orderModel = require('../models/orderModel');
const menuItemModel = require('../models/menuItemModel');

class OrderService {
    async createOrder(userId, orderData) {
        const { items, deliveryAddress, specialInstructions } = orderData;

        // Validate menu items and calculate total
        let totalAmount = 0;
        for (const item of items) {
            const menuItem = await menuItemModel.findById(item.menuItemId);
            if (!menuItem) {
                throw new Error(`Menu item with id ${item.menuItemId} not found`);
            }
            if (!menuItem.isAvailable) {
                throw new Error(`Menu item ${menuItem.name} is not available`);
            }
            totalAmount += menuItem.price * item.quantity;
        }

        // Create order
        const order = await orderModel.create({
            userId,
            items,
            totalAmount,
            deliveryAddress,
            specialInstructions,
            status: 'pending'
        });

        return order;
    }

    async getOrderById(orderId, userId) {
        const order = await orderModel.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if user owns this order (or is admin)
        if (order.userId !== userId) {
            throw new Error('Unauthorized to view this order');
        }

        return order;
    }

    async getUserOrders(userId) {
        return await orderModel.findByUserId(userId);
    }

    async updateOrderStatus(orderId, status) {
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid order status');
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        return await orderModel.updateStatus(orderId, status);
    }
}

module.exports = new OrderService();
