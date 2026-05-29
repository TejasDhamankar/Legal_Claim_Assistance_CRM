'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, History, Clock, Edit, Mail, Phone, Calendar, 
  MapPin, FileText, BookOpen, User, CheckCircle, Activity, 
  ChevronRight, Layers, ShieldCheck, Zap, 
  XCircle, UserCircle2, Info, Briefcase
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { LeadStatus } from '@/types';
import { motion } from 'framer-motion';

// Helper to capitalize only the first letter
const formatSentenceCase = (str: string) => {
  if (!str) return '—';
  const lowercase = str.toLowerCase();
  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1).replace(/_/g, ' ');
};

// Lead Status Configuration
const STATUS_CONFIG: Record<string, { color: string, icon: React.ReactNode }> = {
  PENDING: { color: '#f59e0b', icon: <Clock className="h-4 w-4" /> },
  REJECTED: { color: '#ef4444', icon: <XCircle className="h-4 w-4" /> },
  VERIFIED: { color: '#10b981', icon: <CheckCircle className="h-4 w-4" /> },
  PAID: { color: '#3b82f6', icon: <Zap className="h-4 w-4" /> },
  WORKING: { color: '#6366f1', icon: <Activity className="h-4 w-4" /> },
};

const LEAD_STATUSES = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT","POSTED", "PAID","SIGNED","VM","TRANSFERRED","SEND TO ANOTHER BUYER",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED", "BILLABLE","CAMPAIGN_PAUSED", "SENT_TO_LAW_FIRM", "RETURNED"
];

const statusUpdateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusUpdateSchema>;

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
    } catch (error) {
      toast({ title: "Error", description: "Record not found.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onUpdateStatus: SubmitHandler<StatusFormValues> = async (values) => {
    try {
      const { data } = await axios.put(`/api/leads/${id}`, { status: values.status, statusNote: values.notes });
      setLead(data.lead);
      toast({ title: "Success", description: "Status updated." });
      setStatusDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Update failed.", variant: "destructive" });
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );

  const currentStatus = STATUS_CONFIG[lead.status] || { color: '#737373', icon: <FileText /> };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
        
        {/* TOP NAVIGATION & ACTION BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {lead.firstName} {lead.lastName}
                <Badge variant="secondary" className="text-[10px] font-mono">ID: {lead._id.slice(-6).toUpperCase()}</Badge>
              </h1>
              <p className="text-xs text-muted-foreground font-medium capitalize tracking-tight">Lead detail profile</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 border rounded-lg flex items-center gap-2 bg-muted/30">
              <span style={{ color: currentStatus.color }}>{currentStatus.icon}</span>
              <span className="text-[11px] font-bold capitalize">{lead.status.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
            {user?.role === 'super_admin' && (
              <Button onClick={() => setStatusDialogOpen(true)} size="sm" className="font-bold">
                <Edit className="mr-2 h-4 w-4" /> Update
              </Button>
            )}
          </div>
        </div>

        {/* MAIN MODULES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="overview" className="px-6 py-2 text-xs font-bold capitalize">Overview</TabsTrigger>
                <TabsTrigger value="fields" className="px-6 py-2 text-xs font-bold capitalize">Raw data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-6">
                
                {/* INFO CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="shadow-none border border-slate-200">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" /> Contact Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Email</label>
                        <p className="text-sm font-medium truncate">{lead.email || '—'}</p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Phone</label>
                        <p className="text-sm font-medium">{lead.phone || '—'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border border-slate-200">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Application info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Type</label>
                        <p className="text-sm font-medium capitalize">{lead.applicationType?.toLowerCase() || '—'}</p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Lawsuit</label>
                        <p className="text-sm font-medium capitalize">{lead.lawsuit?.toLowerCase() || '—'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border border-slate-200">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <UserCircle2 className="h-3 w-3" /> Identity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Address</label>
                        <p className="text-sm font-medium truncate capitalize">{lead.address?.toLowerCase() || '—'}</p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground/60 block mb-0.5">Date of Birth</label>
                        <p className="text-sm font-medium">
                          {lead.dateOfBirth ? format(new Date(lead.dateOfBirth), 'MM/dd/yyyy') : '—'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* INTERNAL DOCUMENTATION */}
                <Card className="shadow-none border border-slate-200">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Internal Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="p-4 rounded-lg bg-muted/30 border text-sm text-muted-foreground leading-relaxed italic">
                      {lead.notes || 'No protocol notes available for this record.'}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="mt-4">
                <Card className="shadow-none border border-slate-200 p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {lead.fields?.length > 0 ? lead.fields.map((f: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg bg-muted/10">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{f.key}</p>
                        {!/^\d+$/.test(f.value) && !isNaN(new Date(f.value).getTime()) ? (
                          <div>
                            <p className="text-xs font-semibold">{format(new Date(f.value), 'MM/dd/yyyy')}</p> 
                          </div>
                        ) : (
                          <p className="text-xs font-semibold capitalize">{f.value?.toString().toLowerCase()}</p>
                        )}
                      </div>
                    ) ) : (
                      <p className="col-span-full text-center py-12 text-muted-foreground text-xs capitalize font-bold">No metadata found</p>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* SIDEBAR TIMELINE */}
          <div className="lg:col-span-4">
            <Card className="shadow-none border border-slate-200 h-[650px] flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-xs uppercase font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Activity History
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-6 relative">
                  <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-border" />
                  <div className="space-y-8">
                    {lead.statusHistory?.slice().reverse().map((log: any, i: number) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background z-10" />
                        <div className="space-y-2">
                          <div className="flex justify-between items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 capitalize">
                              {log.toStatus.toLowerCase().replace(/_/g, ' ')}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground font-medium text-right">
                              <div>{format(new Date(log.timestamp), 'MM/dd/yyyy')}</div>
                              <div>{format(new Date(log.timestamp), 'hh:mm a')}</div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium italic">{log.notes || "System update."}</p>
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Agent: {log.changedBy?.name || "System"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* UPDATE STATUS DIALOG */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Update Lead Status</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateStatus)} className="space-y-6 pt-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Select Pipeline Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg h-11">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs font-bold capitalize">
                            {s.toLowerCase().replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Log Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="rounded-lg min-h-[100px] text-sm" placeholder="Reason for status change..." />
                  </FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-11 font-bold rounded-lg shadow-md">Confirm Update</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
