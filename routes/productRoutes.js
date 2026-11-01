const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const {
  idParamValidator,
  createProductValidator,
  updateProductValidator,
  updateStockValidator,
  queryProductsValidator,
} = require('../validators/productValidator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventoryStats,
} = require('../controllers/productController');

// Aggregate summary metrics route (must be before :id to avoid route collision)
router.get('/stats/summary', getInventoryStats);

// Main CRUD Routes
router
  .route('/')
  .get(queryProductsValidator, validate, getProducts)
  .post(createProductValidator, validate, createProduct);

router
  .route('/:id')
  .get(idParamValidator, validate, getProductById)
  .put(updateProductValidator, validate, updateProduct)
  .delete(idParamValidator, validate, deleteProduct);

// Patch endpoint for quick stock adjustment
router
  .route('/:id/stock')
  .patch(updateStockValidator, validate, updateStock);

module.exports = router;
