"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { findArbitrage, RateEdge } from "@/lib/arbitrage";

type ApiData = { provider: string; currencies: string[]; rates: RateEdge[]; fetchedAt: string; rateDate?: string; pairCount: number; dataType?: string };

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(10);
  const [seconds, setSeconds] = useState(60);
  const [amount, setAmount] = useState("1000");
  const [start, setStart] = useState("USD");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rates", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Could not load reference rates.");
      setData(json); setError(""); setLastChecked(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Market data unavailable.");
    } finally { setLoading(false); setSeconds(60); }
  }, []);

  useEffect(() => {
    refresh();
    const refreshTimer = setInterval(refresh, 60000);
    const countdown = setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000);
    return () => { clearInterval(refreshTimer); clearInterval(countdown); };
  }, [refresh]);

  const scan = useMemo(() => data ? findArbitrage(data.rates, data.currencies, fee) : null, [data, fee]);
  const best = scan?.opportunities[0];
  const routeRates = useMemo(() => {
    if (!data) return [];
    return data.rates.filter(r => r.from < r.to);
  }, [data]);
  const rateMap = useMemo(() => new Map(data?.rates.map(r => [r.from + "|" + r.to, r.rate]) || []), [data]);
  const routeForStart = useMemo(() => {
    if (!data) return null;
    const edges = data.rates.filter(r => r.from === start);
    const first = edges.map(edge => {
      const second = data.rates.filter(r => r.from === edge.to && r.to !== start);
      return second.map(mid => {
        const closing = rateMap.get(mid.to + "|" + start);
        return closing ? { path: [start, edge.to, mid.to, start], product: edge.rate * mid.rate * closing } : null;
      }).filter(Boolean);
    }).flat().filter(Boolean) as {path:string[];product:number}[];
    return first.sort((a,b)=>b.product-a.product)[0] || null;
  }, [data, start, rateMap]);
  const fmt = (value: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  const fmtRate = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 6 });

  return <main className="min-h-screen bg-[#f3f2ec] text-[#0c2a21]">
    <header className="sticky top-0 z-30 border-b border-[#0c2a21]/10 bg-[#f3f2ec]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2 text-xl font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0b2e24] text-[#d6ff3d]">⚡</span>Arbitrage X</a>
        <nav className="hidden items-center gap-7 text-sm font-bold text-[#566860] md:flex"><a href="#how">How it works</a><a href="#try">Try a route</a><a href="#markets">Markets</a><a href="#try" className="rounded-full bg-[#d6ff3d] px-5 py-3 text-[#0b2e24]">Open the app</a></nav>
        <a href="#try" className="rounded-full bg-[#d6ff3d] px-4 py-2 text-sm font-extrabold md:hidden">Explore</a>
      </div>
    </header>

    <section id="top" className="relative overflow-hidden rounded-b-[36px] bg-[#0b2e24] text-[#eef3ea]">
      <div className="pointer-events-none absolute -right-28 -top-32 h-[550px] w-[550px] rounded-full bg-[#d6ff3d]/20 blur-[100px]"/>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-bold"><i className="h-2 w-2 rounded-full bg-[#d6ff3d]"/> DAILY REFERENCE-RATE SCANNER</span>
          <h1 className="mt-7 text-5xl font-extrabold leading-[1.02] tracking-[-.05em] md:text-7xl">Spot the gap.<br/><span className="text-[#d6ff3d]">Trace the cycle.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Explore currency conversion networks and detect theoretical arbitrage cycles with the Floyd–Warshall algorithm.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#try" className="rounded-full bg-[#d6ff3d] px-6 py-3 font-extrabold text-[#0b2e24]">Find a route <ArrowRight className="ml-2 inline" size={17}/></a><a href="#how" className="rounded-full border border-white/40 px-6 py-3 font-bold">See how it works</a></div><div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/65"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 ${data && !error ? "bg-emerald-300/10 text-emerald-200" : error ? "bg-red-300/10 text-red-200" : "bg-white/10"}`}><i className={`h-2 w-2 rounded-full ${data && !error ? "bg-emerald-300 animate-pulse" : error ? "bg-red-300" : "bg-amber-300 animate-pulse"}`}/>{data && !error ? "Frankfurter API responding" : error ? "API request failed" : "Testing API connection"}</span><span>{data ? `Last checked ${lastChecked ? new Date(lastChecked).toLocaleTimeString() : "just now"}` : "Waiting for first response"}</span></div>
          <p className="mt-5 text-xs text-white/50">Educational analysis · Not live trading quotes or financial advice</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-[38px] bg-[#050d0a] p-3 shadow-2xl shadow-black/40">
            <div className="min-h-[440px] rounded-[29px] bg-gradient-to-b from-[#14503d] to-[#0a241d] p-6 text-white">
              <div className="flex items-center justify-between text-sm font-extrabold"><span>Opportunity scanner</span><span className={`rounded-full px-3 py-1 text-xs ${data && !error ? "bg-[#d6ff3d]/15 text-[#d6ff3d]" : error ? "bg-red-400/15 text-red-200" : "bg-white/10 text-white/70"}`}><i className={`mr-2 inline-block h-2 w-2 rounded-full ${data && !error ? "bg-[#d6ff3d] animate-pulse" : error ? "bg-red-400" : "bg-amber-300 animate-pulse"}`} />{data && !error ? "API CONNECTED" : error ? "CONNECTION ERROR" : "CONNECTING…"}</span></div>
              <div className="mt-7 rounded-3xl bg-[#d6ff3d] p-5 text-[#0b2e24]"><div className="text-xs font-bold opacity-60">BEST DETECTED CYCLE</div><div className="mt-3 text-sm font-extrabold">{best ? best.path.join(" → ") : "No qualifying cycle"}</div><div className="mt-4 text-4xl font-extrabold">{best ? (best.grossPercent >= 0 ? "+" : "") + best.grossPercent.toFixed(4) + "%" : "—"}</div><div className="mt-1 text-xs opacity-60">Estimated after fee setting</div></div>
              <div className="mt-5 space-y-3">{(scan?.opportunities.slice(1,4) || []).map((op,i)=><div key={op.path.join("-")} className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-xs font-bold"><span>{op.path.join(" → ")}</span><span className="text-[#d6ff3d]">+{op.grossPercent.toFixed(3)}%</span></div>)}
                {!best && <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/65">{loading ? "Loading reference rates…" : "No theoretical positive cycle found at the current fee setting."}</div>}
              </div>
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/5 rounded-full bg-[#d6ff3d]"/></div>
              <div className="mt-3 text-[10px] text-white/60">Source: Frankfurter API · Rate date: {data?.rateDate || "Waiting for data"}</div>
            </div>
          </div>
          <div className="absolute -left-5 top-20 rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-[#0c2a21] shadow-xl">USD / EUR <span className="ml-2 text-[#1a7f4b]">↗</span></div>
          <div className="absolute -right-3 bottom-14 rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-[#0c2a21] shadow-xl">Floyd–Warshall</div>
        </div>
      </div>
    </section>

    <div className="border-b border-[#0c2a21]/10 py-5"><div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 text-sm font-extrabold text-[#566860]"><span>USD / EUR</span><span>GBP / INR</span><span>EUR / GBP</span><span>USD / INR</span><span>DAILY REFERENCE DATA</span></div></div>

    <section id="how" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Clear routes.<br/>No guesswork.</h2><p className="mt-4 max-w-xl text-lg text-[#566860]">A simple view of how a currency network can be checked for profitable-looking loops.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[["01","Watch the rates","Load a consistent daily reference-rate snapshot from Frankfurter."],["02","Find the cycle","Floyd–Warshall checks the currency graph for negative-log cycles."],["03","Review the result","Inspect each conversion leg and compare the theoretical return after estimated fees."]].map(([n,title,desc])=><article key={n} className="rounded-[26px] border border-[#0c2a21]/10 bg-white p-7"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0b2e24] font-extrabold text-[#d6ff3d]">{n}</div><h3 className="mt-6 text-xl font-extrabold">{title}</h3><p className="mt-2 leading-7 text-[#566860]">{desc}</p></article>)}
      </div>
    </section>

    <section id="try" className="mx-3 rounded-[34px] bg-[#0b2e24] py-16 text-white md:mx-5">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
        <div><h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Try a route.</h2><p className="mt-4 max-w-lg text-lg leading-8 text-white/65">Choose a starting currency and amount to trace a three-leg round trip using the latest available reference rates.</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/70"><Clock3 className="text-[#d6ff3d]"/> Connection checked every 60 seconds · provider data is daily</div>
        </div>
        <div className="rounded-[30px] bg-[#102f25] p-6 shadow-xl">
          <div className="flex items-center justify-between"><b className="text-lg">Find my route</b><span className="rounded-full bg-[#d6ff3d]/15 px-3 py-1 text-xs font-bold text-[#d6ff3d]">REFERENCE DATA</span></div>
          <label className="mt-7 block text-xs font-extrabold uppercase tracking-widest text-white/50" htmlFor="amount">Starting amount</label>
          <input id="amount" type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#d6ff3d]"/>
          <label className="mt-5 block text-xs font-extrabold uppercase tracking-widest text-white/50" htmlFor="start">Start currency</label>
          <select id="start" value={start} onChange={e=>setStart(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#102f25] px-4 py-3 font-bold text-white">{(data?.currencies || ["USD","EUR","GBP","INR"]).map(c=><option key={c}>{c}</option>)}</select>
          <div className="mt-6 rounded-2xl bg-white/5 p-4">
            {routeForStart && data ? <><div className="text-xs font-bold text-[#d6ff3d]">BEST THREE-LEG ROUTE</div><div className="mt-2 text-sm font-extrabold">{routeForStart.path.join(" → ")}</div><div className="mt-3 text-2xl font-extrabold">{fmt(Number(amount||0)*routeForStart.product,start)}</div><div className="mt-1 text-xs text-white/50">Theoretical final amount before fees and execution costs</div></> : <div className="text-sm text-white/60">{loading ? "Loading reference rates…" : "No route available for this currency."}</div>}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/40">This calculator uses indicative daily rates and does not represent an executable trade.</p>
        </div>
      </div>
    </section>

    <section id="markets" className="mx-auto max-w-6xl px-5 py-20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 className="text-4xl font-extrabold md:text-5xl">Markets.</h2><p className="mt-3 text-[#566860]">Four currencies, six unique pairs, one consistent reference snapshot.</p></div>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 self-start rounded-full bg-[#d6ff3d] px-5 py-3 font-extrabold text-[#0b2e24] disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> {loading ? "Checking…" : "Test API / Refresh"}</button></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(data?.currencies || ["USD","EUR","GBP","INR"]).map((c,i)=><div key={c} className="rounded-3xl border border-[#0c2a21]/10 bg-white p-6"><div className="text-xs font-extrabold text-[#1a7f4b]">CURRENCY {String(i+1).padStart(2,"0")}</div><div className="mt-3 text-3xl font-extrabold">{c}</div><div className="mt-1 text-sm text-[#566860]">{({USD:"US Dollar",EUR:"Euro",GBP:"British Pound",INR:"Indian Rupee"} as Record<string,string>)[c] || c}</div></div>)}</div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-[#0c2a21]/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0c2a21]/10 p-5"><div><h3 className="font-extrabold">Currency rate matrix</h3><p className="mt-1 text-xs text-[#566860]">Indicative cross-rates derived from one EUR reference snapshot.</p></div><span className={`rounded-full px-3 py-2 text-xs font-extrabold ${data && !error ? "bg-emerald-100 text-emerald-800" : error ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{data && !error ? "● CONNECTED · " : error ? "● ERROR · " : "● CHECKING · "}{data?.provider || "FRANKFURTER"}</span></div>
        {data ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs text-[#566860]"><tr>{["PAIR","REFERENCE RATE","INVERSE"].map(x=><th key={x} className="px-5 py-4">{x}</th>)}</tr></thead><tbody>{routeRates.map(r=><tr key={r.from+r.to} className="border-t border-[#0c2a21]/10"><td className="px-5 py-4 font-extrabold">{r.from}/{r.to}</td><td className="px-5 py-4 tabular-nums">{fmtRate(r.rate)}</td><td className="px-5 py-4 tabular-nums text-[#566860]">{fmtRate(1/r.rate)}</td></tr>)}</tbody></table></div> : <div className="p-8 text-sm text-[#566860]">{error || "Connecting to Frankfurter…"}</div>}
      </div>
    </section>

    <footer className="rounded-t-[34px] bg-[#0b2e24] px-5 py-12 text-white/60"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 md:flex-row"><div><div className="text-xl font-extrabold text-white">⚡ Arbitrage X</div><p className="mt-2 max-w-xl text-sm leading-6">A student project exploring currency arbitrage detection with Floyd–Warshall. Reference rates are daily and are not executable bid/ask quotes.</p></div><div className="text-xs md:text-right"><div className="font-bold text-white/80">DATA SOURCE · {data?.provider || "FRANKFURTER"}</div><div className="mt-2">Rate date: {data?.rateDate || "Not loaded"} · Next check: {seconds}s</div><div className="mt-2">© 2026 Arbitrage X · Educational use only</div></div></div></footer>
    {error && <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-xl"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0"/><div><b>Market data unavailable</b><p className="mt-1">{error}</p></div></div></div>}
    <div className="sr-only" aria-live="polite">{data ? "Frankfurter connected" : loading ? "Loading market data" : "Market data unavailable"}</div>
  </main>;
}
