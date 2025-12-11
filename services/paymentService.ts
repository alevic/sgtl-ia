import { api } from "./api";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.webhook.url/test';

export interface IPaymentRequest {
    amount: number;
    customer: {
        name: string;
        cpf: string;
        email?: string;
        phone?: string;
    };
    items: {
        description: string;
        amount: number;
        quantity: number;
    }[];
    type: 'PIX' | 'LINK';
}

export interface IPaymentResponse {
    success: boolean;
    paymentId?: string;
    qrCode?: string; // Base64 image or URL
    copyPasteCode?: string; // Pix Copy Paste
    paymentLink?: string; // URL for billing
    message?: string;
}

export const paymentService = {
    createPayment: async (data: IPaymentRequest): Promise<IPaymentResponse> => {
        // In a real scenario, we would post to N8N
        // return api.post(N8N_WEBHOOK_URL, data);

        console.log(' [PaymentService] Sending to N8N:', data);

        // MOCK RESPONSE for development
        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (data.type === 'PIX') {
            return {
                success: true,
                paymentId: `pay_${Date.now()}`,
                qrCode: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Rickrolling_QR_code.png', // Placeholder
                copyPasteCode: '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913SGTL TRANSPORT6008SAO PAULO62070503***6304E2CA',
                message: 'Pix gerado com sucesso via N8N'
            };
        } else {
            return {
                success: true,
                paymentId: `pay_${Date.now()}`,
                paymentLink: `https://asaas.com/c/${Date.now()}`,
                message: 'Link de pagamento gerado via N8N'
            };
        }
    }
};
