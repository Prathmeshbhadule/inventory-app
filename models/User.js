const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password hash in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Hash password before saving using built-in crypto
userSchema.pre('save', function () {
  if (this.isModified('password')) {
    const salt = 'salt_' + this.email;
    this.password = crypto.scryptSync(this.password, salt, 32).toString('hex');
  }
});

// Method to verify password
userSchema.methods.matchPassword = function (enteredPassword) {
  const salt = 'salt_' + this.email;
  const hash = crypto.scryptSync(enteredPassword, salt, 32).toString('hex');
  return this.password === hash;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
