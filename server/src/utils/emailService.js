const getResendErrorText = (errorText) => {
  try {
    const parsedError =
      JSON.parse(errorText);

    return (
      parsedError.message ||
      parsedError.error ||
      errorText
    );
  } catch {
    return errorText;
  }
};

const getPublicResendMessage = ({
  status,
  fromEmail,
  errorText
}) => {
  const normalizedError =
    errorText.toLowerCase();

  if (
    fromEmail.includes("onboarding@resend.dev") &&
    status === 403
  ) {
    return "Resend test mode can only send to the email address on your Resend account. Use that email for testing, or verify your own domain in Resend.";
  }

  if (
    normalizedError.includes("verify a domain") ||
    normalizedError.includes("domain is not verified")
  ) {
    return "Resend needs a verified domain before it can email other people. Verify your domain in Resend, then use a sender like Nyvra <verify@yourdomain.com>.";
  }

  if (
    status === 401 ||
    normalizedError.includes("api key") ||
    normalizedError.includes("unauthorized")
  ) {
    return "Resend rejected the API key. Create a new Resend API key and update server/.env.";
  }

  return "Resend could not send the verification email. Check the backend terminal for the delivery error.";
};

const sendRegistrationOtp = async ({
  email,
  name,
  otp
}) => {
  const apiKey =
    process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Resend email service is not configured");
    }

    console.log(`Nyvra registration OTP for ${email}: ${otp}`);

    return {
      deliveryMode: "console"
    };
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => controller.abort(), 12000);

  let response;

  try {
    response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Your Nyvra verification code",
          text: `Hi ${name}, your Nyvra verification code is ${otp}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #090a0f; color: #ffffff; padding: 32px;">
              <div style="max-width: 520px; margin: 0 auto; background: #111218; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 28px;">
                <p style="margin: 0 0 12px; color: #8e929e;">Nyvra verification</p>
                <h1 style="margin: 0 0 16px; font-size: 24px;">Confirm your email</h1>
                <p style="color: #cfd4df;">Hi ${name}, enter this code to finish creating your Nyvra account.</p>
                <div style="margin: 24px 0; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #00d2ff;">${otp}</div>
                <p style="margin: 0; color: #8e929e;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
              </div>
            </div>
          `
        })
      }
    );
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Resend request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const responseText =
      await response.text();

    const errorText =
      getResendErrorText(responseText);

    const error =
      new Error(`Resend failed (${response.status}): ${errorText}`);

    error.publicMessage =
      getPublicResendMessage({
        status: response.status,
        fromEmail,
        errorText
      });

    throw error;
  }

  return {
    deliveryMode: "email"
  };
};

module.exports = {
  sendRegistrationOtp
};
