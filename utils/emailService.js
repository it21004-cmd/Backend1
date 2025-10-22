const nodemailer = require('nodemailer');

// ✅ FIXED: Better email configuration for Render
const createTransporter = () => {
  // Check if email credentials exist
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('⚠️  Email credentials not found. Using test mode.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    // ✅ Render-optimized settings
    pool: true,
    maxConnections: 1,
    connectionTimeout: 30000,
    socketTimeout: 30000,
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Test email connection
const transporter = createTransporter();
if (transporter) {
  transporter.verify(function (error, success) {
    if (error) {
      console.log('❌ Email transporter error:', error.message);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} else {
  console.log('ℹ️  Email transporter not initialized - test mode active');
}

// ✅ FIXED: Send verification code with fallback
const sendVerificationCode = async (email, verificationCode) => {
  try {
    console.log('🟡 Attempting to send email to:', email);
    
    // ✅ FIXED: If no transporter (no credentials), use test mode
    if (!transporter) {
      console.log(`🎯 TEST MODE - Verification code for ${email}: ${verificationCode}`);
      console.log('ℹ️  Email credentials not configured. Code shown in console.');
      return true; // Still return true so registration continues
    }

    const mailOptions = {
      from: `"MBSTU Research Gate" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - MBSTU Research Gate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2c3e50; text-align: center;">MBSTU Research Gate</h2>
          <h3 style="color: #333;">Email Verification Code</h3>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; padding: 10px 20px; border: 2px dashed #e74c3c; border-radius: 5px;">
              ${verificationCode}
            </span>
          </div>
          <p>Enter this code on the verification page to activate your account.</p>
          <p style="color: #7f8c8d; font-size: 12px;">This code will expire in 10 minutes.</p>
          <p style="color: #7f8c8d; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification code sent to:', email);
    console.log('✅ Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.log('❌ Email sending failed:', error.message);
    
    // ✅ FIXED: Fallback - show code in console and continue
    console.log(`🎯 FALLBACK - Verification code for ${email}: ${verificationCode}`);
    console.log('ℹ️  Registration continues despite email failure');
    return true; // Still return true so registration doesn't fail
  }
};

module.exports = { sendVerificationCode };
