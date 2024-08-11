const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status || "pending",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function validateDishQuantity(req, res, next) {
  const { data = {} } = req.body;
  const dishes = data.dishes || [];

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish."
    });
  }

  for (let i = 0; i < dishes.length; i++) {
    const quantity = dishes[i].quantity;
    if (quantity === undefined || quantity === null) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity.`
      });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`
      });
    }
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next()
  }
  return next({
    status: 404,
    message: `Order does not exist: ${orderId}.`
  })
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    return next({
        status: 400,
        message: `Order must include a ${propertyName}`
    });
  };
}

function update(req, res) {
  const { orderId } = req.params;
  const { data: { deliverTo, mobileNumber, dishes} = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
};

function validateOrderId(req, res, next) {
  const { id } = req.body.data || {};
  const foundOrder = res.locals.order;
  if (id && id !== foundOrder.id) {
      next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${foundOrder.id}`
      });
  }
  next();
}

function validateStatusProperty(req, res, next) {
  const { status } = req.body.data || {};
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];

  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed"
    });
  }
  if (!status || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    });
  }
  return next();
}

function validateOrderStatus(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`
    });
  }
  return next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  create: [
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      validateDishQuantity,
      create],
  read: [orderExists, read],
  update: [
      orderExists,
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      bodyDataHas("status"),
      validateOrderId,
      validateStatusProperty,
      validateDishQuantity,
      update],
  list,
  delete: [orderExists, validateOrderStatus, destroy],
};