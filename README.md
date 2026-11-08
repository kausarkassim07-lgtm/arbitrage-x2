# ArbiScan — Currency Arbitrage Detector

A Next.js dashboard that scans currency conversion cycles using negative-log edge weights and the Floyd–Warshall algorithm.

## Market data
- Provider: [Frankfurter API](https://frankfurter.dev/), using its v2 rates endpoint.
- No API key, account, or Twelve Data environment variable is required.
- Currency universe: USD, EUR, GBP and INR (six unique pairs).
- Frankfurter supplies daily reference rates, not live executable Forex bid/ask quotes.
- The dashboard refreshes every 60 seconds, while server-side provider responses are cached for one hour. Refreshing the dashboard does not create fresher daily data.

## Deploy on Vercel
1. Import this GitHub repository into Vercel.
2. Select the Next.js framework preset.
3. No market-data environment variable is needed.
4. Deploy.

If you previously added `TWELVE_DATA_API_KEY` in Vercel, you can remove it; this project no longer reads it.

## Important limitations
- Frankfurter rates are daily reference rates and may not reflect current intraday market prices.
- These rates are not executable bid/ask quotes. The scanner's opportunities are theoretical calculations and should not be treated as real trading profit.
- Blended reference rates from multiple sources may not be perfectly synchronized. Small apparent cycles can be data-source or rounding artifacts.
- Real execution requires independent executable quotes, spreads, commissions, slippage, latency and trade-size checks.
- Educational project only, not trading advice. Ensure any FX activity complies with applicable RBI/FEMA rules.

## Local development
Run `npm install`, then `npm run dev`. No API key or `.env.local` file is required.
