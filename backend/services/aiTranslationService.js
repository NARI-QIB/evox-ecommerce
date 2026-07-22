// filepath: backend/services/aiTranslationService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * 🌟 AI Auto-Localization Service (Dynamic Fallback: Gemini -> Groq)
 * تقوم بالترجمة الآلية للبيانات وحفظها بمرونة عالية عند إضافة أو تعديل المنتجات
 */
const translateWithGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // 🌟 استدعاء اسم الموديل من متغيرات البيئة بدلاً من إدخاله صراحةً
  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    let Groq;
    try { Groq = require('groq-sdk'); } catch (e) {}

    if (Groq) {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: modelName, // 🌟 ديناميكي
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content;
    } else {
      // استدعاء مباشر عبر REST API لضمان استمرار العمل بدون توقف
      const { data } = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: modelName, // 🌟 ديناميكي
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return data.choices[0]?.message?.content;
    }
  } catch (err) {
    console.error(`🔥 [AI Translation Error] Groq Model (${modelName}) failed:`, err.message);
    return null;
  }
};

const autoTranslateJson = async (data) => {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    console.warn("⚠️ Neither GEMINI_API_KEY nor GROQ_API_KEY is configured. Skipping translation.");
    return data;
  }

  try {
    let needsTranslation = false;
    const checkMissing = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.en && typeof obj.en === 'string' && (!obj.ar || obj.ar.trim() === '')) {
        needsTranslation = true;
      }
      Object.values(obj).forEach(checkMissing);
    };
    
    checkMissing(data);
    if (!needsTranslation) return data;

    const prompt = `
      You are an expert e-commerce localizer and translator specialized in sports gear.
      I will provide you with a JSON object.
      Your task:
      1. Find all keys named "ar" that have an empty string "" or are missing, where the corresponding "en" key has text.
      2. Translate the English ("en") text to professional Arabic.
      3. Use accurate sports terminology (e.g., "Size" -> "المقاس", "Running Shoes" -> "حذاء ركض", "Breathable Mesh" -> "نسيج شبكي يسمح بالتهوية").
      4. DO NOT change the structure of the JSON. DO NOT translate the keys, only the values of "ar".
      5. Return ONLY the raw valid JSON object without any markdown tags like \`\`\`json.
      
      Original JSON:
      ${JSON.stringify(data)}
    `;

    let responseText = null;

    // 1. التجربة عبر Gemini أولاً (Primary AI)
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        responseText = result.response.text().trim();
      } catch (geminiError) {
        console.warn(`⚠️ [AI Translation] Gemini primary API error or limit reached. Switching to Groq fallback...`);
      }
    }

    // 2. التحويل التلقائي لـ Groq عند فشل Gemini أو انتهاء الرصيد
    if (!responseText && process.env.GROQ_API_KEY) {
      responseText = await translateWithGroq(prompt);
    }

    if (!responseText) return data;

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanedText = match[1];
      }
    }

    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("🔥 [AI Translation] Processing error:", error.message);
    return data;
  }
};

module.exports = { autoTranslateJson };