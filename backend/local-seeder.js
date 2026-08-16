// filepath: backend/local-seeder.js
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

const importLocalData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ [LOCAL] MongoDB Connected Successfully...');
    
    await Product.deleteMany();
    await Category.deleteMany();
    
    let adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin', email: 'admin@evox.com', password: 'AdminPassword123!',
        isAdmin: true, isVerified: true
      });
    }

    const categoriesMap = {};
    const runningCategory = await Category.create({ name: { en: 'Running Shoes', ar: 'أحذية الجري' }, description: { en: 'High performance running shoes', ar: 'أحذية الجري المخصصة للأداء العالي' }, isDefault: true });
    categoriesMap['running'] = runningCategory._id;

    const footballCategory = await Category.create({ name: { en: 'Football Boots', ar: 'أحذية كرة القدم' }, description: { en: 'Football boots for natural and artificial pitches', ar: 'أحذية كرة قدم للعشب الطبيعي والصناعي' }, isDefault: false });
    categoriesMap['football'] = footballCategory._id;

    const productsDir = path.join(__dirname, '../frontend/public/images/products');
    if (!fs.existsSync(productsDir)) throw new Error(`Products directory not found at: ${productsDir}`);

    const folders = fs.readdirSync(productsDir);
    const productsToInsert = [];
    const sizes = ["40", "41", "42", "43", "44", "45"].map(size => ({ en: size, ar: size }));
    const supportedBrands = ['Nike', 'Puma', 'Adidas', 'New Balance', 'Under Armour', 'Asics', 'Reebok', 'Mizuno', 'Skechers'];

    console.log(`📦 Found ${folders.length} product folders. Starting LOCAL injection...\n`);

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
      const generatedStyleCode = rawName.toUpperCase().replace(/\s+/g, '-');

      let brandName = 'Nike'; 
      for (const brand of supportedBrands) {
        if (rawName.toLowerCase().includes(brand.toLowerCase())) { brandName = brand; break; }
      }

      // 🌟 أخذ المسار المحلي مباشرة
      const imageFiles = fs.readdirSync(folderPath).filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
      const imageUrls = imageFiles.map(img => `/images/products/${folder}/${img}`);
      if (imageUrls.length === 0) continue;

      const detectedType = detectExactCategory(folder, pageInfoUrl);
      const categoryId = categoriesMap[detectedType.categoryKey];
      const aiData = await generateDetailsFromAI(rawName, brandName, detectedType);

      productsToInsert.push({
        user: adminUser._id, category: categoryId, subCategory: detectedType.subCategory,
        name: { en: rawName, ar: aiData?.nameAr || rawName }, brand: brandName, 
        styleCode: generatedStyleCode, color: { name: { en: rawColor, ar: rawColor } },
        image: imageUrls[0], images: imageUrls.slice(1), 
        selectableOptions: [{ name: { en: "Size (EU)", ar: "المقاس (أوروبي)" }, values: sizes }],
        countInStock: 50, price: aiData?.price || 135.00, rating: 5, numReviews: 1,
        description: { en: aiData?.descriptionEn || "Premium athletic footwear.", ar: aiData?.descriptionAr || "حذاء رياضي ممتاز." },
        features: aiData?.featuresList || [], specifications: aiData?.specificationsList || []
      });

      console.log(`✅ [LOCAL] Added: ${rawName}`);
      await new Promise(res => setTimeout(res, 500)); 
    }

    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
      console.log(`\n🎉 [LOCAL] Successfully injected ${productsToInsert.length} products.`);
    }

    process.exit();
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}`);
    process.exit(1);
  }
};

importLocalData();