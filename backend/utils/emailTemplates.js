// filepath: backend/utils/emailTemplates.js
const buildEmailTemplate = (title, mainText, otpCode, footerText) => {
  const storeName = process.env.STORE_NAME || 'EVOX';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 0;}
      .email-wrapper { padding: 40px 0; }
      .email-card { max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .email-header { background-color: #1a1a1a; padding: 30px 20px; text-align: center; }
      .email-header h1 { margin: 0; color: #fff; font-size: 26px; letter-spacing: 3px; text-transform: uppercase; }
      .email-body { padding: 40px 30px; text-align: center; }
      .email-body h2 { color: #1a1a1a; margin-top: 0; font-size: 22px; }
      .email-body p { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px; }
      .otp-code { display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1a1a1a; background-color: #f8f9fa; padding: 15px 35px; border-radius: 8px; border: 2px dashed #ccc; }
      .email-footer { background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eee; }
      .email-footer p { margin: 0; font-size: 13px; color: #888; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-card">
        <div class="email-header"><h1>${storeName}</h1></div>
        <div class="email-body"><h2>${title}</h2><p>${mainText}</p><div class="otp-container"><span class="otp-code">${otpCode}</span></div></div>
        <div class="email-footer"><p>${footerText}</p></div>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = { buildEmailTemplate };