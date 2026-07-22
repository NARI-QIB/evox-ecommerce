// filepath: backend/unisport-seeder.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk'); 

// استدعاء الموديلات
const Product = require('./models/productModel'); 
const Category = require('./models/categoryModel'); 
const User = require('./models/userModel'); 

// الرادار الذكي للبحث عن ملف .env
const backendEnv = path.join(__dirname, '.env');
const rootEnv = path.join(__dirname, '../.env');

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  console.error('❌ لم يتم العثور على ملف .env نهائياً!');
  process.exit(1);
}

// إعداد اتصال Gemini 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

// إعداد اتصال Groq كبديل احتياطي (Fallback)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// دالة توليد تفاصيل وتسعير المنتج بنظام هجين
const generateDetailsFromAI = async (shoeName, brandName) => {
  const prompt = `
  You are an expert in sports shoes. I am adding a shoe named "${shoeName}" by "${brandName}" to my e-commerce store.
  Provide a JSON response strictly in this exact format, with no extra text or markdown. 
  Make sure the "price" is a realistic estimated USD price (number only) for this specific model:
  {
    "price": 150,
    "descriptionEn": "Write a compelling 2-3 sentence commercial description for this shoe.",
    "featuresList": [
      {
        "title": { "en": "Feature 1 title", "ar": "عنوان الميزة 1" },
        "description": { "en": "Feature 1 description", "ar": "وصف الميزة 1" }
      },
      {
        "title": { "en": "Feature 2 title", "ar": "عنوان الميزة 2" },
        "description": { "en": "Feature 2 description", "ar": "وصف الميزة 2" }
      }
    ]
  }
  `;

  try {
    console.log(`🧠 جاري توليد البيانات والتسعير لـ: ${shoeName} (عبر Gemini)...`);
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    if ((error.message.includes('429') || error.message.includes('quota') || error.status === 429) && groq) {
        // 🌟 قراءة اسم الموديل ديناميكياً من متغيرات البيئة
        const groqModelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        console.log(`🔄 الرصيد انتهى في Gemini! جاري التحويل التلقائي لـ Groq (${groqModelName})...`);
        
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: groqModelName, // 🌟 ديناميكي
                temperature: 0.5,
            });
            
            const groqResponse = chatCompletion.choices[0].message.content;
            const cleanedGroqText = groqResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedGroqText);
            
        } catch (groqError) {
            console.log(`⚠️ فشل نموذج Groq أيضاً. الخطأ: ${groqError.message}`);
            return null;
        }
    }
    
    console.log(`⚠️ فشل غير متوقع من Gemini: ${error.message}`);
    return null;
  }
};

const importAdvancedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected...');

    await Product.deleteMany();
    console.log('🗑️ تم تنظيف قاعدة البيانات من جميع المنتجات القديمة!');

    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) throw new Error("لم يتم العثور على حساب آدمن.");

    let runningCategory = await Category.findOne({ 'name.en': 'Running Shoes' });
    if (!runningCategory) {
        runningCategory = await Category.create({ 
        name: { en: 'Running Shoes', ar: 'أحذية الجري' }, 
        isDefault: true 
      });
    }

    const productsDir = path.join(__dirname, '../frontend/public/images/products');
    const folders = fs.readdirSync(productsDir);
    const productsToInsert = [];
    
    const sizes = ["40", "41", "42", "43", "44", "45"].map(size => ({ en: size, ar: size }));
    const supportedBrands = ['Nike', 'Puma', 'Adidas', 'New Balance', 'Under Armour', 'Asics', 'Reebok'];

    for (const folder of folders) {
      const folderPath = path.join(productsDir, folder);
      
      if (fs.statSync(folderPath).isDirectory()) {
        const folderNameParts = folder.split(' - ');
        const rawName = folderNameParts[0] ? folderNameParts[0].trim() : folder; 
        const rawColor = folderNameParts[1] ? folderNameParts[1].replace(/_/g, '/').trim() : ''; 
        
        const generatedStyleCode = rawName.toUpperCase().replace(/\s+/g, '-');

        let brandName = 'Unknown';
        for (const brand of supportedBrands) {
          if (rawName.toLowerCase().includes(brand.toLowerCase())) {
            brandName = brand;
            break; 
          }
        }

        const files = fs.readdirSync(folderPath);
        const imageFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
        const imageUrls = imageFiles.map(img => `/images/products/${folder}/${img}`);
        
        if (imageUrls.length === 0) continue;

        const aiData = await generateDetailsFromAI(rawName, brandName);
        
        let finalDescription = "Premium high-performance running shoe.";
        let finalFeatures = [];
        let finalPrice = Math.floor(Math.random() * (250 - 90 + 1)) + 90 - 0.01; 

        if (aiData) {
            finalDescription = aiData.descriptionEn;
            finalFeatures = aiData.featuresList;
            if (aiData.price && typeof aiData.price === 'number') {
                finalPrice = aiData.price;
            }
        }

        productsToInsert.push({
          user: adminUser._id,
          category: runningCategory._id, 
          name: { en: rawName, ar: rawName },
          brand: brandName, 
          styleCode: generatedStyleCode, 
          color: { name: { en: rawColor, ar: rawColor } },
          image: imageUrls[0], 
          images: imageUrls.slice(1), 
          selectableOptions: [{ name: { en: "Size (EU)", ar: "المقاس (أوروبي)" }, values: sizes }],
          countInStock: 100, 
          description: { en: finalDescription, ar: "الوصف متوفر بالإنجليزية حالياً." },
          features: finalFeatures,
          price: finalPrice,
          rating: 5,
          numReviews: 1
        });
        
        await new Promise(res => setTimeout(res, 3500));
      }
    }

    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
      console.log(`🎉 نجاح! تم حقن ${productsToInsert.length} منتج بأسعار وتقييمات مولّدة بالذكاء الاصطناعي.`);
    } else {
      console.log('⚠️ لم يتم العثور على مجلدات صور صالحة.');
    }

    process.exit();
  } catch (error) {
    console.error(`❌ خطأ عام: ${error.message}`);
    process.exit(1);
  }
};

importAdvancedData();