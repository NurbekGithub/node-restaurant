const nodemailer = require('nodemailer');
const pug = require('pug')
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: "307a1a3f6efde7",
    pass: "932af7308a23f8"
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  return juice(html);
}

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Nurbek Izbassar <nurbekizbassar@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text
  }

  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions)
}