// filepath: backend/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please add a name'], trim: true },
    email: { type: String, required: [true, 'Please add an email'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Please add a password'] },
    passwordChangedAt: { type: Date },
    googleId: { type: String },
    isAdmin: { type: Boolean, required: true, default: false },
    isVerified: { type: Boolean, required: true, default: false },
    addresses: [
      {
        addressName: { type: String, required: true }, address: { type: String, required: true },
        city: { type: String, required: true }, postalCode: { type: String, required: true },
        country: { type: String, required: true }, phone: { type: String, required: true }, 
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String }, image: { type: String }, price: { type: Number },
        qty: { type: Number }, selectedSize: { type: String }
      }
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; 
  
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;