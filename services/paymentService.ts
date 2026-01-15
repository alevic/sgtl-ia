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
    externalReference?: string;
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
        console.log(' [PaymentService] Sending to N8N:', data);

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create payment via N8N');
            }

            return await response.json();
        } catch (error: any) {
            console.error('[PaymentService] Error:', error);
            return {
                success: false,
                message: error.message || 'Erro ao conectar com o serviço de pagamentos'
            };
        }
    }
};
