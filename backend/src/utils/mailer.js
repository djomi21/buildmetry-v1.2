const nodemailer = require('nodemailer');

function createTransporter(company) {
  var port = Number(company.smtpPort) || 587;
  var secure = company.smtpSecure === true || port === 465;

  return nodemailer.createTransport({
    host: company.smtpHost,
    port: port,
    secure: secure,
    auth: { user: company.smtpUser, pass: company.smtpPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

module.exports = { createTransporter };
