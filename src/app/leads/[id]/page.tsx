'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2, ArrowLeft, History, Edit, Mail, Phone, Calendar,
  MapPin, FileText, User, Briefcase, ClipboardList, Hash,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { STATUS_CONFIG } from '@/app/dashboard/status-registry';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';
import { cn } from '@/lib/utils';

const LEAD_STATUSES = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT", "POSTED", "PAID", "SIGNED", "VM", "TRANSFERRED", "SEND TO ANOTHER BUYER",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED", "BILLABLE", "CAMPAIGN_PAUSED", "SENT_TO_LAW_FIRM", "RETURNED", "REFRESH"
];

const statusUpdateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusUpdateSchema>;

function formatStatus(status?: string) {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDisplayDate(value?: string | Date | null) {
  if (!value) return '—';
  try {
    const str = typeof value === 'string' ? value : value.toISOString();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const year = parseInt(str.substring(0, 4), 10);
      const month = parseInt(str.substring(5, 7), 10);
      const day = parseInt(str.substring(8, 10), 10);
      return format(new Date(year, month - 1, day), 'MMMM d, yyyy');
    }
    return format(new Date(value), 'MMMM d, yyyy');
  } catch {
    return String(value);
  }
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return {
      date: format(d, 'MMM d, yyyy'),
      time: format(d, 'h:mm a'),
    };
  } catch {
    return { date: String(value), time: '' };
  }
}

function isProbablyDate(value: string) {
  if (!value || /^\d+$/.test(value)) return false;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) && !/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) return false;
  const t = Date.parse(value);
  return !Number.isNaN(t);
}

function formatFieldValue(value: unknown, type?: string) {
  if (value === null || value === undefined || value === '') return '—';
  const str = String(value);
  if (type === 'date' || isProbablyDate(str)) return formatDisplayDate(str);
  return str;
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function DetailRow({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-1.5 sm:gap-6 py-3.5 border-b border-border/70 last:border-b-0">
      <dt className="flex items-start gap-2 text-sm text-muted-foreground pt-0.5">
        {Icon ? <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-70" /> : null}
        <span>{label}</span>
      </dt>
      <dd className="text-sm text-foreground font-medium break-words whitespace-pre-wrap min-w-0">
        {href && content !== '—' ? (
          <a href={href} className="text-primary hover:underline underline-offset-2 break-all">
            {content}
          </a>
        ) : (
          content
        )}
      </dd>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none border-border/80 bg-card/90 gap-0 py-0 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border/70 bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-5 py-1">
        {children}
      </CardContent>
    </Card>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: '', notes: '' },
  });

  useEffect(() => { fetchLead(); }, [id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leads/${id}`);
      setLead(data.lead);
      form.setValue('status', data.lead.status);
    } catch {
      toast({ title: "Error", description: "Record not found.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateStatus: SubmitHandler<StatusFormValues> = async (values) => {
    try {
      const { data } = await axios.put(`/api/leads/${id}`, {
        status: values.status,
        statusNote: values.notes,
      });
      setLead(data.lead);
      toast({ title: "Success", description: "Status updated." });
      setStatusDialogOpen(false);
      form.setValue('notes', '');
    } catch {
      toast({ title: "Error", description: "Update failed.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] w-full items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary/70" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Lead not found.</p>
          <Button variant="outline" onClick={() => router.push('/leads')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusMeta = STATUS_CONFIG[lead.status];
  const statusColor = statusMeta?.color || '#64748b';
  const created = formatDateTime(lead.createdAt);
  const updated = formatDateTime(lead.updatedAt);
  const appFieldDefs = DYNAMIC_FIELDS[lead.applicationType] || [];

  const customFields = (lead.fields || []).map((f: { key: string; value: string }) => {
    const def = appFieldDefs.find((d) => d.key === f.key);
    return {
      key: f.key,
      label: def?.label || f.key,
      value: formatFieldValue(f.value, def?.type),
    };
  });

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/leads')}
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground break-words">
                {lead.firstName} {lead.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-medium capitalize"
                  style={{
                    color: statusColor,
                    borderColor: hexToRgba(statusColor, 0.35),
                    backgroundColor: hexToRgba(statusColor, 0.08),
                  }}
                >
                  {formatStatus(lead.status)}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Hash className="h-3 w-3" />
                  {lead._id}
                </span>
              </div>
              {statusMeta?.description && (
                <p className="text-sm text-muted-foreground max-w-xl">
                  {statusMeta.description}
                </p>
              )}
            </div>
          </div>

          {user?.role === 'super_admin' && (
            <Button onClick={() => setStatusDialogOpen(true)} className="shrink-0 gap-2">
              <Edit className="h-4 w-4" />
              Update status
            </Button>
          )}
        </div>

        {/* Meta strip */}
        <Card className="shadow-none border-border/80 bg-card/90 py-0 gap-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{created.date}</p>
                <p className="text-xs text-muted-foreground">{created.time}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">Last updated</p>
                <p className="text-sm font-medium">{updated.date}</p>
                <p className="text-xs text-muted-foreground">{updated.time}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">Created by</p>
                <p className="text-sm font-medium break-words">{lead.createdBy?.name || 'System'}</p>
                {lead.createdBy?.email && (
                  <p className="text-xs text-muted-foreground break-all">{lead.createdBy.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-6">
            <SectionCard
              title="Contact"
              description="How to reach this person"
              icon={Phone}
            >
              <dl>
                <DetailRow label="Full name" value={`${lead.firstName || ''} ${lead.lastName || ''}`.trim()} icon={User} />
                <DetailRow label="Email" value={lead.email} icon={Mail} href={lead.email ? `mailto:${lead.email}` : undefined} />
                <DetailRow label="Phone" value={lead.phone} icon={Phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
              </dl>
            </SectionCard>

            <SectionCard
              title="Identity & location"
              description="Identity details on file"
              icon={MapPin}
            >
              <dl>
                <DetailRow label="Date of birth" value={formatDisplayDate(lead.dateOfBirth)} icon={Calendar} />
                <DetailRow label="Address" value={lead.address} icon={MapPin} />
              </dl>
            </SectionCard>

            <SectionCard
              title="Case information"
              description="Lawsuit and application context"
              icon={Briefcase}
            >
              <dl>
                <DetailRow label="Application type" value={lead.applicationType} icon={ClipboardList} />
                <DetailRow label="Lawsuit" value={lead.lawsuit || lead.applicationType} icon={Briefcase} />
                <DetailRow label="Buyer code" value={lead.buyerCode} icon={Hash} />
              </dl>
            </SectionCard>

            <SectionCard
              title="Notes"
              description="Internal documentation for this lead"
              icon={FileText}
            >
              <div className="py-4">
                <p className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap break-words",
                  lead.notes ? "text-foreground" : "text-muted-foreground italic"
                )}>
                  {lead.notes || 'No notes have been added for this lead yet.'}
                </p>
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-5 space-y-6">
            <SectionCard
              title="Activity history"
              description="Status changes over time"
              icon={History}
            >
              <div className="py-4">
                {lead.statusHistory?.length > 0 ? (
                  <div className="relative space-y-0">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-5">
                      {[...lead.statusHistory].reverse().map((log: any, i: number) => {
                        const when = formatDateTime(log.timestamp);
                        const color = STATUS_CONFIG[log.toStatus]?.color || '#64748b';
                        return (
                          <div key={log._id || i} className="relative pl-7">
                            <div
                              className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background"
                              style={{
                                backgroundColor: color,
                                boxShadow: `0 0 0 3px ${hexToRgba(color, 0.18)}`,
                              }}
                            />
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                  style={{
                                    color,
                                    borderColor: hexToRgba(color, 0.35),
                                    backgroundColor: hexToRgba(color, 0.08),
                                  }}
                                >
                                  {formatStatus(log.toStatus)}
                                </Badge>
                                <div className="text-xs text-muted-foreground text-right tabular-nums">
                                  <div>{when.date}</div>
                                  <div>{when.time}</div>
                                </div>
                              </div>
                              {log.fromStatus && (
                                <p className="text-xs text-muted-foreground">
                                  From <span className="font-medium text-foreground/80">{formatStatus(log.fromStatus)}</span>
                                </p>
                              )}
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                                {log.notes || 'No note recorded for this change.'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                By {log.changedBy?.name || 'System'}
                                {log.changedBy?.email ? ` · ${log.changedBy.email}` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No status changes recorded yet.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Custom / dynamic fields — full table, no clipping */}
        <Card className="shadow-none border-border/80 bg-card/90 gap-0 py-0 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border/70 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Application answers
            </CardTitle>
            <CardDescription className="text-xs">
              All questionnaire and custom field responses for this lead
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {customFields.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="w-[40%] min-w-[180px] px-5 font-medium text-muted-foreground">
                      Question / field
                    </TableHead>
                    <TableHead className="px-5 font-medium text-muted-foreground">
                      Response
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.map((field: { key: string; label: string; value: string }, i: number) => (
                    <TableRow key={`${field.key}-${i}`} className="align-top">
                      <TableCell className="px-5 py-3.5 text-sm text-muted-foreground whitespace-normal break-words">
                        {field.label}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                        {field.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No application answers are on file for this lead.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update lead status</DialogTitle>
            <DialogDescription>
              Change the pipeline stage for {lead.firstName} {lead.lastName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateStatus)} className="space-y-4 pt-1">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {formatStatus(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[100px]"
                        placeholder="Reason for this status change…"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save update</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
