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
- `lib/screen.ts` picks the one screen to show: choose a network, send to the
  address, paid, expired part-paid, expired or cancelled.
- Choosing a network calls `POST /checkout/:token/addresses`, which gives the
  checkout a deposit address on that network — the same one every time. The
  payer may send to it in as many transfers as they like, from any wallet, and
  each one counts towards `amountDue` until it is reached. The amount is fixed
  in the stablecoin when the business creates the checkout; an NGN price is
  converted then, at the `rate` shown.

## Security

The page tells people where to send money, so `proxy.ts` sends a strict
Content-Security-Policy with a per-request nonce: only this app's own scripts
run, it connects only to the PAJ API, and no other site may frame it. QR codes
are drawn in the browser, never by an online service. There is no analytics or
any other third-party script, and there must not be.

When a payment completes the payer is sent back to the business's
`callbackUrl` with `?reference=` added — never the status. The business must
confirm payment from its webhook or `GET /pub/v2/checkout/sessions/...`.
