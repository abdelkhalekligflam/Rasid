"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LifeBuoy, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useLocale, useT } from "@/components/locale-provider"
import { localeTags } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageSkeleton } from "@/components/shared/page-skeleton"
import { notify } from "@/components/shared/toast"

const kinds = { bug: "Report a bug", complaint: "Complaint", question: "Ask a question" }
const statuses = { open: "Received", in_progress: "In progress", resolved: "Resolved" }
type Ticket = { id: string; subject: string; description: string; kind: keyof typeof kinds; status: keyof typeof statuses; response: string | null; created_at: string }

export default function SupportPage() {
  const t = useT()
  const locale = useLocale()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<keyof typeof kinds>("bug")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [page, setPage] = useState(0)
  const tickets = useQuery({
    queryKey: ["support-requests", page], refetchInterval: 60000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired")
      const { data, error } = await supabase.from("support_requests").select("id,kind,subject,description,status,response,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).order("id").range(page * 10, page * 10 + 10)
      if (error) throw error
      return data as Ticket[]
    },
  })
  const submit = useMutation({
    mutationFn: async () => {
      if (subject.trim().length < 3 || description.trim().length < 10) throw new Error("invalid")
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("Session expired")
      const { error } = await supabase.from("support_requests").insert({ kind, subject: subject.trim(), description: description.trim() })
      if (error) throw error
    },
    onSuccess: () => {
      setSubject(""); setDescription(""); setPage(0)
      void queryClient.invalidateQueries({ queryKey: ["support-requests"] })
      notify(t("Your request has been received."))
    },
  })
  return <div className="mx-auto max-w-5xl space-y-8">
    <div><p className="text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{t("Help center")}</p><h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{t("Support")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("Report a problem, submit a complaint or ask for help.")}</p></div>
    <Card className="rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
      <div className="flex items-center gap-3"><LifeBuoy className="size-5" /><h2 className="font-semibold">{t("New request")}</h2></div>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!submit.isPending) submit.mutate() }}>
        <div className="space-y-2"><Label htmlFor="support-kind">{t("Request type")}</Label><Select value={kind} onValueChange={(value) => setKind(value as keyof typeof kinds)} disabled={submit.isPending}><SelectTrigger id="support-kind" className="w-full sm:max-w-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(kinds).map(([value, label]) => <SelectItem key={value} value={value}>{t(label)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="support-subject">{t("Subject")}</Label><Input id="support-subject" required minLength={3} maxLength={120} value={subject} disabled={submit.isPending} onChange={(event) => { setSubject(event.target.value); submit.reset() }} /></div>
        <div className="space-y-2"><Label htmlFor="support-description">{t("Describe the problem")}</Label><Textarea id="support-description" required minLength={10} maxLength={4000} rows={6} value={description} disabled={submit.isPending} onChange={(event) => { setDescription(event.target.value); submit.reset() }} placeholder={t("What happened? What did you expect? Include the steps and the error message.")} /></div>
        <p className="text-xs text-muted-foreground">{t("Never include passwords, payment details or other sensitive information.")}</p>
        {submit.error && <p role="alert" className="text-sm text-destructive">{t(submit.error.message.includes("support_daily_limit") ? "You can send up to 10 requests per 24 hours. Please try again later." : "Couldn't send your request. Check the fields and try again.")}</p>}
        <Button type="submit" disabled={submit.isPending || subject.trim().length < 3 || description.trim().length < 10}><Send className="size-4" />{submit.isPending ? t("Sending...") : t("Send request")}</Button>
      </form>
    </CardContent></Card>
    <section className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="font-heading text-lg font-semibold">{t("Your requests")}</h2><Button size="sm" variant="outline" disabled={tickets.isFetching} onClick={() => void tickets.refetch()}>{t("Refresh")}</Button></div><p className="text-xs text-muted-foreground">{t("Check this page for updates and replies from support.")}</p>
      {tickets.isLoading && <PageSkeleton rows={2} />}
      {tickets.error && <p role="alert" className="text-sm text-destructive">{t("Couldn't load your requests.")}</p>}
      {tickets.data?.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("No requests yet.")}</div>}
      {tickets.data?.slice(0, 10).map((ticket) => <Card key={ticket.id} className="rounded-xl shadow-none"><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-words font-medium">{ticket.subject}</h3><span className={`rounded-full border px-2.5 py-1 text-xs ${ticket.status === "resolved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{t(statuses[ticket.status])}</span></div><p className="text-xs text-muted-foreground">{t(kinds[ticket.kind])} · {new Intl.DateTimeFormat(localeTags[locale], { dateStyle: "medium" }).format(new Date(ticket.created_at))} · #{ticket.id.slice(0, 8)}</p><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{ticket.description}</p>{ticket.response && <div className="space-y-2 rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold">{t("Support reply")}</p><p className="whitespace-pre-wrap break-words text-sm">{ticket.response}</p></div>}</CardContent></Card>)}
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={page === 0 || tickets.isFetching} onClick={() => setPage(page - 1)}>{t("Previous")}</Button><Button variant="outline" size="sm" disabled={!tickets.data || tickets.data.length <= 10 || tickets.isFetching} onClick={() => setPage(page + 1)}>{t("Next")}</Button></div>
    </section>
  </div>
}
