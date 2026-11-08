# ArbiScan — Currency Arbitrage Detector

A Next.js dashboard that scans currency conversion cycles using negative-log edge weights and Floyd–Warshall.

## Deploy on Vercel
1. Import this GitHub repository into Vercel.
2. Select the Next.js framework preset.
3. Add environment variable TWELVE_DATA_API_KEY with your Twelve Data API key.
4. Deploy.

## Important limitations
- The app requests 28 independent currency pairs. Check API plan, quota, pair coverage and data licensing.
- A 15-second browser refresh does not guarantee a new provider tick every 15 seconds.
- Indicative rates are not executable bid/ask quotes. Reverse edges are calculated as reciprocals.
- Detected cycles are theoretical signals, not guaranteed profit. Real execution requires spreads, commissions, slippage, latency and trade-size checks.
- Educational project only, not trading advice. Ensure FX activity complies with applicable RBI/FEMA rules.

## Local development
Run npm install, copy .env.example to .env.local, add your API key, then run npm run dev.


## API usage optimization
- The dashboard uses USD, EUR, GBP and INR (six requested currency pairs).
- The browser refreshes market data every 60 seconds to reduce provider API usage.
- Provider quotas and billing rules vary by plan; verify the current Twelve Data allowance before relying on this estimate.
