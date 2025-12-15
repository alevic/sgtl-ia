# Documentação de Integração Webhook (N8N -> Sistema)

Esta documentação descreve como configurar o N8N para interagir com o sistema.

## Autenticação
- **Header**: `x-webhook-secret`
- **Valor**: `dev-secret-123` (ou env `WEBHOOK_SECRET`)

## 1. Confirmação de Pagamento
** POST /api/webhooks/payment-confirmed**
Confirma a reserva e gera a transação financeira.

Payload:
```json
{
  "transaction_id": "pay_123456789", 
  "amount": 150.00,
  "payment_method": "PIX"
}
```

---

## 2. Workflow de Expiração (Cancelamento Automático)

Para cancelar reservas que não foram pagas após um tempo (ex: 15min), configure um Workflow "Cron" no N8N:

### Passo A: Buscar Reservas Pendentes
**GET /api/webhooks/pending-reservations**
Retorna lista de todas as reservas com status `PENDING`.

Exemplo de resposta:
```json
[
  {
    "id": "uuid-...",
    "ticket_code": "T-123",
    "created_at": "2023-12-15T18:00:00.000Z",
    "passenger_name": "João"
  }
]
```

### Passo B: Filtrar no N8N
Use um nó "Filter" ou "Function" no N8N para comparar `created_at` com a hora atual.
- Se `created_at` < (Agora - 15 minutos), siga para o cancelamento.

### Passo C: Cancelar Reserva
**POST /api/webhooks/cancel-reservation**

Payload:
```json
{
  "reservation_id": "uuid-da-reserva-expirada",
  "reason": "Expirou prazo de pagamento (15min)"
}
```

---

## 3. Futuros Endpoints (Sugestões)
O arquivo `webhooks.ts` contém exemplos comentados para:
- WhatsApp Bot (`/viagens-disponiveis`)
- Telegram Finanças (`/resumo-financeiro`)
