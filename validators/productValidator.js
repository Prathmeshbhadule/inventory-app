const { body, param, query } = require('express-validator');

const validCategories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Health & Beauty',
  'Sports',
  'Toys & Games',
  'Office Supplies',
  'Other',
];

const validStatuses = ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];

const idParamValidator = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid product ID format. Must be a 24-character hexadecimal MongoDB ObjectId.'),
];

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters.'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU code is required.')
    .toUpperCase()
    .matches(/^[A-Z0-9_-]{3,20}$/)
    .withMessage('SKU must be 3-20 characters long and consist of uppercase letters, numbers, hyphens or underscores.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.')
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),

  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero.'),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number or zero.'),

  body('quantityInStock')
    .notEmpty()
    .withMessage('Quantity in stock is required.')
    .isInt({ min: 0 })
    .withMessage('Quantity in stock must be a non-negative integer.'),

  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer.'),

  body('status')
    .optional()
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(', ')}`),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings.'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each tag must be a string.'),

  body('supplier.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier name cannot exceed 100 characters.'),

  body('supplier.contactEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Supplier contact email must be a valid email address.')
    .normalizeEmail(),
];

const updateProductValidator = [
  ...idParamValidator,

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters.'),

  body('sku')
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9_-]{3,20}$/)
    .withMessage('SKU must be 3-20 characters long and consist of uppercase letters, numbers, hyphens or underscores.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('category')
    .optional()
    .trim()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero.'),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number or zero.'),

  body('quantityInStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity in stock must be a non-negative integer.'),

  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer.'),

  body('status')
    .optional()
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(', ')}`),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings.'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each tag must be a string.'),

  body('supplier.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier name cannot exceed 100 characters.'),

  body('supplier.contactEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Supplier contact email must be a valid email address.')
    .normalizeEmail(),
];

const updateStockValidator = [
  ...idParamValidator,

  body('operation')
    .optional()
    .isIn(['set', 'increment', 'decrement'])
    .withMessage('Operation must be either "set", "increment", or "decrement".'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt()
    .withMessage('Quantity must be an integer.'),
];

const queryProductsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a non-negative number.'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a non-negative number.'),

  query('category')
    .optional()
    .isIn(validCategories)
    .withMessage(`Category filter must be one of: ${validCategories.join(', ')}`),

  query('status')
    .optional()
    .isIn(validStatuses)
    .withMessage(`Status filter must be one of: ${validStatuses.join(', ')}`),

  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'quantityInStock', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, price, quantityInStock, createdAt, updatedAt.'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('sortOrder must be either "asc" or "desc".'),
];

module.exports = {
  idParamValidator,
  createProductValidator,
  updateProductValidator,
  updateStockValidator,
  queryProductsValidator,
};
