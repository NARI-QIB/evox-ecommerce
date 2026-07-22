// filepath: backend/utils/escapeRegex.js

/**
 * دالة لتنظيف مدخلات المستخدم من الرموز الخاصة بالتعابير النمطية (Regex)
 * لمنع هجمات Regular Expression Denial of Service (ReDoS)
 */
const escapeRegex = (string) => {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // وضع \ قبل كل رمز خاص
};

module.exports = escapeRegex;