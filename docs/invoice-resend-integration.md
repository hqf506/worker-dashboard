# Invoice resend integration (review only)

The dashboard now has a **Resend invoice** modal available to logged-in admins and branch workers. It looks up a Loyverse receipt, shows recipient/name/total/branch, and requires an explicit second click to send.

## Server environment variables

- `LOYVERSE_API_TOKEN`: private Loyverse API token; never use `NEXT_PUBLIC_`.
- `INVOICE_RESEND_SIGNING_SECRET`: long random secret for 5-minute preview confirmations.
- `INVOICE_RESEND_WEBHOOK_URL`: HTTPS n8n **Webhook Trigger** production endpoint, not a Form Trigger URL and not localhost.
- `INVOICE_RESEND_WEBHOOK_SECRET`: shared secret used in `x-invoice-resend-secret` header.

Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are also required.

## Important: n8n is NOT connected yet

The current n8n workflow uses a **Form Trigger** running locally on the Mac. That cannot be called by the deployed Vercel worker dashboard. Before enabling send:

1. Deploy or migrate the separate resend workflow to a persistent HTTPS n8n instance.
2. Use a separate Webhook Trigger that checks `x-invoice-resend-secret`; have it fetch the receipt by number, generate the correct branch PDF, send via UltraMsg once, and return a JSON response with `sent: true` **only** when UltraMsg accepts the send request. Do not reuse the interactive confirmation Form Trigger for this API.
3. Configure the four environment variables securely in Vercel.
4. Add durable audit logging and duplicate-send protection before production use.
5. Check the worker branch labels against `profiles.branch`, and test both branches.
6. Rotate previously exposed Loyverse and UltraMsg tokens.

Until configured, the server will return 503 instead of sending.

**Do not merge/deploy without explicit owner approval.** The main branch and existing invoice workflow are unchanged.
