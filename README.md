# PAJ Checkout

The hosted page a payer lands on to pay a business's checkout session. A
business creates a session with `POST /pub/v2/checkout/sessions` on the PAJ API
and sends its payer to the `url` it gets back: `<this app>/<access token>`.

```bash
cp .env.example .env         # point NEXT_PUBLIC_API_URL at main_backend
npm install
npm run dev                  # http://localhost:$PORT (3004 by default)
```

`PORT` is read from `.env` (or `.env.local`) for both `npm run dev` and
`npm start`. Next itself can't take the port from an env file — it starts
listening before it loads them — so the two scripts run through
`scripts/next.mjs`, which loads the files first with Next's own loader. A
`PORT` set in the real environment still wins.

main_backend's `PAJ_CHECKOUT_BASE_URL` must point at wherever this app is served,
or the URLs it hands out lead nowhere.

## How it works

- `app/[token]/page.tsx` reads the checkout on the server (`GET /checkout/:token`)
  so the page arrives on the right screen. A bad token is a 404.
- `lib/hooks.ts` keeps it current: the API's `checkout` socket pushes the whole
  checkout after every change, authenticated with the token in the handshake.
  While the socket is down the page polls instead.
- `lib/screen.ts` picks the one screen to show: choose a network, choose a
  token, send to the address, paid, expired part-paid, expired or cancelled.
- The payer picks a network, then a token on it: the network's stablecoin,
  its native coin, a popular token (`GET /checkout/:token/tokens`), or any
  token whose address they paste. A network whose option lacks `anyToken`
  skips the token step and takes only its stablecoin.
- Picking a token calls `POST /checkout/:token/addresses` with the chain and
  mint. That gives the checkout one deposit address on the network — the same
  one every time — and adds the token to what it takes. The API refuses a
  token it can't find or price, so the payer hears it before sending.
- The total is fixed in the stablecoin when the business creates the checkout
  (an NGN price is converted then, at the `rate` shown). The stablecoin counts
  for what arrives; any other token counts for the USDC its swap produces, so
  `useQuote` shows its amount from `GET /checkout/:token/quote` — the live
  price plus a 1% buffer — refreshed every 30 seconds and after every
  transfer.

## Security

The page tells people where to send money, so `proxy.ts` sends a strict
Content-Security-Policy with a per-request nonce: only this app's own scripts
run, it connects only to the PAJ API, and no other site may frame it. QR codes
are drawn in the browser, never by an online service. There is no analytics or
any other third-party script, and there must not be.

When a payment completes the payer is sent back to the business's
`callbackUrl` with `?reference=` added — never the status. The business must
confirm payment from its webhook or `GET /pub/v2/checkout/sessions/...`.
