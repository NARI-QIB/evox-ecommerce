// filepath: backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 🌟 اتصال مباشر بخوادم Gmail عبر منفذ SSL 465 لضمان عدم حظر الاتصال في السيرفرات السحابية
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // استخدام التشفير الكامل عبر SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // تجاوز تعارض الشهادات في بيئات الاستضافة
    },
    connectionTimeout: 15000, // مهلة انتظار 15 ثانية للاتصال
  });

  const mailOptions = {
    // يظهر اسم المتجر بدلاً من الإيميل فقط في صندوق الوارد
    from: `"${process.env.STORE_NAME || 'EVOX'}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // نص خام كخيار احتياطي للأجهزة القديمة
    html: options.html,    // تصميم القالب المتجاوب HTML
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;