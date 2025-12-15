# Documentação de Integração Webhook (N8N -> Sistema)

Esta documentação descreve como configurar o N8N para confirmar pagamentos no sistema via Webhook.

## Endpoint

- **URL**: `POST /api/webhooks/payment-confirmed`
- **Autenticação**: Header padrão `x-webhook-secret`.
  - Valor (Dev): `dev-secret-123`
  - Valor (Prod): Configurado via env var `WEBHOOK_SECRET`.

## Payload JSON (Exemplo)

O N8N deve enviar um JSON no corpo da requisição com o seguinte formato:

```json
{
  "transaction_id": "pay_123456789", 
  "amount": 150.00,
  "payment_method": "PIX",
  "payment_date": "2023-12-15T18:00:00Z"
}
```

### Campos:
- `transaction_id` (Obrigatório*): O ID da transação gerado pelo ASAAS/Gateway (deve bater com `external_payment_id` salvo na reserva).
- `reservation_id` (Opcional*): O UUID interno da reserva, caso o N8N o tenha.
- `amount` (Obrigatório): O valor pago confirmado.
- `payment_method`: "PIX", "BOLETO", "CARTAO", etc.

*\*É necessário enviar pelo menos um dos IDs (`transaction_id` ou `reservation_id`).*

## Comportamento

1. O sistema busca a reserva pelo `transaction_id` (ou `reservation_id`).
2. Atualiza o status para `CONFIRMED`.
3. Atualiza o valor `amount_paid`.
4. Gera automaticamente uma transação de RECEITA no módulo Financeiro.
