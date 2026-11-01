const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const {
  userIdValidator,
  registerUserValidator,
  loginUserValidator,
  updateUserValidator,
} = require('../validators/userValidator');
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// Register endpoint (explicit for /api/users/register)
router.post('/register', registerUserValidator, validate, registerUser);
router.get('/register', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
    message: 'User registration requires HTTP POST method. Please change the method dropdown in Postman from GET to POST.',
  });
});

// Login endpoint
router.post('/login', loginUserValidator, validate, loginUser);

// User CRUD root endpoints
router
  .route('/')
  .get(getAllUsers)
  .post(registerUserValidator, validate, registerUser);

router
  .route('/:id')
  .get(userIdValidator, validate, getUserById)
  .put(updateUserValidator, validate, updateUser)
  .delete(userIdValidator, validate, deleteUser);

module.exports = router;
