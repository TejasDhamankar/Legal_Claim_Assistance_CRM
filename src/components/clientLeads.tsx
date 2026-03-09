'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Search, History, ChevronRight, ChevronLeft, 
  Mail, PhoneCall, UserPlus, ExternalLink, ShieldCheck, 
  Filter, X, UserCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_CONFIG } from '@/app/dashboard/status-registry';

export default function ClientLeads() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `/api/leads?page=${pagination.page}&limit=10&search=${searchInput}&t=${Date.now()}`;
      if (statusFilter && statusFilter !== 'All') {
        url += `&status=${statusFilter}`;
      }
      const { data } = await axios.get(url);
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && !authLoading && user) fetchLeads();
  }, [user, authChecked, authLoading, pagination.page, statusFilter, searchInput]);

  const LEAD_STATUSES = [
    "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT", "PAID","POSTED", "SIGNED", "VM", "TRANSFERRED", "SEND TO ANOTHER BUYER",
    "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
    "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
    "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED"
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 max-w-7xl mx-auto px-6 py-8 transition-colors duration-200">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Database</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage, filter, and track your lead conversions</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 px-4 py-1.5 rounded-full flex gap-2 items-center">
              <ShieldCheck className="h-4 w-4" /> Database Encrypted
            </Badge>
            <Button 
              onClick={() => router.push('/leads/create')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-md transition-all gap-2"
            >
              <UserPlus className="h-4 w-4" /> Add New Lead
            </Button>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-md dark:shadow-2xl bg-white dark:bg-[#0a0a0a] overflow-hidden transition-colors">
          <CardHeader className="px-6 py-5 bg-white dark:bg-[#0a0a0a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                <span className="p-2 bg-indigo-50 dark:bg-zinc-900 rounded-lg border border-indigo-100 dark:border-zinc-800">
                  <Filter className="h-5 w-5 text-primary" />
                </span>
                Record Filters
              </CardTitle>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search name, email, ID..." 
                    className="pl-10 w-full md:w-[280px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-white/20 placeholder:text-slate-400 dark:placeholder:text-zinc-600" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-500">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                    <SelectItem value="All">All Statuses</SelectItem>
                    {LEAD_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchInput || statusFilter) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { setSearchInput(''); setStatusFilter(''); }}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <Separator className="opacity-50 dark:bg-zinc-800 dark:opacity-100" />
          
          <CardContent className="p-0 bg-white dark:bg-[#0a0a0a]">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-[#111111]/50">
                <TableRow className="border-slate-100 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400 px-6 py-4">Client Identity</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Communication</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Case Type</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Buyer Code</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Created By</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Entry Date</TableHead>
                  <TableHead className="text-right px-6 text-slate-600 dark:text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
                      <p className="text-sm text-slate-500 mt-2">Fetching records...</p>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : leads.map((lead) => (
                  <TableRow key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors border-slate-100 dark:border-zinc-800">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-zinc-900 dark:text-zinc-300 flex items-center justify-center text-xs font-bold border border-indigo-100 dark:border-zinc-800">
                          {lead.firstName?.[0]}{lead.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-zinc-100">{lead.firstName} {lead.lastName}</div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-600 font-bold">#{lead._id.slice(-6)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" /> {lead.email}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <PhoneCall className="h-3 w-3 text-muted-foreground" /> {lead.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 dark:text-zinc-400">{lead.applicationType || "N/A"}</TableCell>
                    <TableCell>
                      {(() => {
                        const statusConfig = STATUS_CONFIG[lead.status];
                        const color = statusConfig?.color || '#64748b'; // Fallback to slate-500/gray
                        return (
                          <Badge 
                            variant="outline" 
                            className="font-medium rounded-md px-2.5 py-0.5 border"
                            style={{
                              color: color,
                              borderColor: `${color}40`, // 25% opacity for border
                              backgroundColor: `${color}10`, // ~6% opacity for background
                            }}
                          >
                            {lead.status.replace(/_/g, ' ')}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 dark:text-zinc-400">{lead.buyerCode || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                          {lead.createdByDisplay || lead.createdBy?.name || "System"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-zinc-500">
                      {format(new Date(lead.createdAt), 'MM/dd/yyyy')}
                      <div className="text-xs text-slate-400 dark:text-zinc-800">
                        {format(new Date(lead.createdAt), 'hh:mm a')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <button title="History" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={() => setHistoryDialog({ open: true, lead })}>
                          <History className="h-4 w-4" />
                        </button>
                        <button title="View Details" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => router.push(`/leads/${lead._id}`)}>
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          
          <CardFooter className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-zinc-800 gap-4">
            <div className="text-sm text-slate-500 dark:text-zinc-500 font-medium">
              Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} leads
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white disabled:opacity-20 transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <div className="text-xs font-bold px-3 py-1 bg-white dark:bg-[#111111] border border-slate-200 dark:border-zinc-800 rounded text-slate-600 dark:text-zinc-400">
                {pagination.page} / {pagination.pages || 1}
              </div>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white disabled:opacity-20 transition-colors">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => !open && setHistoryDialog({ open: false, lead: null })}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#0a0a0a] dark:border dark:border-zinc-800">
          <DialogHeader className="p-6 bg-slate-900 text-white dark:bg-[#111111]">
            <DialogTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Activity History
            </DialogTitle>
            <DialogDescription className="text-slate-400 dark:text-zinc-500">
              Tracking timeline for {historyDialog.lead?.firstName} {historyDialog.lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] p-6 bg-white dark:bg-[#0a0a0a]">
            <div className="space-y-6 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-slate-200 dark:bg-zinc-800" />
              {historyDialog.lead?.statusHistory?.length > 0 ? (
                historyDialog.lead.statusHistory.map((log: any, i: number) => (
                  <div key={i} className="relative pl-7 group">
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-indigo-600 dark:bg-zinc-600 ring-2 ring-indigo-50 dark:ring-zinc-900" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-400 border-none">
                          {log.toStatus}
                        </Badge>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium text-right">
                          <div>{format(new Date(log.timestamp), 'MM/dd/yyyy')}</div>
                          <div>{format(new Date(log.timestamp), 'hh:mm a')}</div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed bg-slate-50 dark:bg-[#111111] p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                        {log.notes || "No additional notes provided."}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1 pl-1 italic">
                        Authorized by: {log.changedBy?.name || "System"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-zinc-600 text-sm italic">
                  No history records found for this lead.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 bg-slate-50 dark:bg-[#111111] border-t border-slate-200 dark:border-zinc-800 flex justify-end">
            <Button onClick={() => setHistoryDialog({ open: false, lead: null })} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800" variant="outline">
              Close History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
