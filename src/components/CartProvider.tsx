import { createContext, useContext, useEffect, useState, ReactNode } from "react";
/** One cart line = one product + the option the customer clicked (e.g. "Character: Xavier"). The same product with two different options is two lines. */
export type Line = { id: string; qty: number; opt?: string };
const Ctx = createContext<{lines:Line[]; add:(id:string,q?:number,opt?:string)=>void; setQty:(id:string,q:number,opt?:string)=>void; clear:()=>void; count:number; ready:boolean}>({lines:[],add(){},setQty(){},clear(){},count:0,ready:false});
export const useCart = () => useContext(Ctx);
const same = (x: Line, id: string, opt?: string) => x.id === id && (x.opt ?? "") === (opt ?? "");
export default function CartProvider({children}:{children:ReactNode}) {
  const [lines,setLines] = useState<Line[]>([]);
  const [ready,setReady] = useState(false);
  useEffect(()=>{ try{ setLines(JSON.parse(localStorage.getItem("ct-cart")||"[]")); }catch{} setReady(true); },[]);
  useEffect(()=>{ if(!ready) return; try{ localStorage.setItem("ct-cart",JSON.stringify(lines)); }catch{} },[lines,ready]);
  const add=(id:string,q=1,opt?:string)=>setLines(l=>l.some(x=>same(x,id,opt))?l.map(x=>same(x,id,opt)?{...x,qty:x.qty+q}:x):[...l,{id,qty:q,...(opt?{opt}:{})}]);
  const setQty=(id:string,q:number,opt?:string)=>setLines(l=>q<=0?l.filter(x=>!same(x,id,opt)):l.map(x=>same(x,id,opt)?{...x,qty:q}:x));
  return <Ctx.Provider value={{lines,add,setQty,clear:()=>setLines([]),count:lines.reduce((s,x)=>s+x.qty,0),ready}}>{children}</Ctx.Provider>;
}
