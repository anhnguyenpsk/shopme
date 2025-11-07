import nodemailer from 'nodemailer';

/**
 * Create and configure the email transporter using Gmail SMTP
 */
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Email configuration missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send verification email with 6-digit code
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(email, code) {
  // Check if email is @example.com (fake/demo email)
  if (email.endsWith('@example.com')) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DEMO EMAIL - Verification Code');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Copy the code above to verify the account');
    console.log('');
    return; // Skip actual email sending
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ShopMe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - ShopMe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1f2937;
              margin: 0;
              font-size: 24px;
            }
            .code-container {
              background-color: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 25px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #2563eb;
              font-family: 'Courier New', monospace;
            }
            .expiry {
              color: #ef4444;
              font-size: 14px;
              font-weight: 600;
              margin-top: 15px;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ Welcome to ShopMe!</h1>
            </div>
            
            <p class="message">
              Thank you for creating an account with ShopMe. To complete your registration, 
              please verify your email address using the code below:
            </p>
            
            <div class="code-container">
              <div class="code">${code}</div>
              <div class="expiry">⏰ This code expires in 3 minutes</div>
            </div>
            
            <p class="message">
              Enter this 6-digit code on the verification page to activate your account.
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't create an account with ShopMe, 
              please ignore this email or contact our support team.
            </div>
            
            <div class="footer">
              <p>
                This is an automated email. Please do not reply to this message.<br>
                &copy; ${new Date().getFullYear()} ShopMe. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ShopMe!

Your verification code is: ${code}

This code expires in 3 minutes.

Please enter this code on the verification page to complete your registration.

If you didn't create an account with ShopMe, please ignore this email.

© ${new Date().getFullYear()} ShopMe. All rights reserved.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

