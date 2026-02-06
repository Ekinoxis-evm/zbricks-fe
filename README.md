This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Circle Setup

1. Copia `.env.example` a `.env.local`.
2. Completa las variables:
   - `NEXT_PUBLIC_CIRCLE_APP_ID` (Circle Programmable Wallets App ID).
   - `CIRCLE_API_KEY` (server-only).
   - `NEXT_PUBLIC_CIRCLE_BASE_URL` (opcional, default `https://api.circle.com`).
   - `CIRCLE_GATEWAY_BASE_URL` (opcional, default `https://gateway-api-testnet.circle.com`).

## Cómo correr local

1. Instala dependencias (`npm install`).
2. Levanta el servidor (`npm run dev`).
3. Abre `http://localhost:3000`.

## Probar envío USDC (Testnet)

1. Ve a `/auth`, envía OTP y verifica email.
2. Espera a que se cree la wallet y se redirija a `/marketplace`.
3. Haz click en el avatar y entra a `/cuenta`.
4. Ingresa `wallet destino` y `monto USDC`, luego presiona “Enviar”.
5. Confirma la transacción en el panel del SDK.
6. Revisa el balance USDC actualizado.

## Troubleshooting

1. “Sesión inválida” o falta `encryptionKey`: vuelve a `/auth` y verifica el email en la misma sesión.
2. “Insufficient balance”: asegúrate de tener USDC en la wallet de origen.
3. “Transfer failed”: revisa que haya USDC en la wallet de origen y que el address destino sea válido.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
