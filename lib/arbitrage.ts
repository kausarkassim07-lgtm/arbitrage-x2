export type RateEdge = { from: string; to: string; rate: number };
export type Opportunity = { path: string[]; grossPercent: number; product: number; length: number };
export function findArbitrage(edges: RateEdge[], currencies: string[], feeBps = 0) {
 const n=currencies.length, index=new Map(currencies.map((c,i)=>[c,i]));
 const dist=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:Number.POSITIVE_INFINITY));
 const fee=1-feeBps/10000, edgeMap=new Map<string,number>();
 for(const e of edges){const i=index.get(e.from),j=index.get(e.to);if(i===undefined||j===undefined||e.rate<=0)continue;const net=e.rate*fee;dist[i][j]=Math.min(dist[i][j],-Math.log(net));edgeMap.set(e.from+"|"+e.to,net);}
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(dist[i][k]+dist[k][j]<dist[i][j])dist[i][j]=dist[i][k]+dist[k][j];
 const negative=new Set<number>();for(let i=0;i<n;i++)if(dist[i][i]<-1e-10)negative.add(i);
 const found=new Map<string,Opportunity>();
 for(const start of currencies){const walk=(current:string,path:string[],product:number)=>{if(found.size>=30)return;for(const next of currencies){const rate=edgeMap.get(current+"|"+next);if(!rate)continue;if(next===start&&path.length>=2){const total=product*rate;if(total>1+1e-8){const route=[...path,start];found.set(route.join(">"),{path:route,product:total,grossPercent:(total-1)*100,length:route.length-1});}}else if(!path.includes(next)&&path.length<n)walk(next,[...path,next],product*rate);}};walk(start,[start],1);}
 return {hasNegativeCycle:negative.size>0,negativeCycleCount:negative.size,opportunities:[...found.values()].sort((a,b)=>b.grossPercent-a.grossPercent).slice(0,30)};
}
