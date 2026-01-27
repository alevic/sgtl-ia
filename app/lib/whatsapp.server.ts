export async function sendWhatsAppMessage(phone: string, text: string) {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;
    const instance = process.env.WHATSAPP_INSTANCE_NAME;

    if (!apiUrl || !apiKey || !instance) {
        console.warn("⚠️ WhatsApp API not configured in .env");
        return;
    }

    // Format phone: Remove non-digits
    let cleanPhone = phone.replace(/\D/g, "");

    // Evolution API typically expects number with country code (e.g., 5511999999999)
    // If local number (10 or 11 digits), assume BR (55)
    if (cleanPhone.length <= 11 && !cleanPhone.startsWith("55")) {
        cleanPhone = "55" + cleanPhone;
    }

    console.log(`[WhatsApp] Sending to ${cleanPhone}: ${text.substring(0, 50)}...`);

    try {
        const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": apiKey
            },
            body: JSON.stringify({
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                textMessage: {
                    text: text
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Union API Error ${response.status}:`, err);
            // Don't throw for now to avoid breaking auth flow if WA fails
        } else {
            // const result = await response.json();
            // console.log("✅ WA Sent");
        }
    } catch (error) {
        console.error("❌ Failed to send WhatsApp message:", error);
    }
}
