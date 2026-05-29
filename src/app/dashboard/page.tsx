"use client"

import * as React from "react"
import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import {
    Plus,
    LayoutDashboard,
    TrendingUp,
    CheckCircle,
    Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from "framer-motion"

// Import your configuration registry
import { STATUS_CONFIG, BUCKETS } from './status-registry'
import Link from "next/link"

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`/api/leads/stats?t=${Date.now()}`)
            setStats(data)
        } finally { setLoading(false) }
    }

    useEffect(() => { if (!authLoading && user) fetchStats() }, [user, authLoading])

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

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 transition-colors duration-300">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-foreground">Dashboard</h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Welcome back, {user?.name || '...'}
                        </p>
                    </div>
                    <Link href="/leads/create" className="w-full md:w-auto">
                        <Button size="sm" className="font-bold gap-2 rounded-lg w-full md:w-auto bg-primary dark:bg-white dark:text-black">
                            <Plus className="h-4 w-4" /> New Lead
                        </Button>
                    </Link>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total Leads', val: stats?.totalLeads, icon: LayoutDashboard },
                        { label: 'In Pipeline', val: categorizedStats.pipelines, icon: TrendingUp },
                        { label: 'Conversions', val: categorizedStats.closures, icon: CheckCircle },
                        { label: 'Risk Alerts', val: categorizedStats.issues, icon: Activity, color: 'text-red-500' },
                    ].map((m, i) => (
                        <Card key={i} className="bg-card/50 dark:bg-[#0a0a0a] border-border dark:border-zinc-800 shadow-none transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">{m.label}</CardTitle>
                                <m.icon className={`h-4 w-4 ${m.color || 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold italic text-foreground">{m.val ?? 0}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart and Feed Section */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    {/* Status Chart */}
                   <Card className="lg:col-span-2 shadow-none bg-card/40 dark:bg-[#0a0a0a] border-border dark:border-zinc-800">
    <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Status Distribution</CardTitle>
        <Badge variant="outline" className="text-[10px] font-bold dark:border-zinc-700">LIVE</Badge>
    </CardHeader>
    <CardContent className="h-[500px]"> {/* Height increased to fit all 23 statuses */}
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={Object.keys(STATUS_CONFIG).map(status => ({
                    statusKey: status,
                    name: status.replace(/_/g, ' '),
                    value: stats?.statusCounts.find((s: any) => s._id === status)?.count || 0,
                })).sort((a, b) => b.value - a.value)}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={10} 
                    width={110} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fill: 'currentColor'}} 
                    className="text-muted-foreground" 
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        fontSize: '12px',
                        borderRadius: '6px'
                    }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {/* Crucial fix: We sort the keys exactly like the data above 
                        so that the Cell color matches the Bar name.
                    */}
                    {Object.keys(STATUS_CONFIG)
                        .map(status => ({
                            statusKey: status,
                            value: stats?.statusCounts.find((s: any) => s._id === status)?.count || 0,
                        }))
                        .sort((a, b) => b.value - a.value)
                        .map((entry, idx) => (
                            <Cell 
                                key={`cell-${idx}`} 
                                fill={STATUS_CONFIG[entry.statusKey].color} 
                            />
                        ))
                    }
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </CardContent>
</Card>

                    {/* Pulse Feed */}
                   {/* Pulse Feed */}
<Card className="shadow-none bg-card/40 dark:bg-[#0a0a0a] border-border dark:border-zinc-800 overflow-hidden">
    <CardHeader className="border-b dark:border-zinc-800">
        <CardTitle className="text-sm font-bold uppercase text-foreground">Recent Pulse</CardTitle>
    </CardHeader>
    <CardContent className="p-0 h-[250px] md:h-[300px] overflow-y-auto no-scrollbar">
        <div className="divide-y dark:divide-zinc-800">
            {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((act: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-muted dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-foreground">
                        {act.firstName?.[0]}{act.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{act.firstName} {act.lastName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{act.statusHistory.toStatus.replace(/_/g, ' ')}</p>
                    </div>
                    {/* Updated Date and Time section */}
                    <div className="text-[10px] text-muted-foreground font-mono italic text-right leading-tight">
                        <div>{format(new Date(act.statusHistory.timestamp), 'MM/dd/yyyy')}</div>
                        <div>{format(new Date(act.statusHistory.timestamp), 'hh:mm a')}</div>
                    </div>
                </div>
            )) : (
                <div className="text-center text-xs text-muted-foreground p-8">No recent activity.</div>
            )}
        </div>
    </CardContent>
</Card>
                </div>

                {/* Pipeline and Efficiency Section */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                   <Card className="shadow-none bg-card/40 dark:bg-[#0a0a0a] border-border dark:border-zinc-800">
  <CardHeader>
    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Funnel Overview</CardTitle>
  </CardHeader>
  <CardContent className="h-[250px] md:h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={[
        { stage: 'Total', value: stats?.totalLeads || 0 },
        { stage: 'Active', value: categorizedStats.pipelines },
        { stage: 'Verified', value: stats?.statusCounts.find((s: any) => s._id === 'VERIFIED')?.count || 0 },
        { stage: 'Paid', value: stats?.statusCounts.find((s: any) => s._id === 'PAID')?.count || 0 },
      ]}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
        <XAxis dataKey="stage" fontSize={10} axisLine={false} tickLine={false} tick={{fill: 'currentColor'}} className="text-muted-foreground" />
        <YAxis hide />
        
        {/* ADDED cursor={false} TO THE TOOLTIP BELOW */}
        <Tooltip 
          cursor={false} 
          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} 
        />
        
        <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} barSize={30} className="text-primary dark:text-indigo-500">
          <Cell fillOpacity={0.9} />
          <Cell fillOpacity={0.7} />
          <Cell fillOpacity={0.5} />
          <Cell fillOpacity={0.3} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

                    <Card className="shadow-none bg-card/40 dark:bg-[#0a0a0a] border-border dark:border-zinc-800 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Success Ratio</CardTitle>
                        </CardHeader>
                        <div className="flex-1 flex items-center justify-center relative h-[220px] md:h-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: categorizedStats.pipelines },
                                            { name: 'Converted', value: categorizedStats.closures },
                                            { name: 'Risk', value: categorizedStats.issues },
                                        ]}
                                        innerRadius="70%" outerRadius="90%" paddingAngle={5} dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="currentColor" className="text-primary dark:text-indigo-500" />
                                        <Cell fill="currentColor" className="text-foreground/20" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute text-center">
                                <div className="text-3xl font-black italic text-foreground">
                                    {stats?.totalLeads > 0 ? `${((categorizedStats.closures / stats.totalLeads) * 100).toFixed(0)}%` : '0%'}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Efficiency</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Status List Carousel */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Inventory Status Matrix</h2>
                    <div className="relative">
                        <div
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto gap-4 py-4 no-scrollbar cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => {
                                if (!scrollContainerRef.current) return;
                                setIsDown(true);
                                setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
                                setScrollLeft(scrollContainerRef.current.scrollLeft);
                            }}
                            onMouseLeave={() => setIsDown(false)}
                            onMouseUp={() => setIsDown(false)}
                            onMouseMove={(e) => {
                                if (!isDown || !scrollContainerRef.current) return;
                                e.preventDefault();
                                const x = e.pageX - scrollContainerRef.current.offsetLeft;
                                const walk = (x - startX) * 2; // scroll-fast
                                scrollContainerRef.current.scrollLeft = scrollLeft - walk;
                            }}
                        >
                            {Object.keys(STATUS_CONFIG).map((status, index) => {
                                const config = STATUS_CONFIG[status];
                                const count = stats?.statusCounts?.find((s: any) => s._id === status)?.count || 0;
                                const percentage = stats?.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;

                                return (
                                    <div key={status} className="w-48 flex-shrink-0">
                                        <Card className="w-full border shadow-none bg-card dark:bg-[#0a0a0a] border-border dark:border-zinc-800 transition-colors">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[9px] font-bold uppercase text-muted-foreground">
                                                    {status.replace(/_/g, ' ')}
                                                </CardTitle>
                                                <div style={{ color: config.color }} className="opacity-50">
                                                    {React.isValidElement(config.icon) ? React.cloneElement(config.icon as any, { size: 12 }) : null}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="text-2xl font-bold italic text-foreground">{count}</div>
                                                <div className="h-1 w-full bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                        className="h-full"
                                                        style={{ backgroundColor: count > 0 ? config.color : 'transparent' }}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}