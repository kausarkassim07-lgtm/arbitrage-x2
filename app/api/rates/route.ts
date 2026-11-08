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
    // One provider request: EUR is the common reference base.
    // Cross-rates are derived from the same dated reference snapshot.
    const url = new URL("https://api.frankfurter.dev/v2/rates");
    url.searchParams.set("base", "EUR");
    url.searchParams.set("quotes", "USD,GBP,INR");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Frankfurter request failed (HTTP ${response.status}).`);
    }

    const rows = (await response.json()) as FrankfurterRate[];
    const referenceRates = new Map<string, number>([["EUR", 1]]);

    for (const row of rows) {
      if (
        row.base === "EUR" &&
        currencies.includes(row.quote) &&
        Number.isFinite(Number(row.rate)) &&
        Number(row.rate) > 0
      ) {
        referenceRates.set(row.quote, Number(row.rate));
      }
    }

    if (currencies.some((currency) => !referenceRates.has(currency))) {
      return NextResponse.json(
        { error: "Frankfurter did not return all requested USD, EUR, GBP and INR reference rates." },
        { status: 502 }
      );
    }

    const rateDate = rows[0]?.date;
    const rates = currencies.flatMap((from) =>
      currencies
        .filter((to) => to !== from)
        .map((to) => ({
          from,
          to,
          rate: referenceRates.get(to)! / referenceRates.get(from)!,
        }))
    );

    return NextResponse.json({
      provider: "Frankfurter",
      currencies,
      rates,
      fetchedAt: new Date().toISOString(),
      rateDate,
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
