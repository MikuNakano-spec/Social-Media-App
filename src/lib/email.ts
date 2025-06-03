import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendResetEmailParams {
  email: string;
  name: string;
  resetToken: string;
}

interface SendPremiumEmailParams {
  email: string;
  name: string;
  plan: string;
}

export async function sendResetEmail({ 
  email,
  name,
  resetToken
}: SendResetEmailParams) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Hi ${name},</h1>
          <p style="font-size: 16px; color: #374151;">
            You requested to reset your WeebVerse password. Click the button below to set a new password:
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; 
            padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 1 hour.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Failed to send reset email");
  }
}

export async function sendPremiumSuccessEmail({
  email,
  name,
  plan
}: SendPremiumEmailParams) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "🎉 Premium Activated!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Hi ${name},</h1>
          <p style="font-size: 16px; color: #374151;">
            Thank you for subscribing to <strong>${plan}</strong> plan on WeebVerse!
          </p>
          <p style="font-size: 16px; color: #374151;">
            Your premium benefits are now active. Enjoy the boost!
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send premium success email:", error);
  }
}

export async function sendPasswordChangeVerificationEmail({
  email,
  code,
  name
}: {
  email: string;
  code: string;
  name: string;
}) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Password Change Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; margin-bottom: 1rem;">Security Verification</h1>
          <p style="font-size: 16px; color: #374151; margin-bottom: 1.5rem;">
            Your password change verification code is:
          </p>
          
          <!-- Copy-friendly code display -->
          <div style="
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #2563eb;
            letter-spacing: 0.5em;
            padding-left: 0.5em; /* compensates for letter-spacing */
            background: #f8fafc;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            user-select: all;
          ">
            ${code}
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            This code will expire in 10 minutes.<br>
            <span style="font-style: italic;">Click the code to copy it</span>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification code:", error);
  }
}