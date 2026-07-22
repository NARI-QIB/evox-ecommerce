// filepath: backend/controllers/userController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');
const Otp = require('../models/otpModel'); 
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); 
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const AppError = require('../utils/AppError');
const { PAGINATION, JWT } = require('../utils/constants');
const { buildEmailTemplate } = require('../utils/emailTemplates');
const escapeRegex = require('../utils/escapeRegex'); 

const hashData = (data) => crypto.createHash('sha256').update(data.toString()).digest('hex');

const checkStrictOtpExpiration = (createdAt) => {
  const timeDifference = Date.now() - createdAt.getTime();
  return timeDifference > 600000;
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('Please provide all fields', 400);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = hashData(otp);

  let user = await User.findOne({ email });

  if (user) {
    if (user.isVerified) {
      throw new AppError('User already exists. Please log in.', 400);
    } else {
      user.name = name;
      user.password = password;
      await user.save();
      await Otp.deleteMany({ email, type: 'activation' });
    }
  } else {
    user = await User.create({ name, email, password });
  }

  await Otp.create({ email, otp: hashedOtp, type: 'activation' });

  const htmlContent = buildEmailTemplate(
    `Welcome to the team, ${user.name}!`,
    'Thank you for registering. To activate your account and gain full access to our store, please use the secure verification code below:',
    otp, 
    'This code is valid for 10 minutes. If you did not create this account, please ignore this email.'
  );

  try {
    await sendEmail({
      email: user.email,
      subject: `${process.env.STORE_NAME || 'EVOX'} - Account Activation`,
      message: `Your OTP is ${otp}`, 
      html: htmlContent,             
    });

    res.status(201).json({ message: 'Registration successful. Please check your email for the activation OTP.', email: user.email });
  } catch (error) {
    await Otp.deleteMany({ email, type: 'activation' });
    throw new AppError('User registered, but activation email could not be sent.', 500);
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) throw new AppError('Please verify your email to activate your account', 401);
    if (user.isDeleted) throw new AppError('Account has been deactivated', 403);

    generateToken(res, user._id);
    res.status(200).json({ success: true, _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  } else {
    throw new AppError('Invalid email or password', 401);
  }
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError('Google ID token is required', 400);

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  } catch (error) {
    throw new AppError('Invalid or expired Google token', 401);
  }

  const { sub, email, name } = ticket.getPayload(); 
  let user = await User.findOne({ email });

  if (user) {
    if (user.isDeleted) throw new AppError('Account has been deactivated', 403);
    if (!user.googleId) {
      user.googleId = sub;
      user.isVerified = true; 
      await user.save();
    }
    generateToken(res, user._id);
    res.status(200).json({ success: true, _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  } else {
    const randomPassword = crypto.randomBytes(20).toString('hex');
    user = await User.create({ name, email, password: randomPassword, googleId: sub, isVerified: true });
    generateToken(res, user._id);
    res.status(201).json({ success: true, _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0), 
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.cookie('jwt_refresh', '', {
    httpOnly: true,
    expires: new Date(0), 
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// 🌟 تجديد التوكن باستخدام مفتاح الـ Refresh المنفصل أمنياً
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.jwt_refresh;
  if (!refreshToken) throw new AppError('No refresh token found', 401);

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isDeleted) throw new AppError('User not found or deactivated', 401);

    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) throw new AppError('Password recently changed', 401);
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const accessToken = jwt.sign({ id: user._id }, accessSecret, { expiresIn: '15m' });
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

const verifyAccount = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Please provide email and OTP', 400);

  const validOtp = await Otp.findOne({ email, otp: hashData(otp), type: 'activation' });
  if (!validOtp) throw new AppError('Invalid or expired OTP', 400);

  if (checkStrictOtpExpiration(validOtp.createdAt)) {
    await Otp.deleteOne({ _id: validOtp._id });
    throw new AppError('OTP has expired strictly.', 400);
  }

  const user = await User.findOne({ email });
  user.isVerified = true;
  await user.save();
  await Otp.deleteOne({ _id: validOtp._id });

  res.status(200).json({ message: 'Account activated successfully. You can now log in.' });
});

const resendActivationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide an email', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Account is already verified', 400);

  await Otp.deleteMany({ email, type: 'activation' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.create({ email, otp: hashData(otp), type: 'activation' });

  const htmlContent = buildEmailTemplate(
    'New Activation Code',
    'You recently requested a new activation code for your account. Please use the OTP below to complete your registration:',
    otp,
    'This code is valid for 10 minutes. If you did not request this, please ignore this email.'
  );

  try {
    await sendEmail({ email: user.email, subject: `${process.env.STORE_NAME || 'EVOX'} - New Activation Code`, message: `Your new OTP is ${otp}`, html: htmlContent });
    res.status(200).json({ message: 'A new activation OTP has been sent to your email' });
  } catch (error) {
    throw new AppError('Email could not be sent. Please try again later.', 500);
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide an email', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);

  await Otp.deleteMany({ email, type: 'resetPassword' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.create({ email, otp: hashData(otp), type: 'resetPassword' });

  const htmlContent = buildEmailTemplate('Password Reset Request', 'We received a request to reset the password for your account. Please use the verification code below to proceed:', otp, 'This code is valid for 10 minutes. If you did not request a password reset, please secure your account immediately.');

  try {
    await sendEmail({ email: user.email, subject: `${process.env.STORE_NAME || 'EVOX'} - Password Reset`, message: `Your OTP is ${otp}`, html: htmlContent });
    res.status(200).json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    await Otp.deleteMany({ email, type: 'resetPassword' });
    throw new AppError('Email could not be sent. Please try again later.', 500);
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Please provide email and OTP', 400);

  const validOtp = await Otp.findOne({ email, otp: hashData(otp), type: 'resetPassword' });
  if (!validOtp) throw new AppError('Invalid or expired OTP', 400);

  if (checkStrictOtpExpiration(validOtp.createdAt)) {
    await Otp.deleteOne({ _id: validOtp._id });
    throw new AppError('OTP has expired strictly.', 400);
  }

  res.status(200).json({ message: 'OTP verified successfully. You can now proceed to reset your password.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) throw new AppError('Please provide email, OTP, and new password', 400);

  const validOtp = await Otp.findOne({ email, otp: hashData(otp), type: 'resetPassword' });
  if (!validOtp) throw new AppError('Invalid or expired OTP', 400);

  if (checkStrictOtpExpiration(validOtp.createdAt)) {
    await Otp.deleteOne({ _id: validOtp._id });
    throw new AppError('OTP has expired strictly.', 400);
  }

  const user = await User.findOne({ email });
  user.password = newPassword;
  await user.save();
  await Otp.deleteOne({ _id: validOtp._id });

  res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('wishlist', 'name image price');
  if (!user) throw new AppError('User not found', 404);
  
  res.status(200).json({
    _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin,
    addresses: user.addresses, wishlist: user.wishlist, createdAt: user.createdAt, updatedAt: user.updatedAt,
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  user.name = req.body.name || user.name;
  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, 
    isAdmin: updatedUser.isAdmin, addresses: updatedUser.addresses, wishlist: updatedUser.wishlist,
  });
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword) throw new AppError('Please provide a new password', 400);

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const isFirstTimeGoogleUser = user.googleId && !user.passwordChangedAt;

  if (isFirstTimeGoogleUser && !oldPassword) {
    user.password = newPassword;
  } else {
    if (!oldPassword) throw new AppError('Please provide your current password', 400);
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) throw new AppError('Invalid old password', 401);
    
    user.password = newPassword;
  }

  await user.save();
  res.status(200).json({ message: 'Password updated successfully' });
});

const requestEmailUpdate = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) throw new AppError('Please provide a new email address', 400);

  const emailExists = await User.findOne({ email: newEmail });
  if (emailExists) throw new AppError('Email is already registered to another user', 400);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const verificationToken = jwt.sign(
    { id: req.user._id, newEmail, otp: hashData(otp) },
    accessSecret,
    { expiresIn: JWT.VERIFICATION_EXPIRES_IN }
  );

  const htmlContent = buildEmailTemplate(
    'Verify New Email Address',
    'We received a request to change your account email. Please use the verification code below to confirm this new email address:',
    otp, 
    'This code is valid for 15 minutes. If you did not request this change, please ignore this email and secure your account.'
  );

  try {
    await sendEmail({ email: newEmail, subject: `${process.env.STORE_NAME || 'EVOX'} - Verify New Email`, message: `Your OTP is ${otp}`, html: htmlContent });
    res.status(200).json({ message: 'An OTP has been sent to your new email.', verificationToken });
  } catch (error) {
    throw new AppError('Failed to send verification email. Please try again later.', 500);
  }
});

const verifyEmailUpdate = asyncHandler(async (req, res) => {
  const { verificationToken, otp } = req.body;
  if (!verificationToken || !otp) throw new AppError('Verification token and OTP are required', 400);

  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(verificationToken, accessSecret);
    if (decoded.id !== req.user._id.toString()) throw new AppError('Not authorized to use this token', 401);
    if (decoded.otp !== hashData(otp)) throw new AppError('Invalid OTP code', 400);

    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);

    user.email = decoded.newEmail;
    const updatedUser = await user.save();
    generateToken(res, updatedUser._id);

    res.status(200).json({
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, isAdmin: updatedUser.isAdmin,
      message: 'Email updated successfully',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid verification session. Please restart the process.', 400);
    }
    throw new AppError(error.message === 'Invalid OTP code' ? 'Invalid OTP code' : 'Verification failed.', 400);
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.pageNumber) || 1);
  const keywordStr = req.query.keyword ? req.query.keyword.trim() : '';

  let filter = { isDeleted: false }; 
  if (keywordStr) {
    const safeKeyword = escapeRegex(keywordStr);

    filter.$or = [
      { name: { $regex: safeKeyword, $options: 'i' } },
      { email: { $regex: safeKeyword, $options: 'i' } },
    ];
    if (keywordStr.match(/^[0-9a-fA-F]{24}$/)) filter.$or.push({ _id: keywordStr });
  }

  const count = await User.countDocuments(filter);
  
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1, _id: -1 })
    .limit(PAGINATION.USERS_PER_PAGE).skip(PAGINATION.USERS_PER_PAGE * (page - 1));

  res.status(200).json({ users, page, pages: Math.ceil(count / PAGINATION.USERS_PER_PAGE) });
});

const adminTestRoute = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin! You have full access.", adminDetails: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.isAdmin) throw new AppError('Cannot delete admin user', 400);
  
  user.isDeleted = true;
  user.email = `${user.email}_deleted_${Date.now()}`; 
  await user.save();
  
  res.status(200).json({ message: 'User archived (Soft Deleted) successfully and email freed.' });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user || user.isDeleted) throw new AppError('User not found', 404);
  res.status(200).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) throw new AppError('User not found', 404);

  if (req.user._id.toString() === user._id.toString() && req.body.isAdmin === false) {
    throw new AppError('System Protection: You cannot revoke your own admin privileges.', 400);
  }

  if (req.body.email && req.body.email !== user.email) {
    const emailExists = await User.findOne({ email: req.body.email, isDeleted: false });
    if (emailExists) {
      throw new AppError('Email is already in use by another active account.', 400);
    }
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.isAdmin = req.body.isAdmin === undefined ? user.isAdmin : Boolean(req.body.isAdmin);
  
  const updatedUser = await user.save();
  res.status(200).json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, isAdmin: updatedUser.isAdmin });
});

const addUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  if (user.addresses.length >= 10) {
    throw new AppError('You have reached the maximum number of saved addresses (10). Please delete an old address first.', 400);
  }

  const { addressName, address, city, postalCode, country, phone } = req.body;
  if (!addressName || !address || !city || !postalCode || !country || !phone) throw new AppError('Please provide all address fields', 400);

  user.addresses.push({ addressName, address, city, postalCode, country, phone });
  await user.save();
  res.status(201).json(user.addresses);
});

const deleteUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const addressToDelete = user.addresses.find((addr) => addr._id.toString() === req.params.addressId.toString());
  if (!addressToDelete) throw new AppError('Address not found', 404);

  user.addresses = user.addresses.filter((addr) => addr._id.toString() !== req.params.addressId.toString());
  
  if (addressToDelete.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  
  await user.save();
  res.status(200).json(user.addresses);
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const addressToUpdate = user.addresses.find((addr) => addr._id.toString() === req.params.addressId.toString());
  if (!addressToUpdate) throw new AppError('Address not found', 404);

  const { addressName, address, city, postalCode, country, phone } = req.body;
  addressToUpdate.addressName = addressName || addressToUpdate.addressName;
  addressToUpdate.address = address || addressToUpdate.address;
  addressToUpdate.city = city || addressToUpdate.city;
  addressToUpdate.postalCode = postalCode || addressToUpdate.postalCode;
  addressToUpdate.country = country || addressToUpdate.country;
  addressToUpdate.phone = phone || addressToUpdate.phone; 

  await user.save();
  res.status(200).json(user.addresses);
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const addressExists = user.addresses.find((addr) => addr._id.toString() === req.params.addressId.toString());
  if (!addressExists) throw new AppError('Address not found', 404);

  user.addresses.forEach((addr) => { addr.isDefault = false; });
  addressExists.isDefault = true;
  await user.save();
  res.status(200).json(user.addresses);
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const { productId } = req.body;
  if (!productId) throw new AppError('Please provide a product ID', 400);

  const alreadyAdded = user.wishlist.find((id) => id.toString() === productId.toString());
  if (alreadyAdded) user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
  else user.wishlist.push(productId);

  await user.save();
  res.status(200).json(user.wishlist);
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name image price');
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json(user.wishlist);
});

const syncCart = asyncHandler(async (req, res) => {
  if (!req.body.cartItems || !Array.isArray(req.body.cartItems)) {
    throw new AppError('Invalid cart payload structure', 400);
  }

  const sanitizedIncomingCart = req.body.cartItems
    .filter(item => {
      const id = item?.product || item?._id;
      return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    })
    .map(item => {
      const id = item.product || item._id;
      return {
        product: id,
        name: typeof item.name === 'object' ? (item.name.en || 'Unknown') : (item.name || 'Unknown'),
        image: typeof item.image === 'string' ? item.image : '/images/placeholder.png',
        price: Number(item.price) || 0,
        qty: Math.min(Math.max(1, Number(item.qty) || 1), 99),
        selectedSize: item.selectedSize ? String(item.selectedSize) : ''
      };
    });

  if (sanitizedIncomingCart.length === 0 && req.body.clearCart !== true) {
     const user = await User.findById(req.user._id).select('cart');
     return res.status(200).json(user ? user.cart : []);
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: { cart: sanitizedIncomingCart } },
    { new: true } 
  ).select('cart');

  if (!updatedUser) throw new AppError('User not found', 404);

  res.status(200).json(updatedUser.cart);
});

module.exports = {
  registerUser, authUser, getUserProfile, updateUserProfile, updateUserPassword,
  requestEmailUpdate, verifyEmailUpdate, getUsers, adminTestRoute, deleteUser,
  getUserById, updateUser, addUserAddress, deleteUserAddress, updateUserAddress,
  setDefaultAddress, toggleWishlist, getWishlist, forgotPassword, verifyOtp,      
  resetPassword, verifyAccount, resendActivationEmail, googleLogin, logoutUser, syncCart,
  refreshAccessToken
};