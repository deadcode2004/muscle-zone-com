const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_USERNAME,
      to: process.env.MAIL_USERNAME, // Send to the same email // Use environment variable or default email
      subject: `رسالة جديدة من ${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">
          <h2 style="color: #333;">رسالة جديدة من موقع مصل زون جيم</h2>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 10px 0;"><strong>الاسم:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${email}</p>
            ${phone ? `<p style="margin: 10px 0;"><strong>رقم الجوال:</strong> ${phone}</p>` : ''}
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <strong>الرسالة:</strong>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">تم إرسال هذه الرسالة من نموذج الاتصال في موقع مصل زون جيم</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, redirect: '/thanks.html' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرسالة' });
  }
});

module.exports = router;
