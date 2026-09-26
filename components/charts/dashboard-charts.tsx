"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

type MonthlyPoint = { month: string; revenus: number; depenses: number }
type CategoryPoint = { name: string; value: number }
const colors = ["#10B981", "#059669", "#64748B", "#94A3B8", "#F59E0B", "#BA1A1A"]

export function DashboardCharts({
  monthlyData,
  categoryData,
  currency,
}: {
  monthlyData: MonthlyPoint[]
  categoryData: CategoryPoint[]
  currency: string
}) {
  const money = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value)
  const reduceMotion = useReducedMotion()

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <motion.div className="xl:col-span-3" initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="h-full rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-semibold">Évolution mensuelle</h2>
          <p className="mb-6 text-sm text-muted-foreground">Revenus et dépenses sur 6 mois</p>
          <div role="img" aria-label="Graphique des revenus et dépenses des six derniers mois" className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={48} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Bar dataKey="revenus" name="Revenus" fill="var(--primary)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="#94A3B8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
            <span><span className="mr-2 inline-block size-2 rounded-full bg-primary" />Revenus</span>
            <span><span className="mr-2 inline-block size-2 rounded-full bg-slate-400" />Dépenses</span>
          </div>
        </CardContent>
      </Card>
      </motion.div>
      <motion.div className="xl:col-span-2" initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
      <Card className="h-full rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-semibold">Par catégorie</h2>
          <p className="mb-3 text-sm text-muted-foreground">Dépenses du mois</p>
          {categoryData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Aucune dépense ce mois-ci.</div>
          ) : (
            <>
              <div role="img" aria-label="Répartition des dépenses par catégorie" className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sortedCategories} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                      {sortedCategories.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => money(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {sortedCategories.slice(0, 5).map((item, index) => (
                  <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="tabular-nums">{money(item.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
