import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const currencies = ["USD", "EUR", "GBP", "INR"];

type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export async function GET() {
  try {
    // Frankfurter publishes reference rates daily and does not require an API key.
    // Cache provider responses for one hour; a 60-second UI refresh cannot make
    // daily reference rates more current.
    const results = await Promise.all(
      currencies.map(async (base) => {
        const quotes = currencies.filter((currency) => currency !== base);
        const url = new URL("https://api.frankfurter.dev/v2/rates");
        url.searchParams.set("base", base);
        url.searchParams.set("quotes", quotes.join(","));

        const response = await fetch(url.toString(), {
          next: { revalidate: 3600 },
        });

        if (!response.ok) {
          throw new Error(`Frankfurter request failed for ${base} (HTTP ${response.status}).`);
        }

        return (await response.json()) as FrankfurterRate[];
      })
    );

    const rows = results.flat();
    const rates = rows
      .filter(
        (row) =>
          currencies.includes(row.base) &&
          currencies.includes(row.quote) &&
          Number.isFinite(Number(row.rate)) &&
          Number(row.rate) > 0
      )
      .map((row) => ({
        from: row.base,
        to: row.quote,
        rate: Number(row.rate),
      }));

    if (rates.length !== currencies.length * (currencies.length - 1)) {
      return NextResponse.json(
        {
          error:
            "Frankfurter returned incomplete coverage for USD, EUR, GBP and INR. Try again later or check supported currencies.",
        },
        { status: 502 }
      );
    }

    const dates = rows.map((row) => row.date).filter(Boolean).sort();
    return NextResponse.json({
      provider: "Frankfurter",
      currencies,
      rates,
      fetchedAt: new Date().toISOString(),
      rateDate: dates[dates.length - 1],
      pairCount: rates.length / 2,
      dataType: "Daily reference rates",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not reach Frankfurter. Try again shortly.",
      },
      { status: 502 }
    );
  }
}
