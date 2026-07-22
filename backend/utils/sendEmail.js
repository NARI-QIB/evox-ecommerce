const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    // استخدمنا اسم المتجر لكي يظهر للمستخدم كمرسل بدلاً من ظهور الإيميل فقط
    from: `"${process.env.STORE_NAME || 'Our Store'}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // أبقينا النص الخام كـ Fallback للأجهزة القديمة جداً
    html: options.html,    // <-- السطر الجديد الذي يسمح بقبول تصميم HTML
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;