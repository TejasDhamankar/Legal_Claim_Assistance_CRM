'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  AlertCircle,
  FileEdit,
  ChevronLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ClipboardList,
  MessageSquare,
  History,
  User,
  Tag,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

// Define Lead status options from your model
const LEAD_STATUSES = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT","POSTED", "PAID","SIGNED","VM","TRANSFERRED","SEND_TO_ANOTHER_BUYER",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CHARGEBACK", "WAITING_ID", "SENT_TO_CLIENT", "QC", "ID_VERIFIED", "RETURNED", "REFRESH"
];

// Define the schema for updating lead status
const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
  buyerCode: z.string().optional(),
});

type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;

// Define Lead type
interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  applicationType: string;
  lawsuit: string;
  notes: string;
  status: string;
  buyerCode?: string;
  fields: { key: string; value: string }[];
  statusHistory: {
    _id: string;
    fromStatus: string;
    toStatus: string;
    notes: string;
    timestamp: string;
    changedBy: {
      _id: string;
      name: string;
      email: string;
    };
  }[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, authChecked } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buyerCodes, setBuyerCodes] = useState<string[]>([]);

  const updateForm = useForm<UpdateLeadFormValues>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: {
      status: 'PENDING',
      notes: '',
      buyerCode: '',
    },
  });

  useEffect(() => {
    if (authLoading || !authChecked || !isAdmin) return;
    if (params.id) {
      fetchLeadDetails(params.id as string);
    }
  }, [params.id, authLoading, authChecked, isAdmin]);

  useEffect(() => {
    if (authLoading || !authChecked || !isAdmin) return;
    axios.get('/api/admin/buyer-codes')
      .then((res) => setBuyerCodes(res.data?.buyerCodes || []))
      .catch(() => {});
  }, [authLoading, authChecked, isAdmin]);

  useEffect(() => {
    if (!authLoading && authChecked && user && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, authChecked, user, isAdmin, router]);

  const fetchLeadDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/leads/${id}`);
      setLead(data.lead);
      updateForm.setValue('status', data.lead.status);
      updateForm.setValue('buyerCode', data.lead.buyerCode || '');
    } catch (error: any) {
      console.error('Error fetching lead details:', error);
      setError(error.response?.data?.message || 'Failed to load lead details');
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: UpdateLeadFormValues) => {
    if (!lead) return;

    setSubmitting(true);
    try {
      if (isSuperAdmin) {
        const payload = {
          ...values,
          buyerCode: values.buyerCode?.trim()
            ? values.buyerCode.trim().toUpperCase()
            : values.buyerCode,
        };
        await axios.put(`/api/admin/leads/${lead._id}`, payload);
        toast({
          title: "Success",
          description: "Lead status updated successfully",
        });
      } else {
        const code = (values.buyerCode || '').trim().toUpperCase();
        if (!code) {
          toast({ title: 'Error', description: 'Buyer code is required', variant: 'destructive' });
          setSubmitting(false);
          return;
        }
        await axios.put(`/api/admin/leads/${lead._id}/buyer-code`, { buyerCode: code });
        if (!buyerCodes.includes(code)) {
          try {
            await axios.post('/api/admin/buyer-codes', { code });
            setBuyerCodes((prev) => [...prev, code].sort((a, b) => a.localeCompare(b)));
          } catch {
            /* best-effort catalog add */
          }
        }
        toast({
          title: "Success",
          description: "Buyer code updated successfully",
        });
      }
      fetchLeadDetails(lead._id);
      setUpdateDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'ID_VERIFIED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
      case 'REJECTED_BY_CLIENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':
      case 'WAITING_ID':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDisplayDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      // This regex checks for a YYYY-MM-DD pattern at the start of the string.
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(5, 7), 10);
        const day = parseInt(dateStr.substring(8, 10), 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const localDate = new Date(year, month - 1, day);
          return format(localDate, 'MM/dd/yyyy');
        }
      }
    } catch (e) {
      return dateStr;
    }
    return dateStr;
  };

  if (authLoading || (authChecked && user && !isAdmin) || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lead details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error Loading Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/leads')}
                className="w-full"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Leads
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Lead Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">The requested lead could not be found.</p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/leads')}
                className="w-full"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Leads
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto px-4 md:px-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/leads">Leads</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/leads/${lead._id}`}>
                {lead.firstName} {lead.lastName}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-muted-foreground">
                Lead ID: {lead._id}
              </p>
              {user?.role === 'super_admin' && (
                <Button
                  onClick={() => router.push(`/admin/leads/edit/${lead._id}`)}
                >
                  <FileEdit className="mr-2 h-4 w-4" />
                  Edit Lead
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/leads')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Button>
            {isAdmin && (
              <Button onClick={() => setUpdateDialogOpen(true)}>
                <FileEdit className="mr-2 h-4 w-4" />
                {isSuperAdmin ? 'Update Status' : 'Set Buyer Code'}
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Card className="bg-muted/40 border">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Current Status</span>
              <div className="mt-1">
                <Badge className={`${getStatusColor(lead.status)} text-sm px-3 py-1`}>
                  {lead.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Created</span>
              <span className="text-sm">
                {format(new Date(lead.createdAt), 'MM/dd/yyyy')}
                <div className="text-xs text-muted-foreground">
                  {format(new Date(lead.createdAt), 'hh:mm a')}
                </div>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
              <span className="text-sm">
                {format(new Date(lead.updatedAt), 'MM/dd/yyyy')}
                <div className="text-xs text-muted-foreground">
                  {format(new Date(lead.updatedAt), 'hh:mm a')}
                </div>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Created By</span>
              <span className="text-sm">{lead.createdBy?.name || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lead Details Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Lead Details</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
            <TabsTrigger value="fields">Custom Fields</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground">Full name</span>
                    <span className="text-sm font-medium break-words">{lead.firstName} {lead.lastName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Date of birth</span>
                    <span className="text-sm font-medium break-words">{formatDisplayDate(lead.dateOfBirth) || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                    <span className="text-sm font-medium break-all">{lead.email || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</span>
                    <span className="text-sm font-medium break-words">{lead.phone || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</span>
                    <span className="text-sm font-medium whitespace-pre-wrap break-words">{lead.address || '—'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4" /> Application type</span>
                    <span className="text-sm font-medium break-words">{lead.applicationType || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground">Lawsuit</span>
                    <span className="text-sm font-medium break-words">{lead.lawsuit || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-3">
                    <span className="text-sm text-muted-foreground">Buyer code</span>
                    <span className="text-sm font-medium font-mono break-words">
                      {lead.buyerCode || '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {lead.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Status History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Status Change History
                </CardTitle>
                <CardDescription>
                  Timeline of all status changes for this lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lead.statusHistory && lead.statusHistory.length > 0 ? (
                  <div className="space-y-6">
                    {lead.statusHistory.map((entry, index) => (
                      <div key={entry._id || index} className="relative pl-6 pb-6 border-l-2 border-muted-foreground/20 last:border-0 last:pb-0">
                        <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-background border-2 border-primary"></div>
                        <div className="grid gap-1">
                          <div className="text-sm font-medium flex gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {format(new Date(entry.timestamp), 'MM/dd/yyyy')}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(entry.timestamp), 'hh:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className={getStatusColor(entry.fromStatus)}>
                              {entry.fromStatus.replace(/_/g, ' ')}
                            </Badge>
                            <ArrowRight className="h-4 w-4" />
                            <Badge variant="outline" className={getStatusColor(entry.toStatus)}>
                              {entry.toStatus.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          {entry.notes && (
                            <div className="mt-2 p-3 rounded-md bg-muted">
                              <p className="text-sm">{entry.notes}</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground mt-1">
                            Changed by: {entry.changedBy?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No status changes recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Fields Tab */}
          <TabsContent value="fields">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Application answers
                </CardTitle>
                <CardDescription>
                  All questionnaire and custom field responses for this lead
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {lead.fields && lead.fields.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-y bg-muted/40 text-left">
                          <th className="px-6 py-3 font-medium text-muted-foreground w-[40%] min-w-[180px]">
                            Question / field
                          </th>
                          <th className="px-6 py-3 font-medium text-muted-foreground">
                            Response
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lead.fields.map((field, index) => {
                          let fieldValue = field.value || '—';
                          const appFields = DYNAMIC_FIELDS[lead.applicationType] || [];
                          const fieldDef = appFields.find(f => f.key === field.key);

                          if (fieldDef?.type === 'date' && field.value) {
                            fieldValue = formatDisplayDate(field.value) || field.value;
                          }

                          return (
                            <tr key={index} className="border-b last:border-0 align-top">
                              <td className="px-6 py-3.5 text-muted-foreground whitespace-normal break-words">
                                {fieldDef?.label || field.key}
                              </td>
                              <td className="px-6 py-3.5 font-medium text-foreground whitespace-pre-wrap break-words">
                                {fieldValue}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No custom fields for this lead.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Lead Status / Buyer Code Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSuperAdmin ? 'Update Lead Status' : 'Set Buyer Code'}</DialogTitle>
              <DialogDescription>
                {isSuperAdmin
                  ? `Change the status for ${lead.firstName} ${lead.lastName}`
                  : `Assign a buyer code (e.g. C1, C2) to ${lead.firstName} ${lead.lastName}`}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="font-medium">{lead.firstName} {lead.lastName}</div>
              <div className="text-sm text-muted-foreground">{lead.email}</div>
              {isSuperAdmin && (
                <div className="mt-2">
                  <Badge variant="secondary" className={getStatusColor(lead.status)}>
                    Current: {lead.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
            </div>

            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
                {isSuperAdmin && (
                  <>
                    <FormField
                      control={updateForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Status*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add notes about this status change (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={updateForm.control}
                  name="buyerCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer Code{!isSuperAdmin ? '*' : ''}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select C1, C2…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buyerCodes.map((code) => (
                            <SelectItem key={code} value={code}>{code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormControl>
                        <Input
                          placeholder="Or type a new code (e.g. C6)"
                          className="mt-2 uppercase"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FileEdit className="mr-2 h-4 w-4" />
                        {isSuperAdmin ? 'Update Status' : 'Save Buyer Code'}
                      </>
                    )}
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
