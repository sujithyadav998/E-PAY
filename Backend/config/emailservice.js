const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail', 'outlook', etc.
  auth: {
    user: 'sanjay809697@gmail.com',
    pass: 'kqqf mqeb xtug sjpj',
  },
});

module.exports = transporter;
