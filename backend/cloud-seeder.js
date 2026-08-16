// filepath: backend/cloud-seeder.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 🌟 1. قراءة متغيرات البيئة فوراً
const backendEnv = path.join(__dirname, '.env');
const rootEnv = path.join(__dirname, '../.env');
if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
else if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else { console.error('❌ .env file not found!'); process.exit(1); }

// 🌟 2. تخطي مشاكل الـ DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk'); 

const { cloudinary } = require('./config/cloudinary');
const Product = require('./models/productModel'); 
const Category = require('./models/categoryModel'); 
const User = require('./models/userModel'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const FOOTBALL_MODELS_REGEX = /\b(mercurial|vapor|superfly|phantom|phantom\s*gx|phantom\s*luna|tiempo|premier|hypervenom|magista|predator|copa|f50|crazyfast|speedportal|nemeziz|future|ultra|king|tekela|furon|morelia|football|soccer|cleat|cleats|boot|boots)\b/i;
const ARTIFICIAL_SURFACE_REGEX = /\b(ag|tf|ic|in|turf|astro|astroturf|indoor|court|synthetic|artificial)\b/i;

const detectExactCategory = (folderName, pageInfoUrl = '') => {
  const text = `${folderName} ${pageInfoUrl}`.toLowerCase();
  const isFootball = FOOTBALL_MODELS_REGEX.test(text);
  if (isFootball) {
    const isArtificial = ARTIFICIAL_SURFACE_REGEX.test(text);
    const subCategory = isArtificial ? 'أحذية للعشب الصناعي' : 'أحذية للعشب الطبيعي';
    return { categoryKey: 'football', subCategory };
  }
  return { categoryKey: 'running', subCategory: '' };
};

const generateDetailsFromAI = async (shoeName, brandName, detectedType) => {
  const prompt = `
  You are an expert sports footwear localizer and catalog specialist.
  Full Shoe Model Name: "${shoeName}" by "${brandName}".
  Assigned Category: "${detectedType.categoryKey === 'football' ? 'Football Boots' : 'Running Shoes'}".
  Assigned SubCategory: "${detectedType.subCategory}".

  Analyze this exact shoe line.
  Return a strict valid JSON object ONLY (no markdown \`\`\`json, no extra commentary):
  {
    "nameAr": "ترجمة اسم الحذاء الفعلي بدقة إلى اللغة العربية الفصحى",
    "price": 140.00, 
    "descriptionEn": "Professional 3-sentence performance description highlighting sole grip and upper material.",
    "descriptionAr": "وصف تسويقي احترافي من 3 جمل بالعربية الفصحى يوضح ميزات الحذاء ونوع الملعب أو الاستخدام.",
    "featuresList": [
      { "title": { "en": "Traction & Stability", "ar": "ثبات وقوة سحب" }, "description": { "en": "Engineered outsole for maximum grip", "ar": "نعل مطور يضمن أقصى درجات الثبات" } }
    ],
    "specificationsList": [
      { "name": { "en": "Category", "ar": "التصنيف" }, "value": { "en": "${detectedType.categoryKey === 'football' ? 'Football Boots' : 'Running Shoes'}", "ar": "${detectedType.categoryKey === 'football' ? 'أحذية كرة القدم' : 'أحذية الجري'}" } }
    ]
  }
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    if ((error.status === 429 || error.message.includes('quota')) && groq) {
      const groqModelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: groqModelName,
          temperature: 0.3,
        });
        const cleanedGroqText = chatCompletion.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedGroqText);
      } catch (groqError) { return null; }
    }
    return null;
  }
};

// 🌟 دالة لرفع الصور مع ميزة إعادة المحاولة تلقائياً عند انقطاع الاتصال
const uploadWithRetry = async (filePath, options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        ...options,
        timeout: 60000, // مهلة 60 ثانية لكل صورة لتفادي الـ Timeout
      });
      return result.secure_url;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`⏳ Retrying upload (${attempt}/${maxRetries}) for: ${path.basename(filePath)}`);
      await new Promise((res) => setTimeout(res, 1500)); // انتظار ثانية ونصف قبل إعادة المحاولة
    }
  }
};

const importCloudData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ [CLOUD] MongoDB Connected Successfully...\n');

    // التأكد من وجود الأدمن والأقسام دون حذفها كل مرة
    let adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin', email: 'admin@evox.com', password: 'AdminPassword123!',
        isAdmin: true, isVerified: true
      });
    }

    const categoriesMap = {};
    let runningCategory = await Category.findOne({ 'name.en': 'Running Shoes' });
    if (!runningCategory) {
      runningCategory = await Category.create({ name: { en: 'Running Shoes', ar: 'أحذية الجري' }, description: { en: 'High performance running shoes', ar: 'أحذية الجري المخصصة للأداء العالي' }, isDefault: true });
    }
    categoriesMap['running'] = runningCategory._id;

    let footballCategory = await Category.findOne({ 'name.en': 'Football Boots' });
    if (!footballCategory) {
      footballCategory = await Category.create({ name: { en: 'Football Boots', ar: 'أحذية كرة القدم' }, description: { en: 'Football boots for natural and artificial pitches', ar: 'أحذية كرة قدم للعشب الطبيعي والصناعي' }, isDefault: false });
    }
    categoriesMap['football'] = footballCategory._id;

    const productsDir = path.join(__dirname, '../frontend/public/images/products');
    if (!fs.existsSync(productsDir)) throw new Error(`Products directory not found at: ${productsDir}`);

    const folders = fs.readdirSync(productsDir);
    const sizes = ["40", "41", "42", "43", "44", "45"].map(size => ({ en: size, ar: size }));
    const supportedBrands = ['Nike', 'Puma', 'Adidas', 'New Balance', 'Under Armour', 'Asics', 'Reebok', 'Mizuno', 'Skechers'];

    console.log(`📦 Total Products to Process: ${folders.length}\n`);

    let processedCount = 0;

    for (const folder of folders) {
      const folderPath = path.join(productsDir, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const folderNameParts = folder.split(' - ');
      const rawName = folderNameParts[0]?.trim() || folder; 
      const rawColor = folderNameParts[1]?.replace(/_/g, '/').trim() || ''; 
      const generatedStyleCode = rawName.toUpperCase().replace(/\s+/g, '-');

      // 🌟 ميزة التخطي الذكي: إذا كان المنتج بلونه الحالي موجوداً مسبقاً في السحابة، تخطاه فوراً!
      const existingProduct = await Product.findOne({ 
        styleCode: generatedStyleCode, 
        'color.name.en': rawColor 
      });

      if (existingProduct) {
        console.log(`⏩ [Skipped] Already Injected: ${rawName} (${rawColor || 'Default'})`);
        continue;
      }

      let pageInfoUrl = '';
      const pageInfoPath = path.join(folderPath, 'pageInfo.txt');
      if (fs.existsSync(pageInfoPath)) {
        try { pageInfoUrl = fs.readFileSync(pageInfoPath, 'utf8').split('\n')[0] || ''; } catch (e) {}
      }

      let brandName = 'Nike'; 
      for (const brand of supportedBrands) {
        if (rawName.toLowerCase().includes(brand.toLowerCase())) { brandName = brand; break; }
      }

      const imageFiles = fs.readdirSync(folderPath).filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
      if (imageFiles.length === 0) continue;

      const imageUrls = [];
      console.log(`☁️ Uploading ${imageFiles.length} images for [${rawName} - ${rawColor}]...`);
      
      for (const img of imageFiles) {
        const localFilePath = path.join(folderPath, img);
        try {
          const cloudUrl = await uploadWithRetry(localFilePath, {
            folder: `evox/products/${generatedStyleCode}`,
            use_filename: true,
            unique_filename: false,
          });
          imageUrls.push(cloudUrl);
          await new Promise((res) => setTimeout(res, 200));
        } catch (uploadErr) {
          console.error(`❌ Failed to upload image ${img}:`, uploadErr.message || uploadErr);
        }
      }

      if (imageUrls.length === 0) {
        console.log(`⚠️ Skipped ${rawName} because all images failed to upload.\n`);
        continue; 
      }

      const detectedType = detectExactCategory(folder, pageInfoUrl);
      const categoryId = categoriesMap[detectedType.categoryKey];
      const aiData = await generateDetailsFromAI(rawName, brandName, detectedType);

      // 🌟 حفظ المنتج فوراً في قاعدة بيانات MongoDB Atlas السحابية
      const newProduct = await Product.create({
        user: adminUser._id,
        category: categoryId,
        subCategory: detectedType.subCategory,
        name: { en: rawName, ar: aiData?.nameAr || rawName },
        brand: brandName,
        styleCode: generatedStyleCode,
        color: { name: { en: rawColor, ar: rawColor } },
        image: imageUrls[0],
        images: imageUrls.slice(1),
        selectableOptions: [{ name: { en: "Size (EU)", ar: "المقاس (أوروبي)" }, values: sizes }],
        countInStock: 50,
        price: aiData?.price || 135.00,
        rating: 5,
        numReviews: 1,
        description: { en: aiData?.descriptionEn || "Premium athletic footwear.", ar: aiData?.descriptionAr || "حذاء رياضي ممتاز." },
        features: aiData?.featuresList || [],
        specifications: aiData?.specificationsList || []
      });

      processedCount++;
      console.log(`✅ [SAVED & LIVE] Product added to Store: ${newProduct.name.en}\n`);
      await new Promise((res) => setTimeout(res, 800));
    }

    console.log(`\n🎉 Process Finished! Successfully uploaded and saved all products.`);
    process.exit();
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}`);
    process.exit(1);
  }
};

importCloudData();