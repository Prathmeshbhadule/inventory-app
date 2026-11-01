const Product = require('../models/Product');
const { isDbConnected } = require('../config/db');

/**
 * Helper to check DB connectivity
 */
const checkDbConnection = (res) => {
  if (!isDbConnected()) {
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is currently disconnected or unavailable. Please ensure MongoDB is running or check connection string.',
    });
    return false;
  }
  return true;
};

/**
 * @desc    Get all products with filtering, searching, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const {
      search,
      category,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter query object
    const filter = {};

    // Keyword Search
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Sorting
    const sort = {};
    const order = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;
    sort[sortBy] = order;

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count
    const [products, totalCount] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean({ virtuals: true }),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalProducts: totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasPrevPage: pageNum > 1,
        hasNextPage: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product Not Found',
        message: `No product found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public
 */
const createProduct = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const {
      name,
      sku,
      description,
      category,
      price,
      costPrice,
      quantityInStock,
      lowStockThreshold,
      status,
      tags,
      supplier,
    } = req.body;

    // Check for SKU uniqueness before creating
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate SKU',
        message: `A product with SKU "${sku.toUpperCase()}" already exists. Each product must have a unique SKU.`,
      });
    }

    const newProduct = new Product({
      name,
      sku: sku.toUpperCase(),
      description,
      category,
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      quantityInStock: Number(quantityInStock),
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10,
      status,
      tags: Array.isArray(tags) ? tags : [],
      supplier: supplier || {},
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product by ID
 * @route   PUT /api/products/:id
 * @access  Public
 */
const updateProduct = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product Not Found',
        message: `Cannot update. No product found with ID: ${req.params.id}`,
      });
    }

    // If SKU is being updated, verify uniqueness
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const skuExists = await Product.findOne({
        sku: req.body.sku.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate SKU',
          message: `Cannot update SKU to "${req.body.sku.toUpperCase()}" because it is already taken by another product.`,
        });
      }
      product.sku = req.body.sku.toUpperCase();
    }

    // Update allowable fields
    const fieldsToUpdate = [
      'name',
      'description',
      'category',
      'price',
      'costPrice',
      'quantityInStock',
      'lowStockThreshold',
      'status',
      'tags',
      'supplier',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick update for product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Public
 */
const updateStock = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const { operation = 'set', quantity } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product Not Found',
        message: `No product found with ID: ${req.params.id}`,
      });
    }

    const qty = parseInt(quantity, 10);
    let newQty = product.quantityInStock;

    if (operation === 'set') {
      if (qty < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Quantity',
          message: 'Stock quantity cannot be set to a negative number.',
        });
      }
      newQty = qty;
    } else if (operation === 'increment') {
      newQty += qty;
    } else if (operation === 'decrement') {
      if (newQty - qty < 0) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient Stock',
          message: `Cannot decrement by ${qty}. Current stock is only ${newQty}.`,
        });
      }
      newQty -= qty;
    }

    product.quantityInStock = newQty;
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: `Stock updated successfully via ${operation} operation.`,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product by ID
 * @route   DELETE /api/products/:id
 * @access  Public
 */
const deleteProduct = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product Not Found',
        message: `Cannot delete. No product found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Product "${product.name}" (${product.sku}) deleted successfully`,
      data: {
        id: product._id,
        sku: product.sku,
        name: product.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated inventory dashboard metrics using MongoDB Aggregation
 * @route   GET /api/products/stats/summary
 * @access  Public
 */
const getInventoryStats = async (req, res, next) => {
  try {
    if (!checkDbConnection(res)) return;

    // Use MongoDB Aggregation Pipeline for fast calculations
    const stats = await Product.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStockQuantity: { $sum: '$quantityInStock' },
                totalInventoryValue: {
                  $sum: { $multiply: ['$price', '$quantityInStock'] },
                },
                averagePrice: { $avg: '$price' },
                lowStockCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $lte: ['$quantityInStock', '$lowStockThreshold'] },
                          { $gt: ['$quantityInStock', 0] },
                          { $ne: ['$status', 'Discontinued'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                outOfStockCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$quantityInStock', 0] },
                          { $ne: ['$status', 'Discontinued'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                categoryStock: { $sum: '$quantityInStock' },
                totalValue: { $sum: { $multiply: ['$price', '$quantityInStock'] } },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const overallMetrics = (stats[0]?.overall[0]) || {
      totalProducts: 0,
      totalStockQuantity: 0,
      totalInventoryValue: 0,
      averagePrice: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    const categoryBreakdown = stats[0]?.byCategory || [];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts: overallMetrics.totalProducts,
          totalStockQuantity: overallMetrics.totalStockQuantity,
          totalInventoryValue: Number((overallMetrics.totalInventoryValue || 0).toFixed(2)),
          averagePrice: Number((overallMetrics.averagePrice || 0).toFixed(2)),
          lowStockCount: overallMetrics.lowStockCount,
          outOfStockCount: overallMetrics.outOfStockCount,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventoryStats,
};
