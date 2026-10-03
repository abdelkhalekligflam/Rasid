import { NextResponse } from "next/server"
import { getAccountPlan } from "@/lib/billing/server"
import { createClient } from "@/lib/supabase/server"
import { csvCell } from "@/lib/billing/plans"

export async function GET() {
  const { user, pro } = await getAccountPlan()
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  if (!pro) return NextResponse.json({ error: "Pro required" }, { status: 403 })
  const db=await createClient()
  const rows:string[]=["Date,Type,Amount,Currency,Description"]
  const {data:profile,error:profileError}=await db.from("profiles").select("currency").eq("id",user.id).single()
  if(profileError)return NextResponse.json({error:"Export failed"},{status:500})
  for(let offset=0;;offset+=1000){
    const {data,error}=await db.from("transactions").select("transaction_date,type,amount,description").eq("user_id",user.id).order("id").range(offset,offset+999)
    if(error)return NextResponse.json({error:"Export failed"},{status:500})
    rows.push(...(data??[]).map(row=>[row.transaction_date,row.type,row.amount,profile.currency,row.description].map(csvCell).join(",")))
    if(!data||data.length<1000)break
  }
  return new Response("\ufeff"+rows.join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="rasid-transactions.csv"',"Cache-Control":"no-store"}})
}
