const { body, param, query } = require('express-validator');

const userIdValidator = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid User ID format. Must be a 24-character hexadecimal MongoDB ObjectId.'),
];

const registerUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be either "user", "admin", or "moderator".'),

  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a positive integer between 0 and 150.'),
];

const loginUserValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

const updateUserValidator = [
  ...userIdValidator,

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be either "user", "admin", or "moderator".'),

  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a positive integer between 0 and 150.'),
];

module.exports = {
  userIdValidator,
  registerUserValidator,
  loginUserValidator,
  updateUserValidator,
};
