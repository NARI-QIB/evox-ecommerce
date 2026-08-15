// filepath: backend/unisport-seeder.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk'); 

const Product = require('./models/productModel'); 
const Category = require('./models/categoryModel'); 
const User = require('./models/userModel'); 

const backendEnv = path.join(__dirname, '.env');
const rootEnv = path.join(__dirname, '../.env');
if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
else if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else { console.error('❌ .env file not found!'); process.exit(1); }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// 🌟 القاموس العالمي الشامل لتمييز موديلات كرة القدم لكافة الماركات العالمية (Nike, Adidas, Puma, Mizuno, etc.)
const FOOTBALL_MODELS_REGEX = /\b(mercurial|vapor|superfly|phantom|phantom\s*gx|phantom\s*luna|tiempo|premier|hypervenom|magista|predator|copa|f50|crazyfast|speedportal|nemeziz|future|ultra|king|tekela|furon|morelia|football|soccer|cleat|cleats|boot|boots)\b/i;

// 🌟 أكواد الملاعب الخاصة بالعشب الصناعي والصالات
const ARTIFICIAL_SURFACE_REGEX = /\b(ag|tf|ic|in|turf|astro|astroturf|indoor|court|synthetic|artificial)\b/i;

// 🌟 محرك الفحص الذكي للتعرف على نوع الحذاء والسطح من اسم الموديل
const detectExactCategory = (folderName, pageInfoUrl = '') => {
  const text = `${folderName} ${pageInfoUrl}`.toLowerCase();

  // 1. فحص إذا كان الحذاء من سلاسل كرة القدم المعتمدة
  const isFootball = FOOTBALL_MODELS_REGEX.test(text);

  if (isFootball) {
    // التمييز بين العشب الصناعي والعشب الطبيعي بناءً على الرمز (AG/TF/IC مقابل FG/SG)
    const isArtificial = ARTIFICIAL_SURFACE_REGEX.test(text);
    const subCategory = isArtificial ? 'أحذية للعشب الصناعي' : 'أحذية للعشب الطبيعي';
    
    return { categoryKey: 'football', subCategory };
  }

  // 2. إذا لم يكن حذاء كرة قدم، يُصنّف كأحذية جري بدون تصنيف فرعي إطلاقاً
  return { categoryKey: 'running', subCategory: '' };
};

// 🌟 استدعاء الذكاء الاصطناعي مع تزويده باسم الموديل الصريح وتصنيفه المكتشف
const generateDetailsFromAI = async (shoeName, brandName, detectedType) => {
  const prompt = `
  You are an expert sports footwear localizer and catalog specialist.
  Full Shoe Model Name: "${shoeName}" by "${brandName}".
  Assigned Category: "${detectedType.categoryKey === 'football' ? 'Football Boots' : 'Running Shoes'}".
  Assigned SubCategory: "${detectedType.subCategory}".

  Analyze this exact shoe line (e.g. Mercurial Vapor, Air Max DN, Pegasus, Predator, etc.).

  Return a strict valid JSON object ONLY (no markdown \`\`\`json, no extra commentary):
  {
    "nameAr": "ترجمة اسم الحذاء الفعلي بدقة إلى اللغة العربية الفصحى (مثال: حذاء كرة قدم نايكي إير زوم ميركوريال فابور 16 إيليت)",
    "price": 140.00, 
    "descriptionEn": "Professional 3-sentence performance description highlighting sole grip and upper material.",
    "descriptionAr": "وصف تسويقي احترافي من 3 جمل بالعربية الفصحى يوضح ميزات الحذاء ونوع الملعب أو الاستخدام.",
    "featuresList": [
      { "title": { "en": "Traction & Stability", "ar": "ثبات وقوة سحب" }, "description": { "en": "Engineered outsole for maximum grip during acceleration", "ar": "نعل مطور يضمن أقصى درجات الثبات والاتزان أثناء الانطلاق" } },
      { "title": { "en": "Lightweight Upper", "ar": "جزء علوي خفيف الوزن" }, "description": { "en": "Provides optimal touch and all-day comfort", "ar": "يوفر تحكماً ممتازاً وراحة فائقة طوال فترة الارتداء" } }
    ],
    "specificationsList": [
      { "name": { "en": "Category", "ar": "التصنيف" }, "value": { "en": "${detectedType.categoryKey === 'football' ? 'Football Boots' : 'Running Shoes'}", "ar": "${detectedType.categoryKey === 'football' ? 'أحذية كرة القدم' : 'أحذية الجري'}" } }
    ]
  }
  `;

  try {
    console.log(`🧠 AI Analyzing model: ${shoeName}...`);
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    if ((error.status === 429 || error.message.includes('quota')) && groq) {
      const groqModelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      console.log(`🔄 Switching to Groq Fallback (${groqModelName})...`);
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

const importAdvancedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully...');
    
    // تنظيف المنتجات والتصنيفات لضمان بناء بيئة نظيفة وموحدة
    await Product.deleteMany();
    await Category.deleteMany();
    
    // 🌟 1. التأكد من وجود حساب أدمن لربط المنتجات به
    let adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('⚠️ No admin user found. Creating a default admin account...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@evox.com',
        password: 'AdminPassword123!',
        isAdmin: true,
        isVerified: true
      });
    }

    // 🌟 2. إنشاء التصنيفين الرئيسيين المطلوبة فقط
    const categoriesMap = {};
    
    const runningCategory = await Category.create({ 
      name: { en: 'Running Shoes', ar: 'أحذية الجري' }, 
      description: { en: 'High performance running shoes', ar: 'أحذية الجري المخصصة للأداء العالي' }, 
      isDefault: true 
    });
    categoriesMap['running'] = runningCategory._id;

    const footballCategory = await Category.create({ 
      name: { en: 'Football Boots', ar: 'أحذية كرة القدم' }, 
      description: { en: 'Football boots for natural and artificial pitches', ar: 'أحذية كرة قدم للعشب الطبيعي والصناعي' }, 
      isDefault: false 
    });
    categoriesMap['football'] = footballCategory._id;

    // 🌟 3. قراءة مجلدات المنتجات
    const productsDir = path.join(__dirname, '../frontend/public/images/products');
    if (!fs.existsSync(productsDir)) {
      throw new Error(`Products directory not found at: ${productsDir}`);
    }

    const folders = fs.readdirSync(productsDir);
    const productsToInsert = [];
    const sizes = ["40", "41", "42", "43", "44", "45"].map(size => ({ en: size, ar: size }));
    const supportedBrands = ['Nike', 'Puma', 'Adidas', 'New Balance', 'Under Armour', 'Asics', 'Reebok', 'Mizuno', 'Skechers'];

    console.log(`📦 Found ${folders.length} product folders. Starting smart batch injection...\n`);

    for (const folder of folders) {
      const folderPath = path.join(productsDir, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      let pageInfoUrl = '';
      const pageInfoPath = path.join(folderPath, 'pageInfo.txt');
      if (fs.existsSync(pageInfoPath)) {
        try { pageInfoUrl = fs.readFileSync(pageInfoPath, 'utf8').split('\n')[0] || ''; } catch (e) {}
      }

      const folderNameParts = folder.split(' - ');
      const rawName = folderNameParts[0]?.trim() || folder; 
      const rawColor = folderNameParts[1]?.replace(/_/g, '/').trim() || ''; 
      
      // 🌟 رمز التجميع الموحد لربط ألوان نفس الموديل ببعضها في الواجهة
      const generatedStyleCode = rawName.toUpperCase().replace(/\s+/g, '-');

      let brandName = 'Nike'; 
      for (const brand of supportedBrands) {
        if (rawName.toLowerCase().includes(brand.toLowerCase())) { brandName = brand; break; }
      }

      const imageFiles = fs.readdirSync(folderPath).filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
      const imageUrls = imageFiles.map(img => `/images/products/${folder}/${img}`);
      if (imageUrls.length === 0) continue;

      // 🌟 فحص الموديل والأكواد الصريحة
      const detectedType = detectExactCategory(folder, pageInfoUrl);
      const categoryId = categoriesMap[detectedType.categoryKey];

      const aiData = await generateDetailsFromAI(rawName, brandName, detectedType);

      productsToInsert.push({
        user: adminUser._id,
        category: categoryId, 
        subCategory: detectedType.subCategory, // إما "" أو "أحذية للعشب الطبيعي" أو "أحذية للعشب الصناعي"
        name: { 
          en: rawName, 
          ar: aiData?.nameAr || rawName 
        },
        brand: brandName, 
        styleCode: generatedStyleCode, 
        color: { name: { en: rawColor, ar: rawColor } },
        image: imageUrls[0], 
        images: imageUrls.slice(1), 
        selectableOptions: [{ name: { en: "Size (EU)", ar: "المقاس (أوروبي)" }, values: sizes }],
        countInStock: 50, 
        description: { 
          en: aiData?.descriptionEn || "Premium athletic footwear engineered for high performance.", 
          ar: aiData?.descriptionAr || "حذاء رياضي ممتاز مصمم للأداء العالي والراحة." 
        },
        features: aiData?.featuresList || [],
        specifications: aiData?.specificationsList || [],
        price: aiData?.price || 135.00,
        rating: 5,
        numReviews: 1
      });

      const catName = detectedType.categoryKey === 'football' ? 'أحذية كرة القدم' : 'أحذية الجري';
      console.log(`✅ [${brandName}] ${rawName}`);
      console.log(`   └─ Main: ${catName} | Sub: "${detectedType.subCategory || 'بدون'}"\n`);
      
      await new Promise(res => setTimeout(res, 800)); 
    }

    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
      console.log(`\n🎉 Process Complete! Successfully injected ${productsToInsert.length} products.`);
    }

    process.exit();
  } catch (error) {
    console.error(`❌ Fatal Error during injection: ${error.message}`);
    process.exit(1);
  }
};

importAdvancedData();