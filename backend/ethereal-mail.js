const nodemailer = require("nodemailer");

let testAccount;
let transporter;

async function initMailer() {
  testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("🧪 Ethereal SMTP ready");
  console.log("👤 User:", testAccount.user);
  console.log("🔑 Pass:", testAccount.pass);
}

async function sendTestMail({ name, email, message }) {
  if (!transporter) {
    await initMailer();
  }

  const info = await transporter.sendMail({
    from: `"Test Kontakt" <test@cschell.art>`,
    to: "contact@cschell.art",
    subject: `Kontakt: ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `
      <h3>Neue Kontaktanfrage</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>Nachricht:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("📩 Email sent");
  console.log("🔗 Preview URL:", previewUrl);

  return previewUrl;
}

module.exports = {
  sendTestMail,
};