'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  MoreHorizontal,
  RefreshCw,
  FileEdit,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Trash2,
  UserCircle,
  Briefcase 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const LEAD_STATUSES = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT","POSTED", "PAID", "SIGNED","VM","TRANSFERRED","SEND TO ANOTHER BUYER",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING", 
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", 
  "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED", 
  "BILLABLE", "CAMPAIGN_PAUSED", "SENT_TO_LAW_FIRM"
];

const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
  buyerCode: z.string().optional(),
});

type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  applicationType: string; 
  createdAt: string;
  createdBy: { name: string; email: string; }; 
  buyerCode?: string;
}

interface UserOption {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [createdByFilter, setCreatedByFilter] = useState<string>('ALL');
  const [buyerCodeFilter, setBuyerCodeFilter] = useState<string>('ALL');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [buyerCodes, setBuyerCodes] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const { user, loading: authLoading, authChecked } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const updateForm = useForm<UpdateLeadFormValues>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: { status: 'PENDING', notes: '', buyerCode: '' },
  });

  useEffect(() => {
    if (authLoading || !authChecked || !isAdmin) return;
    if (user?.role === 'admin' && user.id && createdByFilter !== user.id) {
      setCreatedByFilter(user.id);
    }
  }, [authLoading, authChecked, isAdmin, user, createdByFilter]);

  useEffect(() => {
    if (authLoading || !authChecked || !isAdmin) return;
    fetchLeads();
  }, [statusFilter, createdByFilter, buyerCodeFilter, authLoading, authChecked, isAdmin]);

  useEffect(() => {
    if (authLoading || !authChecked || !isAdmin || !isSuperAdmin) return;
    fetchUsers();
    fetchBuyerCodes();
  }, [authLoading, authChecked, isAdmin, isSuperAdmin]);

  useEffect(() => {
    if (!authLoading && authChecked && user && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, authChecked, user, isAdmin, router]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
      if (createdByFilter && createdByFilter !== 'ALL') params.set('createdBy', createdByFilter);
      if (buyerCodeFilter && buyerCodeFilter !== 'ALL') params.set('buyerCode', buyerCodeFilter);
      const endpoint = params.toString()
        ? `/api/admin/leads?${params.toString()}`
        : '/api/admin/leads';
      const { data } = await axios.get(endpoint);
      setLeads(data.leads);
      
      setStats({
        total: data.leads.length,
        pending: data.leads.filter((l: Lead) => l.status === 'PENDING').length,
        verified: data.leads.filter((l: Lead) => l.status === 'VERIFIED' || l.status === 'ID_VERIFIED').length,
        rejected: data.leads.filter((l: Lead) => l.status === 'REJECTED' || l.status === 'REJECTED_BY_CLIENT').length,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load leads", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    }
  };

  const fetchBuyerCodes = async () => {
    try {
      const { data } = await axios.get('/api/admin/leads/buyer-codes');
      setBuyerCodes(data.buyerCodes || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load buyer codes", variant: "destructive" });
    }
  };

  const onUpdateLead = async (values: UpdateLeadFormValues) => {
    if (!selectedLead) return;
    setSubmitting(true);
    try {
      await axios.put(`/api/admin/leads/${selectedLead._id}`, values);
      toast({ title: "Success", description: "Lead status updated" });
      fetchLeads();
      setUpdateDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Update failed", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const onDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await axios.delete(`/api/admin/leads/${leadId}`);
      toast({ title: "Success", description: "Lead deleted successfully" });
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const handleUpdateLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    updateForm.setValue('status', lead.status as any);
    updateForm.setValue('notes', '');
    updateForm.setValue('buyerCode', lead.buyerCode || '');
    setUpdateDialogOpen(true);
  };

  const filteredLeads = leads.filter((lead) =>
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VERIFIED': case 'ID_VERIFIED': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'REJECTED': case 'REJECTED_BY_CLIENT': 
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'PENDING': 
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      default: 
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  if (authLoading || (authChecked && user && !isAdmin)) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto px-6 py-8 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Lead Management</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Full pipeline visibility and control</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 px-4 py-1.5 rounded-full flex gap-2 items-center">
            <ShieldCheck className="h-4 w-4" /> Pipeline Protected
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Leads', val: stats.total, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Pending', val: stats.pending, icon: BarChart3, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Verified', val: stats.verified, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Rejected', val: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white dark:bg-[#0a0a0a] dark:border dark:border-zinc-800 overflow-hidden transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stat.val}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Records Card */}
        <Card className="border-none shadow-md bg-white dark:bg-[#0a0a0a] dark:border dark:border-zinc-800 overflow-hidden transition-colors">
          <CardHeader className="px-6 py-5 bg-white dark:bg-[#0a0a0a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-800 dark:text-white">
                <span className="p-2 bg-indigo-50 dark:bg-zinc-900 rounded-lg border border-indigo-100 dark:border-zinc-800">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-zinc-400" />
                </span>
                Lead Records
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <Input 
                    placeholder="Search name or email..." 
                    className="pl-10 w-full md:w-[300px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {isSuperAdmin && (
                  <>
                    <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Created By" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                        <SelectItem value="ALL">All Agents</SelectItem>
                        {users.map((u) => {
                          const id = u._id || u.id || '';
                          if (!id) return null;
                          return <SelectItem key={id} value={id}>{u.name}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                    <Select value={buyerCodeFilter} onValueChange={setBuyerCodeFilter}>
                      <SelectTrigger className="w-[170px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Buyer Code" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                        <SelectItem value="ALL">All Buyer Codes</SelectItem>
                        {buyerCodes.map((code) => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111111] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                    <SelectItem value="All">All Statuses</SelectItem>
                    {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <Separator className="opacity-50 dark:bg-zinc-800 dark:opacity-100" />
          <CardContent className="p-0 overflow-x-auto bg-white dark:bg-[#0a0a0a]">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-[#111111]/50">
                <TableRow className="border-slate-100 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400 px-6">Name & ID</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Contact Details</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Case Type</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Created By</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Buyer Code</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-zinc-400">Entry Date</TableHead>
                  <TableHead className="text-right px-6 text-slate-600 dark:text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-64 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600 dark:text-white" /></TableCell></TableRow>
                ) : filteredLeads.map((lead) => (
                  <TableRow key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors border-slate-100 dark:border-zinc-800">
                    <TableCell className="px-6">
                      <div className="font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">{lead.firstName} {lead.lastName}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-600 font-bold">#{lead._id.slice(-6)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 dark:text-zinc-300">{lead.email}</div>
                      <div className="text-xs text-slate-400 dark:text-zinc-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                        {lead.applicationType || "General"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-slate-400 dark:text-zinc-600" />
                        <div className="text-sm font-medium text-slate-700 dark:text-zinc-300">{lead.createdBy?.name || "System"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-medium rounded-md px-2 py-0.5 border ${getStatusStyle(lead.status)}`}>
                        {lead.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400 border border-transparent dark:border-zinc-800">
                        {lead.buyerCode || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-zinc-500 whitespace-nowrap">
                      {lead.createdAt ? format(new Date(lead.createdAt), 'MM/dd/yyyy') : '-'}
                      <div className="text-[10px] text-slate-400 dark:text-zinc-700">{lead.createdAt ? format(new Date(lead.createdAt), 'hh:mm a') : ''}</div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><MoreHorizontal className="h-5 w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 dark:bg-[#111111] dark:border-zinc-800 dark:text-white">
                          {user?.role === 'super_admin' && (
                            <DropdownMenuItem onClick={() => handleUpdateLeadClick(lead)} className="cursor-pointer dark:focus:bg-zinc-800">
                              <FileEdit className="mr-2 h-4 w-4" /> Update Status
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => router.push(`/admin/leads/${lead._id}`)} className="cursor-pointer dark:focus:bg-zinc-800">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {user?.role === 'super_admin' && <DropdownMenuSeparator className="dark:bg-zinc-800" />}
                          {user?.role === 'super_admin' && (
                            <DropdownMenuItem 
                              onClick={() => onDeleteLead(lead._id)} 
                              className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 dark:focus:text-rose-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="px-6 py-4 flex justify-between bg-slate-50/30 dark:bg-[#0a0a0a] rounded-b-xl border-t border-slate-100 dark:border-zinc-800 transition-colors">
            <span className="text-sm text-slate-500 dark:text-zinc-500 font-medium">{filteredLeads.length} leads in view</span>
            <Button variant="outline" size="sm" onClick={fetchLeads} className="border-slate-200 bg-white text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 shadow-sm">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Force Refresh
            </Button>
          </CardFooter>
        </Card>

        {/* Update Status Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[425px] dark:bg-[#0a0a0a] dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-xl dark:text-white">Update Lead Status</DialogTitle>
              <DialogDescription className="dark:text-zinc-500">Apply status and buyer code changes to the selected lead.</DialogDescription>
            </DialogHeader>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateLead)} className="space-y-5">
                <FormField control={updateForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-zinc-300 font-semibold">Classification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-200 dark:bg-[#111111] dark:border-zinc-800 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 dark:bg-[#111111] dark:border-zinc-800 dark:text-white">
                        {LEAD_STATUSES.map(s => <SelectItem key={s} value={s} className="dark:focus:bg-zinc-800">{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={updateForm.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-zinc-300 font-semibold">Change Reason / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Why is this status being changed?" 
                        className="resize-none border-slate-200 dark:bg-[#111111] dark:border-zinc-800 dark:text-white placeholder:text-zinc-600" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={updateForm.control} name="buyerCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-zinc-300 font-semibold">Buyer Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Assign buyer code..." 
                        className="border-slate-200 dark:bg-[#111111] dark:border-zinc-800 dark:text-white placeholder:text-zinc-600" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all font-semibold">
                    {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileEdit className="h-4 w-4 mr-2" />}
                    Confirm Status Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
