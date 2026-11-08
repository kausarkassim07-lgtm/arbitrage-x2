import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const currencies=["USD","EUR","GBP","JPY","CHF","CAD","AUD","INR"];
const pairs=currencies.flatMap((a,i)=>currencies.slice(i+1).map(b=>a+"/"+b));
export async function GET(){
 const key=process.env.TWELVE_DATA_API_KEY;
 if(!key)return NextResponse.json({error:"Missing TWELVE_DATA_API_KEY. Add it in Vercel Environment Variables."},{status:503});
 try{const url=new URL("https://api.twelvedata.com/exchange_rate");url.searchParams.set("symbol",pairs.join(","));url.searchParams.set("apikey",key);const response=await fetch(url.toString(),{cache:"no-store"});const payload=await response.json();if(!response.ok||payload.status==="error"||payload.code)return NextResponse.json({error:payload.message||"Market-data provider error."},{status:response.status||502});const rows=Array.isArray(payload)?payload:(payload.data&&Array.isArray(payload.data)?payload.data:Object.values(payload).filter((v:any)=>v&&typeof v==="object"&&("rate" in v||"close" in v)));const rates:{from:string;to:string;rate:number}[]=[];for(const row of rows as any[]){const [from,to]=String(row.symbol||"").split("/");const rate=Number(row.rate??row.close??row.price);if(from&&to&&Number.isFinite(rate)&&rate>0){rates.push({from,to,rate},{from:to,to:from,rate:1/rate});}}if(rates.length<10)return NextResponse.json({error:"Provider returned too few currency pairs. Check API plan and pair coverage."},{status:502});return NextResponse.json({provider:"Twelve Data",currencies,rates,fetchedAt:new Date().toISOString(),pairCount:rates.length/2});}catch{return NextResponse.json({error:"Could not reach the market-data provider. Try again shortly."},{status:502});}
}
