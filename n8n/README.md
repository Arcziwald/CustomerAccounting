# Workflow n8n: Brakomat — Lead z demo

Obsługuje formularz `LeadModal` z demo (POST na `https://n8n.srv1151721.hstgr.cloud/webhook/brakomat-lead`)
i wysyła email z leadem na `hello@artwebcraft.com` przez Resend.

## Import (raz, ~3 minuty)

1. n8n → **Workflows → Import from File** → wybierz `workflow_brakomat_lead.json`.
2. W węźle **Resend - Email do Artura** podmień `TUTAJ_WKLEJ_RESEND_API_KEY` na klucz Resend
   (ten sam, którego używa Brakomat prod — zmienna `RESEND_API_KEY` w Vercel).
3. **Aktywuj workflow** (przełącznik w prawym górnym rogu) — webhook produkcyjny działa
   dopiero po aktywacji.

## Test

```bash
curl -X POST https://n8n.srv1151721.hstgr.cloud/webhook/brakomat-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Jan Testowy","email":"jan@example.com","phone":"+48 600 100 200","clients":"20-50","employees":"2-5","offices":"1","source":"brakomat-demo","timestamp":"2026-06-11T12:00:00Z"}'
```

Po kilku sekundach na `hello@artwebcraft.com` powinien przyjść email „🦁 Lead z demo Brakomat: Jan Testowy".

## Uwagi

- Webhook odpowiada 200 natychmiast (`responseMode: onReceived`) — formularz w demo nie czeka na wysyłkę maila.
- CORS ustawiony na `*` (formularz strzela z `client.accounting.artwebcraft.com`); można zawęzić
  w opcjach węzła Webhook → Allowed Origins.
- Email ma `reply_to` ustawione na adres leada — odpowiadasz bezpośrednio z klienta poczty.
- W treści jest sugerowany pakiet na podstawie liczby klientów (25/75/200 → Pakiet 1/2/3).
