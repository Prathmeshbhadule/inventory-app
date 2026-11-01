const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'SKU must be 3-20 characters long and contain only uppercase letters, numbers, hyphens, and underscores'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Electronics',
          'Clothing',
          'Home & Kitchen',
          'Books',
          'Health & Beauty',
          'Sports',
          'Toys & Games',
          'Office Supplies',
          'Other',
        ],
        message: '{VALUE} is not a supported category',
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    quantityInStock: {
      type: Number,
      required: [true, 'Quantity in stock is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for quantity',
      },
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
      default: 'In Stock',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    supplier: {
      name: { type: String, trim: true, default: 'General Supplier' },
      contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Auto-update status before saving document if not marked Discontinued
productSchema.pre('save', function () {
  if (this.status !== 'Discontinued') {
    if (this.quantityInStock === 0) {
      this.status = 'Out of Stock';
    } else if (this.quantityInStock <= this.lowStockThreshold) {
      this.status = 'Low Stock';
    } else {
      this.status = 'In Stock';
    }
  }
});

// Full-text index for fast search
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
