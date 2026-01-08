/**
 * Serviço para centralização de envio de mensagens via WhatsApp.
 * Integração com Evolution API.
 */

export const sendWhatsAppMessage = async (phone: string, text: string) => {
    try {
        // Formatar número de telefone (remover caracteres não numéricos, exceto + para detecção de prefixo se necessário)
        // A Evolution API espera número completo com DDI, mas sem o caractere '+'
        let cleanPhone = phone.replace(/\D/g, '');

        console.log(`[WhatsApp Service] Enviando para ${cleanPhone} via Evolution API: ${text}`);

        const url = `${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE_NAME}`;
        const apiKey = process.env.WHATSAPP_API_KEY || '';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: text,
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Evolution API Error (${response.status}):`, errorText);
            throw new Error(`WhatsApp API error (${response.status}): ${errorText || response.statusText}`);
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.message || error);
        // Fallback para log em desenvolvimento se a API falhar
        console.log(`[FALLBACK LOG] Mensagem que falhou ao enviar: ${text} para ${phone}`);
        throw error;
    }
};
