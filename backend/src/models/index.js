/**
 * Model Index File
 * Exports all models for easy importing
 */

const RestaurantModel = require('./RestaurantModel');
const RestaurantLocationModel = require('./RestaurantLocationModel');
const BillingAddressModel = require('./BillingAddressModel');
const PaymentInfoModel = require('./PaymentInfoModel');
const BaseModel = require('./BaseModel');

// Role models
const RoleModel = require('./RoleModel');
const UserRoleModel = require('./UserRoleModel');

// Legacy models (keeping for backward compatibility)
const userModel = require('./userModel');
const menuItemModel = require('./menuItemModel');
const orderModel = require('./orderModel');

module.exports = {
  // New restaurant models
  RestaurantModel,
  RestaurantLocationModel,
  BillingAddressModel,
  PaymentInfoModel,
  BaseModel,

  // Role models
  RoleModel,
  UserRoleModel,

  // Legacy models
  userModel,
  menuItemModel,
  orderModel,
};
