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
import { DateInput } from '@/components/ui/DateInput';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Search, History, ChevronRight, ChevronLeft,
  UserPlus, ExternalLink, Filter, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_CONFIG } from '@/app/dashboard/status-registry';

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function formatDob(value?: string | Date | null) {
  if (!value) return '—';
  try {
    const str = typeof value === 'string' ? value : value.toISOString();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const year = parseInt(str.substring(0, 4), 10);
      const month = parseInt(str.substring(5, 7), 10);
      const day = parseInt(str.substring(8, 10), 10);
      return format(new Date(year, month - 1, day), 'MM/dd/yyyy');
    }
    return format(new Date(value), 'MM/dd/yyyy');
  } catch {
    return '—';
  }
}

export default function ClientLeads() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [entryDate, setEntryDate] = useState(searchParams.get('entryDate') || '');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `/api/leads?page=${pagination.page}&limit=10&search=${searchInput}&t=${Date.now()}`;
      if (statusFilter && statusFilter !== 'All') {
        url += `&status=${statusFilter}`;
      }
      if (entryDate) {
        url += `&entryDate=${entryDate}`;
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
  }, [user, authChecked, authLoading, pagination.page, statusFilter, searchInput, entryDate]);

  const LEAD_STATUSES = [
    "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT", "PAID", "POSTED", "SIGNED", "VM", "TRANSFERRED", "SEND TO ANOTHER BUYER",
    "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
    "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
    "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED", "RETURNED", "REFRESH"
  ];

  const colSpan = 9;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 w-full">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Leads</h2>
            <p className="text-sm text-muted-foreground">
              Search and manage your claim pipeline.
            </p>
          </div>
          <Button
            onClick={() => router.push('/leads/create')}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Add lead
          </Button>
        </div>

        <Card className="shadow-none border-border/80 bg-card/90 overflow-hidden gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                Filters
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, lawsuit…"
                    className="pl-8 h-8 w-full md:w-[240px] bg-background text-sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-8 bg-background text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All statuses</SelectItem>
                    {LEAD_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 h-8">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Entry</span>
                  <DateInput
                    value={entryDate}
                    onChange={setEntryDate}
                    placeholder="MM/DD/YYYY"
                    calendarOnly
                    className="h-7 w-[130px] border-0 px-1 text-xs shadow-none focus-visible:ring-0"
                  />
                </div>

                {(searchInput || statusFilter || entryDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchInput(''); setStatusFilter(''); setEntryDate(''); }}
                    className="h-8 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/35 border-b">
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">First name</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last name</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Date of birth</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Lawsuit</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Created by</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="h-9 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-right w-[88px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="h-40 text-center">
                      <Loader2 className="animate-spin mx-auto h-6 w-6 text-primary/70" />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="h-28 text-center text-sm text-muted-foreground">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : leads.map((lead) => {
                  const statusConfig = STATUS_CONFIG[lead.status];
                  const color = statusConfig?.color || '#64748b';
                  return (
                    <TableRow
                      key={lead._id}
                      className="hover:bg-muted/25 cursor-pointer border-border/60"
                      onClick={() => router.push(`/leads/${lead._id}`)}
                    >
                      <TableCell className="px-3 py-2 text-[13px] font-medium text-foreground whitespace-nowrap">
                        {lead.firstName || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] font-medium text-foreground whitespace-nowrap">
                        {lead.lastName || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] text-foreground/80 tabular-nums whitespace-nowrap">
                        {lead.phone || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDob(lead.dateOfBirth)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] text-foreground/80 max-w-[220px]">
                        <span className="block truncate" title={lead.email || undefined}>
                          {lead.email || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] text-foreground/80 max-w-[180px]">
                        {(() => {
                          const lawsuit = (lead.lawsuit || lead.applicationType || '').trim();
                          return (
                            <span className="block truncate" title={lawsuit || undefined}>
                              {lawsuit || '—'}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[13px] text-muted-foreground whitespace-nowrap">
                        {lead.createdBy?.name || 'System'}
                      </TableCell>
                      <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="outline"
                          className="font-medium rounded px-1.5 py-0 text-[10px] capitalize border"
                          style={{
                            color,
                            borderColor: hexToRgba(color, 0.35),
                            backgroundColor: hexToRgba(color, 0.08),
                          }}
                        >
                          {lead.status?.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            title="History"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            onClick={() => setHistoryDialog({ open: true, lead })}
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="View details"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            onClick={() => router.push(`/leads/${lead._id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between bg-muted/15 border-t gap-2">
            <div className="text-xs text-muted-foreground">
              {pagination.total === 0
                ? '0 leads'
                : `${((pagination.page - 1) * 10) + 1}–${Math.min(pagination.page * 10, pagination.total)} of ${pagination.total}`}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
              </Button>
              <div className="text-[11px] font-medium px-2 py-0.5 bg-background border rounded text-muted-foreground tabular-nums">
                {pagination.page}/{pagination.pages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={historyDialog.open} onOpenChange={(open) => !open && setHistoryDialog({ open: false, lead: null })}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-5 bg-primary text-primary-foreground">
            <DialogTitle className="text-base flex items-center gap-2 font-semibold">
              <History className="h-4 w-4 opacity-80" />
              Activity history
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70">
              {historyDialog.lead?.firstName} {historyDialog.lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] p-5">
            <div className="space-y-5 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {historyDialog.lead?.statusHistory?.length > 0 ? (
                historyDialog.lead.statusHistory.map((log: any, i: number) => (
                  <div key={i} className="relative pl-7">
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/15" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="text-[10px] font-medium capitalize">
                          {String(log.toStatus || '').replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                          <div>{format(new Date(log.timestamp), 'MM/dd/yyyy')}</div>
                          <div>{format(new Date(log.timestamp), 'h:mm a')}</div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-md border whitespace-pre-wrap break-words">
                        {log.notes || "No notes."}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        By {log.changedBy?.name || "System"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No history for this lead.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 bg-muted/30 border-t flex justify-end">
            <Button onClick={() => setHistoryDialog({ open: false, lead: null })} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
