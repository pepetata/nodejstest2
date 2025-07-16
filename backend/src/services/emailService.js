const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendConfirmationEmail({ to, name, confirmUrl, year, logoUrl }) {
  const templatePath = path.join(__dirname, '../templates/confirmationEmail.ejs');
  const html = await ejs.renderFile(templatePath, {
    name,
    confirmUrl,
    year,
    logoUrl,
  });
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@alacarteapp.com',
    to,
    cc: 'flavio_luiz_ferreira@hotmail.com',
    subject: 'Bem-vindo ao À La Carte! Confirme seu e-mail',
    html,
    text: `Olá,\n\nBem-vindo ao À La Carte! Por favor, confirme seu e-mail acessando o link: ${confirmUrl}\n\nSe você não solicitou este cadastro, ignore este e-mail.`,
  });
}

async function sendPostConfirmationEmail({ to, userName, restaurantUrlName }) {
  const apphost = process.env.APP_HOST || 'alacarteapp.com';
  const appUrl = process.env.APP_URL || 'alacarteapp.com';
  const templatePath = path.join(__dirname, '../templates/postConfirmationEmail.ejs');
  const loginUrl = `http://${restaurantUrlName}.${apphost}/login`;
  const loginUrl2 = `${appUrl}/login`;
  const loginUrl3 = `${appUrl}`;
  const logoUrl = `${appUrl}/images/logo.png`;
  const html = await ejs.renderFile(templatePath, {
    userName,
    restaurantUrlName,
    appUrl: apphost,
    loginUrl,
    loginUrl2,
    loginUrl3,
    logoUrl,
  });
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@alacarteapp.com',
    to,
    subject: 'Bem-vindo ao À La Carte App! Seu restaurante está pronto',
    html,
  });
}

module.exports = {
  sendConfirmationEmail,
  sendPostConfirmationEmail,
};
