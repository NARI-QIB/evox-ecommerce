// filepath: backend/controllers/categoryController.js
const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel'); 
const fs = require('fs');
const path = require('path');
const { autoTranslateJson } = require('../services/aiTranslationService'); 
const { deleteCloudinaryImage } = require('../config/cloudinary'); 
const AppError = require('../utils/AppError');
const cache = require('../utils/redisClient');

const safeDeleteFile = async (filePath) => {
  if (!filePath) return;
  if (filePath.startsWith('/images/') || !filePath.includes('cloudinary.com')) return;

  try {
    const isUsedInProducts = await Product.exists({ $or: [{ image: filePath }, { images: filePath }] });
    const isUsedInCategories = await Category.exists({ $or: [{ thumbnail: filePath }, { bannerDesktop: filePath }, { bannerMobile: filePath }] });
    
    if (!isUsedInProducts && !isUsedInCategories) {
      await deleteCloudinaryImage(filePath);
    }
  } catch (err) { 
    console.error(`Failed to delete file: ${filePath}`, err); 
  }
};

const getCategories = asyncHandler(async (req, res) => {
  const cachedCategories = await cache.get('categories_list');
  if (cachedCategories) return res.status(200).json(cachedCategories);

  const categories = await Category.find({});
  await cache.set('categories_list', categories, 86400); 
  res.status(200).json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, thumbnail, bannerDesktop, bannerMobile } = req.body;
  const categoryExists = await Category.findOne({ 'name.en': name?.en });
  
  if (categoryExists) throw new AppError('Category already exists', 400);
  
  const category = await Category.create({ 
    name: { en: name.en, ar: name.ar || '' }, 
    description: { en: description?.en || '', ar: description?.ar || '' }, 
    thumbnail, bannerDesktop, bannerMobile 
  });

  res.status(201).json(category);

  if (!name.ar || !description.ar) {
    autoTranslateJson({ name, description }).then(async (translated) => {
      category.name = translated.name;
      category.description = translated.description;
      await category.save(); 
    }).catch(err => console.error("Background Category Translation Error:", err.message));
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, thumbnail, bannerDesktop, bannerMobile } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) throw new AppError('Category not found', 404);

  if (thumbnail && category.thumbnail && thumbnail !== category.thumbnail) safeDeleteFile(category.thumbnail).catch(console.error);
  if (bannerDesktop && category.bannerDesktop && bannerDesktop !== category.bannerDesktop) safeDeleteFile(category.bannerDesktop).catch(console.error);
  if (bannerMobile && category.bannerMobile && bannerMobile !== category.bannerMobile) safeDeleteFile(category.bannerMobile).catch(console.error);

  category.name = name || category.name;
  category.description = description || category.description;
  category.thumbnail = thumbnail !== undefined ? thumbnail : category.thumbnail;
  category.bannerDesktop = bannerDesktop !== undefined ? bannerDesktop : category.bannerDesktop;
  category.bannerMobile = bannerMobile !== undefined ? bannerMobile : category.bannerMobile;

  const updatedCategory = await category.save();
  
  res.status(200).json(updatedCategory);

  autoTranslateJson({ name: category.name, description: category.description }).then(async (translated) => {
    category.name = translated.name;
    category.description = translated.description;
    await category.save();
  }).catch(err => console.error("Background Category Translation Error:", err.message));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) throw new AppError('Category not found', 404);
  if (category.isDefault) throw new AppError('Cannot delete the system default category', 400);

  let defaultCategory = await Category.findOne({ isDefault: true });
  if (!defaultCategory) {
    defaultCategory = await Category.create({ name: { en: 'Uncategorized', ar: 'غير مصنف' }, description: { en: 'Default system category', ar: 'التصنيف الافتراضى للنظام' }, isDefault: true });
  }

  await Product.updateMany({ category: category._id }, { $set: { category: defaultCategory._id } });

  safeDeleteFile(category.thumbnail).catch(console.error);
  safeDeleteFile(category.bannerDesktop).catch(console.error);
  safeDeleteFile(category.bannerMobile).catch(console.error);

  await category.deleteOne();
  
  res.status(200).json({ message: 'Category removed and products moved to default' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };