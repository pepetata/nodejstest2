const orderService = require('../services/orderService');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const order = await orderService.createOrder(req.user.id, req.body);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user.id);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
