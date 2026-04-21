import { env } from "../lib/env";

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  if (!env.SENDGRID_API_KEY) {
    // Dev fallback: log the link so developers can test without SendGrid
    console.log(`[email] Verification link for ${to}: ${verifyUrl}`);
    return;
  }

  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: env.SENDGRID_FROM_EMAIL },
    subject: "Verify your WannaBet email",
    content: [
      {
        type: "text/html",
        value: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0f0f0f;color:#fff;padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
    <h1 style="color:#a855f7;margin-top:0;">WannaBet</h1>
    <h2 style="font-size:20px;">Verify your email address</h2>
    <p style="color:#aaa;">Thanks for signing up! Click the button below to verify your email and activate your account.</p>
    <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#a855f7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Verify Email
    </a>
    <p style="color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    <hr style="border-color:#333;margin:24px 0;"/>
    <p style="color:#555;font-size:12px;">Or copy this link: <a href="${verifyUrl}" style="color:#a855f7;">${verifyUrl}</a></p>
  </div>
</body>
</html>`,
      },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] SendGrid error:", res.status, text);
    // Don't throw — we don't want email failure to break signup
  }
}
