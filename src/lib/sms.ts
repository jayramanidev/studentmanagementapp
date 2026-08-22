import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Dispatches an SMS/WhatsApp message through Twilio.
 * Falls back to a local console MOCK if Twilio credentials are not set.
 */
export async function sendSmsViaGateway(to: string, body: string, alertId: string): Promise<{ success: boolean; messageId?: string; status: "SENT" | "DELIVERED" | "FAILED" }> {
  // Always format phone number to E.164. Assuming India (+91) if not provided.
  let formattedPhone = to;
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = `+91${formattedPhone}`;
  }

  // 1. MOCK FALLBACK (If Twilio not configured)
  if (!twilioClient || !twilioNumber) {
    console.log("=========================================");
    console.log("[MOCK SMS GATEWAY] Twilio credentials missing.");
    console.log(`[MOCK SMS GATEWAY] To: ${formattedPhone}`);
    console.log(`[MOCK SMS GATEWAY] Body:\n${body}`);
    console.log("=========================================");
    
    // Simulate webhook callback after 2 seconds
    setTimeout(async () => {
      try {
        const status = Math.random() > 0.1 ? "DELIVERED" : "FAILED"; // 90% success rate
        const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${url}/api/webhooks/sms-gateway?alertId=${alertId}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ MessageStatus: status }).toString(),
        });
      } catch (err) {
        console.error("Mock Webhook Error:", err);
      }
    }, 2000);

    return { success: true, messageId: `mock_${Date.now()}`, status: "SENT" };
  }

  // 2. REAL TWILIO DISPATCH
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const message = await twilioClient.messages.create({
      body: body,
      from: twilioNumber,
      to: formattedPhone,
      statusCallback: `${appUrl}/api/webhooks/sms-gateway?alertId=${alertId}`,
    });

    return { 
      success: true, 
      messageId: message.sid,
      status: "SENT"
    };
  } catch (error) {
    console.error("[Twilio Dispatch Error]:", error);
    return { success: false, status: "FAILED" };
  }
}
