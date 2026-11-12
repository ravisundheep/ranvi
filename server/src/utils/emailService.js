const nodemailer = require('nodemailer');
const env = require('../config/env');

let cachedTransporter = null;

const isEmailConfigured = () => {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
};

const buildHtmlWrapper = (title, contentHtml) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fb; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(18, 53, 107, 0.08);">
      <div style="background: linear-gradient(135deg, #0B1E3D 0%, #12356B 100%); padding: 24px 28px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">RANVI INSTITUTIONS</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #F4B942; font-weight: 600;">${title}</p>
      </div>
      <div style="padding: 28px;">
        ${contentHtml}
      </div>
      <div style="background: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        This is an automated message from Ranvi Institutions Student Portal.<br/>
        Do not reply directly to this email. For help, raise a ticket in your Student Portal.
      </div>
    </div>
  </div>
`;

const sendOtpEmail = async (toEmail, otp, purpose = 'REGISTER') => {
  const transporter = getTransporter();
  if (!transporter) {
    const err = new Error('Email SMTP credentials are not configured on the server.');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const isReset = purpose === 'FORGOT_PASSWORD';
  const subject = isReset
    ? 'Ranvi Institutions — Password Reset OTP'
    : 'Ranvi Institutions — Verify Your Email Address';
  const subtitle = isReset ? 'Password Reset Verification' : 'Student Registration OTP';

  const html = buildHtmlWrapper(
    subtitle,
    `
      <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.6;">
        Hello,
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
        ${
          isReset
            ? 'We received a request to reset your Ranvi Institutions account password. Use the one-time verification code below:'
            : 'Thank you for registering with Ranvi Institutions! Please use the one-time verification code below to verify your email address:'
        }
      </p>
      <div style="background: #f0f6ff; border: 2px dashed #1769D2; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #12356B; font-family: monospace;">${otp}</span>
      </div>
      <p style="margin: 18px 0 0; font-size: 12px; color: #475569; line-height: 1.5;">
        <strong>Valid for 10 minutes.</strong> Never share this OTP with anyone. If you did not request this code, you can safely ignore this email.
      </p>
    `
  );

  await transporter.sendMail({
    from: `"Ranvi Institutions" <${env.EMAIL_FROM || env.SMTP_USER}>`,
    to: toEmail,
    subject,
    text: `Your Ranvi Institutions verification OTP is: ${otp}. It is valid for 10 minutes. Never share this code with anyone.`,
    html,
  });
};

const sendNotificationEmail = async ({ to, subject, title, message, actionUrl = '', actionLabel = 'Open Portal' }) => {
  const transporter = getTransporter();
  if (!transporter || !to) {
    return false;
  }

  try {
    const buttonHtml = actionUrl
      ? `<div style="margin-top: 22px; text-align: center;">
           <a href="${actionUrl}" style="display: inline-block; background: #12356B; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 10px;">
             ${actionLabel}
           </a>
         </div>`
      : '';

    const html = buildHtmlWrapper(
      title || 'Portal Notification',
      `
        <p style="margin: 0; font-size: 14px; line-height: 1.65; white-space: pre-line;">${message}</p>
        ${buttonHtml}
      `
    );

    await transporter.sendMail({
      from: `"Ranvi Institutions" <${env.EMAIL_FROM || env.SMTP_USER}>`,
      to,
      subject,
      text: `${title}\n\n${message}${actionUrl ? `\n\n${actionLabel}: ${actionUrl}` : ''}`,
      html,
    });
    return true;
  } catch (err) {
    console.warn(`[Email Notification Warning] Failed to send email to ${to}: ${err.message}`);
    return false;
  }
};

module.exports = {
  isEmailConfigured,
  sendOtpEmail,
  sendNotificationEmail,
};
