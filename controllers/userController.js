const User = require('../models/User');
const { isDbConnected } = require('../config/db');

const checkDbConnection = (res) => {
  if (!isDbConnected()) {
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is disconnected. Please check MongoDB connection.',
    });
    return false;
  }
  return true;
};

/**
 * @desc    Register a new user
 * @route   POST /api/users/register OR POST /api/users
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const { name, email, password, role, age } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Email Conflict',
        message: `An account with email "${email}" already exists. Please use another email or log in.`,
      });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      age: age !== undefined ? Number(age) : undefined,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: savedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate/Login user
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.matchPassword(password)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid email or password credentials.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with search & pagination
 * @route   GET /api/users
 * @access  Public
 */
const getAllUsers = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const { search, role, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (role) {
      filter.role = role;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [users, totalCount] = await Promise.all([
      User.find(filter).skip(skip).limit(limitNum).lean({ virtuals: true }),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalUsers: totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: `No user found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user by ID
 * @route   PUT /api/users/:id
 * @access  Public
 */
const updateUser = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: `No user found with ID: ${req.params.id}`,
      });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.age !== undefined) user.age = req.body.age;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Email Conflict',
          message: `Email "${req.body.email}" is already used by another account.`,
        });
      }
      user.email = req.body.email.toLowerCase();
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user by ID
 * @route   DELETE /api/users/:id
 * @access  Public
 */
const deleteUser = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: `Cannot delete. No user found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `User "${user.name}" (${user.email}) deleted successfully`,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
