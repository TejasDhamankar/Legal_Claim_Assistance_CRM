"use client"

import * as React from "react"
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import {
    Plus,
    LayoutDashboard,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    X,
    Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from "framer-motion"
import { STATUS_CONFIG, BUCKETS, lawsuitColor, STATUS_SEQUENCE } from './status-registry'
import Link from "next/link"
import { cn } from "@/lib/utils"

function hexToRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    const n = parseInt(full, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type ManagedLawsuit = {
    _id: string
    name: string
    color?: string
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [managedLawsuits, setManagedLawsuits] = useState<ManagedLawsuit[]>([])
    const [loading, setLoading] = useState(true)
    const [activeLawsuit, setActiveLawsuit] = useState<string | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [newLawsuitName, setNewLawsuitName] = useState('')
    const [savingLawsuit, setSavingLawsuit] = useState(false)
    const [lawsuitError, setLawsuitError] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const isSuperAdmin = user?.role === 'super_admin'

    const fetchDashboard = useCallback(async () => {
        try {
            const [statsRes, lawsuitsRes] = await Promise.all([
                axios.get(`/api/leads/stats?t=${Date.now()}`),
                axios.get(`/api/lawsuits?t=${Date.now()}`),
            ])
            setStats(statsRes.data)
            setManagedLawsuits(lawsuitsRes.data?.lawsuits || [])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!authLoading && user) fetchDashboard()
    }, [user, authLoading, fetchDashboard])

    const categorizedStats = useMemo(() => {
        if (!stats?.statusCounts) return { pipelines: 0, closures: 0, issues: 0 }

        const getBucketCount = (bucket: string[]) =>
            bucket.reduce((acc, status) => {
                const found = stats.statusCounts.find((s: any) => s._id === status)
                return acc + (found?.count || 0)
            }, 0)

        return {
            pipelines: getBucketCount(BUCKETS.PIPELINE),
            closures: getBucketCount(BUCKETS.CONVERSION),
            issues: getBucketCount(BUCKETS.RISK)
        }
    }, [stats])

    const statusRows = useMemo(() => {
        const keys = Object.keys(STATUS_CONFIG)
        return keys
            .map((status) => ({
                status,
                label: status.replace(/_/g, ' '),
                count: stats?.statusCounts?.find((s: any) => s._id === status)?.count || 0,
                color: STATUS_CONFIG[status].color,
                icon: STATUS_CONFIG[status].icon,
            }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count
                return STATUS_SEQUENCE.indexOf(a.status) - STATUS_SEQUENCE.indexOf(b.status)
            })
    }, [stats])

    const chartData = useMemo(() =>
        statusRows.filter((r) => r.count > 0).slice(0, 14).map((r) => ({
            name: r.label,
            value: r.count,
            color: r.color,
        })),
    [statusRows])

    const lawsuits = useMemo(() => {
        const countMap = new Map<string, number>()
        for (const row of stats?.lawsuitCounts || []) {
            if (!row?._id || row._id === 'Unassigned') continue
            countMap.set(String(row._id).toLowerCase(), row.count as number)
        }

        // Curated active list (preferred)
        if (managedLawsuits.length > 0) {
            return managedLawsuits.map((l) => ({
                id: l._id,
                name: l.name,
                count: countMap.get(l.name.toLowerCase()) || 0,
                color: l.color || lawsuitColor(l.name),
            }))
        }

        // Fallback: derived from lead data if none managed yet
        return (stats?.lawsuitCounts || [])
            .filter((l: any) => l._id && l._id !== 'Unassigned' && String(l._id).trim())
            .map((l: any) => ({
                id: String(l._id),
                name: String(l._id),
                count: l.count as number,
                color: lawsuitColor(String(l._id)),
            }))
    }, [stats, managedLawsuits])

    const handleAddLawsuit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLawsuitError(null)
        const name = newLawsuitName.trim()
        if (!name) {
            setLawsuitError('Enter a lawsuit name')
            return
        }
        setSavingLawsuit(true)
        try {
            await axios.post('/api/admin/lawsuits', { name })
            setNewLawsuitName('')
            setAddOpen(false)
            await fetchDashboard()
        } catch (err: any) {
            setLawsuitError(err?.response?.data?.message || 'Could not add lawsuit')
        } finally {
            setSavingLawsuit(false)
        }
    }

    const handleRemoveLawsuit = async (id: string) => {
        if (!isSuperAdmin) return
        setRemovingId(id)
        try {
            await axios.delete(`/api/admin/lawsuits/${id}`)
            if (activeLawsuit) {
                const removed = managedLawsuits.find((l) => l._id === id)
                if (removed && activeLawsuit === removed.name) setActiveLawsuit(null)
            }
            await fetchDashboard()
        } finally {
            setRemovingId(null)
        }
    }

    const summary = [
        { label: 'Total leads', val: stats?.totalLeads, icon: LayoutDashboard, tone: 'text-foreground' },
        { label: 'In pipeline', val: categorizedStats.pipelines, icon: TrendingUp, tone: 'text-sky-700 dark:text-sky-400' },
        { label: 'Conversions', val: categorizedStats.closures, icon: CheckCircle2, tone: 'text-emerald-700 dark:text-emerald-400' },
        { label: 'Risk alerts', val: categorizedStats.issues, icon: AlertTriangle, tone: 'text-rose-700 dark:text-rose-400' },
    ]

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 w-full">

                {/* Welcome */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
                >
                    <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(), 'EEEE, MMMM d')}
                        </p>
                        <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight text-foreground">
                            Welcome{user?.name ? `, ${user.name}` : ''}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-xl">
                            Pipeline health and status inventory for today&apos;s active claims work.
                        </p>
                    </div>
                    <Link href="/leads/create">
                        <Button size="default" className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            New lead
                        </Button>
                    </Link>
                </motion.section>

                {/* Active lawsuits */}
                {(lawsuits.length > 0 || isSuperAdmin) && (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="h-4 w-0.5 rounded-full bg-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Active lawsuits today</h3>
                            {lawsuits.length > 0 && (
                                <span className="text-xs text-muted-foreground">{lawsuits.length}</span>
                            )}
                            {isSuperAdmin && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 ml-auto gap-1.5 text-xs"
                                    onClick={() => {
                                        setLawsuitError(null)
                                        setAddOpen(true)
                                    }}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add lawsuit
                                </Button>
                            )}
                        </div>

                        {lawsuits.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border/80 bg-card/50 px-4 py-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No active lawsuits yet. Add one to show it here for the team.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveLawsuit(null)}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                                        activeLawsuit === null
                                            ? "border-primary/30 bg-primary/5 text-foreground"
                                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    )}
                                >
                                    All
                                </button>
                                {lawsuits.map((l) => {
                                    const active = activeLawsuit === l.name
                                    return (
                                        <div
                                            key={l.id}
                                            className={cn(
                                                "group relative inline-flex items-center rounded-md border transition-colors",
                                                active
                                                    ? "bg-card text-foreground shadow-sm"
                                                    : "bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card"
                                            )}
                                            style={{
                                                borderColor: active ? hexToRgba(l.color, 0.45) : undefined,
                                            }}
                                        >
                                            <Link
                                                href={`/leads?search=${encodeURIComponent(l.name)}`}
                                                onClick={() => setActiveLawsuit(l.name)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium"
                                            >
                                                <span
                                                    className="size-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: l.color }}
                                                />
                                                <span className="capitalize">{l.name.toLowerCase()}</span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">{l.count}</span>
                                            </Link>
                                            {isSuperAdmin && managedLawsuits.some((m) => m._id === l.id) && (
                                                <button
                                                    type="button"
                                                    title="Remove lawsuit"
                                                    disabled={removingId === l.id}
                                                    onClick={() => handleRemoveLawsuit(l.id)}
                                                    className="pr-2 pl-0.5 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                >
                                                    {removingId === l.id
                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                        : <X className="h-3 w-3" />}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.section>
                )}

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add active lawsuit</DialogTitle>
                            <DialogDescription>
                                This will appear as a chip on the dashboard for everyone.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddLawsuit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lawsuit-name">Lawsuit name</Label>
                                <Input
                                    id="lawsuit-name"
                                    placeholder="e.g. Ride Share"
                                    value={newLawsuitName}
                                    onChange={(e) => setNewLawsuitName(e.target.value)}
                                    autoFocus
                                />
                                {lawsuitError && (
                                    <p className="text-xs text-destructive">{lawsuitError}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={savingLawsuit}>
                                    {savingLawsuit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* KPI strip */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 }}
                    className="grid gap-3 grid-cols-2 lg:grid-cols-4"
                >
                    {summary.map((m) => (
                        <Card key={m.label} className="shadow-none border-border/80 bg-card/90 py-4 gap-3">
                            <CardHeader className="flex flex-row items-center justify-between px-5 pb-0 space-y-0">
                                <CardTitle className="text-xs font-medium text-muted-foreground">
                                    {m.label}
                                </CardTitle>
                                <m.icon className={cn("h-4 w-4 opacity-70", m.tone)} />
                            </CardHeader>
                            <CardContent className="px-5">
                                <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                                    {loading ? '—' : (m.val ?? 0)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.section>

                {/* Status inventory */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="h-4 w-0.5 rounded-full bg-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Status inventory</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                            Live
                        </Badge>
                    </div>

                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {statusRows.map((row, index) => (
                            <motion.div
                                key={row.status}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
                            >
                                <div
                                    className="group relative overflow-hidden rounded-lg border border-border/80 bg-card p-3.5 transition-shadow hover:shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${hexToRgba(row.color, 0.1)} 0%, transparent 55%)`,
                                    }}
                                >
                                    <div
                                        className="absolute inset-y-0 left-0 w-[3px]"
                                        style={{ backgroundColor: row.color }}
                                    />
                                    <div className="flex items-start gap-3 pl-1">
                                        <div
                                            className="flex size-9 shrink-0 items-center justify-center rounded-md"
                                            style={{
                                                backgroundColor: hexToRgba(row.color, 0.14),
                                                color: row.color,
                                            }}
                                        >
                                            {React.isValidElement(row.icon)
                                                ? React.cloneElement(row.icon as React.ReactElement<{ className?: string; size?: number }>, {
                                                    className: 'size-4',
                                                    size: 16,
                                                })
                                                : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xl font-semibold tracking-tight tabular-nums text-foreground leading-none">
                                                {loading ? '—' : row.count}
                                            </div>
                                            <div className="mt-1.5 text-[11px] font-medium text-muted-foreground truncate capitalize">
                                                {row.label.toLowerCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Charts + activity */}
                <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
                    <Card className="xl:col-span-2 shadow-none border-border/80 bg-card/90 gap-4 py-5">
                        <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
                            <CardTitle className="text-sm font-semibold">Status distribution</CardTitle>
                            <span className="text-xs text-muted-foreground">Top statuses by volume</span>
                        </CardHeader>
                        <CardContent className="h-[340px] px-2 sm:px-4">
                            {chartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    No status data yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={chartData}
                                        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            fontSize={11}
                                            width={108}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: 'currentColor' }}
                                            className="text-muted-foreground"
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                borderColor: 'var(--border)',
                                                fontSize: '12px',
                                                borderRadius: '8px',
                                                boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={11}>
                                            {chartData.map((entry, idx) => (
                                                <Cell key={`cell-${idx}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border-border/80 bg-card/90 overflow-hidden gap-0 py-0">
                        <CardHeader className="border-b border-border/70 px-5 py-4">
                            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[340px] overflow-y-auto no-scrollbar">
                            <div className="divide-y divide-border/70">
                                {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((act: any, i: number) => {
                                    const toStatus = act.statusHistory?.toStatus || ''
                                    const color = STATUS_CONFIG[toStatus]?.color || '#64748b'
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                                            <div
                                                className="h-9 w-9 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0"
                                                style={{
                                                    backgroundColor: hexToRgba(color, 0.12),
                                                    color,
                                                }}
                                            >
                                                {act.firstName?.[0]}{act.lastName?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {act.firstName} {act.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize truncate">
                                                    {toStatus.replace(/_/g, ' ').toLowerCase()}
                                                </p>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground text-right leading-tight tabular-nums shrink-0">
                                                <div>{format(new Date(act.statusHistory.timestamp), 'MM/dd/yy')}</div>
                                                <div>{format(new Date(act.statusHistory.timestamp), 'h:mm a')}</div>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center text-sm text-muted-foreground p-10">
                                        No recent activity.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Funnel + ratio */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-none border-border/80 bg-card/90 gap-4 py-5">
                        <CardHeader className="px-5 pb-0">
                            <CardTitle className="text-sm font-semibold">Funnel overview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[240px] px-2 sm:px-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { stage: 'Total', value: stats?.totalLeads || 0 },
                                    { stage: 'Active', value: categorizedStats.pipelines },
                                    { stage: 'Verified', value: stats?.statusCounts?.find((s: any) => s._id === 'VERIFIED')?.count || 0 },
                                    { stage: 'Paid', value: stats?.statusCounts?.find((s: any) => s._id === 'PAID')?.count || 0 },
                                ]}>
                                    <XAxis
                                        dataKey="stage"
                                        fontSize={11}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                                        <Cell fill="oklch(0.32 0.055 250)" fillOpacity={0.95} />
                                        <Cell fill="oklch(0.32 0.055 250)" fillOpacity={0.72} />
                                        <Cell fill="oklch(0.32 0.055 250)" fillOpacity={0.5} />
                                        <Cell fill="oklch(0.32 0.055 250)" fillOpacity={0.32} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border-border/80 bg-card/90 flex flex-col gap-4 py-5">
                        <CardHeader className="px-5 pb-0">
                            <CardTitle className="text-sm font-semibold">Conversion ratio</CardTitle>
                        </CardHeader>
                        <div className="flex-1 flex items-center justify-center relative h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: categorizedStats.pipelines || 0 },
                                            { name: 'Converted', value: categorizedStats.closures || 0 },
                                            { name: 'Risk', value: categorizedStats.issues || 0 },
                                        ]}
                                        innerRadius="68%"
                                        outerRadius="88%"
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="oklch(0.45 0.06 250)" />
                                        <Cell fill="oklch(0.55 0.1 155)" />
                                        <Cell fill="oklch(0.55 0.16 25)" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute text-center">
                                <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                                    {stats?.totalLeads > 0
                                        ? `${((categorizedStats.closures / stats.totalLeads) * 100).toFixed(0)}%`
                                        : '0%'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">converted</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
