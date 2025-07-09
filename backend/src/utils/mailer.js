const nodemailer = require('nodemailer');

// Configure your SMTP transport here (use environment variables in production!)
const transporter = nodemailer.createTransport({
  // service: 'gmail', // or your SMTP provider
  // auth: {
  //   user: process.env.SMTP_USER || 'your_gmail@gmail.com',
  //   pass: process.env.SMTP_PASS || 'your_gmail_app_password',
  // },
  host: 'localhost',
  port: 25, // or 1025 if that's what Papercut uses
  secure: false, // Papercut does not use SSL
  tls: {
    rejectUnauthorized: false, // allow self-signed
  },
});

/**
 * Send an email
 * @param {Object} options - { to, subject, text, html, cc }
 * @returns {Promise}
 */
async function sendMail(options) {
  const info = await transporter.sendMail(options);
  console.log(`Email sent: ${info.messageId} to ${options.to}`);
  return info;
}

module.exports = { sendMail };
