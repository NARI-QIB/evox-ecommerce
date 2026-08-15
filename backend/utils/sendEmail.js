const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    console.log("📧 جاري محاولة إرسال بريد حقيقي بتخطي حظر الـ DNS...");

    const transporter = nodemailer.createTransport({
      // 🌟 وضعنا عنوان الـ IP المباشر لخادم جوجل لتخطي الـ (queryA ETIMEOUT) نهائياً
      host: '142.250.102.108', 
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // 🌟 السماح بالاتصال وتأكيد هوية جوجل (SNI) رغم استخدام الـ IP المباشر
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com' 
      },
      // زيادة وقت الانتظار لتفادي بطء الشبكة المحلية
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const mailOptions = {
      from: `"${process.env.STORE_NAME || 'Evox Store'}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message, 
      html: options.html,    
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ تم إرسال الإيميل بنجاح! تفاصيل الاستجابة: " + info.response);

  } catch (error) {
    console.error("❌ فشل إرسال الإيميل. تفاصيل الخطأ:", error.message);
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;