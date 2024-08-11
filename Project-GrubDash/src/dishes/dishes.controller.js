const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({ data: dishes });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next()
    }
    return next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

function validateDishId(req, res, next) {
    const { id } = req.body.data || {};
    const foundDish = res.locals.dish
    if (id && id !== foundDish.id) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${foundDish.id}`
        });
    }
    next();
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const foundDish = res.locals.dish;
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    res.json({ data: foundDish });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
  }

function validatePrice(req, res, next) {
    const { data = {} } = req.body;
    const price = data.price;
    if (Number.isInteger(price) && price > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0"
    });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      };
      next({
          status: 400,
          message: `Dish must include a ${propertyName}`
      });
    };
  }


module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        validatePrice,
        create],
    read: [dishExists, read],
    update: [
        dishExists,
        validateDishId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        validatePrice,
        update],
    list,
};
