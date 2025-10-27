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
// emailService.js - Updated version
const sendVerificationCode = async (email, verificationCode) => {
  try {
    console.log('🟡 Attempting to send email to:', email);
    
    // ✅ FIXED: Better error handling for missing credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log(`❌ EMAIL CREDENTIALS MISSING - Code for ${email}: ${verificationCode}`);
      console.log('⚠️  Please set GMAIL_USER and GMAIL_PASS in environment variables');
      return false; // Return false so frontend knows email failed
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"MBSTU Research Gate" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - MBSTU Research Gate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Email Verification Code</h2>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Verification code sent to:', email);
    return true;
    
  } catch (error) {
    console.log('❌ Email sending failed:', error.message);
    console.log(`🎯 FALLBACK - Verification code for ${email}: ${verificationCode}`);
    return false;
  }
};
module.exports = { sendVerificationCode };
