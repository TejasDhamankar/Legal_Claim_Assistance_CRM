'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  User,
  ClipboardList,
  Save,
  Check,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { DateInput } from '@/components/ui/DateInput';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

const APPLICATION_TYPES = Object.keys(DYNAMIC_FIELDS);

// Schema updated to accept strings for dates in 'YYYY-MM-DD' format
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  applicationType: z.string().min(1, 'Application type is required'),
  lawsuit: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLeadClientProps {
  mode?: 'create' | 'edit';
  leadId?: string;
}

const normalizeDateValue = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toISOString().slice(0, 10);
};

export default function CreateLeadClient({ mode = 'create', leadId }: CreateLeadClientProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && !!leadId;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      applicationType: '',
      lawsuit: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!isEditMode || !leadId) return;

    const fetchLead = async () => {
      setInitialLoading(true);
      try {
        const { data } = await axios.get(`/api/admin/leads/${leadId}`);
        const existingLead = data.lead;

        const mappedDynamicFields = Array.isArray(existingLead.fields)
          ? existingLead.fields.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
              if (field?.key) acc[field.key] = field.value || '';
              return acc;
            }, {})
          : (existingLead.fields || {});

        form.reset({
          firstName: existingLead.firstName || '',
          lastName: existingLead.lastName || '',
          email: existingLead.email || '',
          phone: existingLead.phone || '',
          dateOfBirth: normalizeDateValue(existingLead.dateOfBirth),
          address: existingLead.address || '',
          applicationType: existingLead.applicationType || '',
          lawsuit: existingLead.lawsuit || '',
          notes: existingLead.notes || '',
        });

        setSelectedType(existingLead.applicationType || '');
        setDynamicFields(mappedDynamicFields);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load lead',
          variant: 'destructive',
        });
        router.push('/admin/leads');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLead();
  }, [form, isEditMode, leadId, router]);

  const onSubmit = async (values: FormValues) => {
    const requiredDynamicFields =
      selectedType === 'Juvenile Detention Center (JDC)'
        ? (DYNAMIC_FIELDS[selectedType] || []).filter(field => field.key === 'Location Of Incident')
        : (DYNAMIC_FIELDS[selectedType] || []).filter(field => field.required);

    const missingFields = requiredDynamicFields.filter(field => !dynamicFields[field.key]);

    if (missingFields.length > 0) {
      toast({
        title: 'Error',
        description: `Please fill out: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        fields: dynamicFields,
      };

      if (isEditMode && leadId) {
        await axios.put(`/api/leads/${leadId}`, payload);
        toast({ title: 'Success', description: 'Lead updated successfully' });
        router.push(`/admin/leads/${leadId}`);
        return;
      }

      const { data } = await axios.post('/api/leads', { ...payload, status: 'PENDING' });
      setSubmitted(true);
      toast({
        title: data.isDuplicate ? 'Duplicate Lead' : 'Success',
        description: data.message || 'Lead created successfully',
      });
      setTimeout(() => router.push('/leads'), 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || (isEditMode ? 'Failed to update lead' : 'Failed to create lead'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    const fields = DYNAMIC_FIELDS[selectedType] || [];
    return fields.map(field => {
      const isRequired =
        selectedType === 'Juvenile Detention Center (JDC)'
          ? field.key === 'Location Of Incident'
          : Boolean(field.required);

      let inputComponent;
      if (field.type === 'date') {
        inputComponent = (
          <DateInput
            value={dynamicFields[field.key] || ''}
            onChange={value => setDynamicFields(prev => ({ ...prev, [field.key]: value }))}
          />
        );
      } else if (field.type === 'text' || field.type === 'email' || field.type === 'phone') {
        const placeholder =
          selectedType === 'Juvenile Detention Center (JDC)' && field.key === 'Location Of Incident'
            ? 'Enter juvenile detention facility name'
            : selectedType === 'Juvenile Detention' && field.key === 'Facility Name'
            ? 'Enter facility name'
            : `Enter ${field.label.toLowerCase()}`;
        inputComponent = (
          <Input
            type={field.type}
            value={dynamicFields[field.key] || ''}
            onChange={e => setDynamicFields(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={placeholder}
            className="bg-background"
          />
        );
      } else if (field.type === 'textarea') {
        inputComponent = (
          <Textarea
            value={dynamicFields[field.key] || ''}
            onChange={e => setDynamicFields(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-background"
          />
        );
      } else {
        const options = field.options || [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }];
        inputComponent = (
          <Select
            value={dynamicFields[field.key] || ''}
            onValueChange={val => setDynamicFields(prev => ({ ...prev, [field.key]: val }))}
          >
            <FormControl>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white dark:bg-slate-950 z-50 shadow-xl border">
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <FormItem key={field.key}>
          <FormLabel className="text-sm">{field.label}{isRequired && '*'}</FormLabel>
          <FormControl>{inputComponent}</FormControl>
          <FormMessage />
        </FormItem>
      );
    });
  };

  if (submitted && !isEditMode) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-2">Lead Profile Created</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => router.push('/leads')}>View All Leads</Button>
            <Button onClick={() => { form.reset(); setSubmitted(false); setSelectedType(''); setDynamicFields({}); }}>Add Another</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 md:space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            {isEditMode ? 'Edit Lead Profile' : 'New Lead Profile'}
          </h1>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="rounded-xl border shadow-sm bg-card/40 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg md:text-xl">Client Details</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address'].map(fieldName => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof FormValues}
                    render={({ field }) => (
                      <FormItem className={fieldName === 'address' ? 'md:col-span-2' : ''}>
                        <FormLabel className="text-sm capitalize">
                          {fieldName.replace(/([A-Z])/g, ' $1')}
                          {(fieldName === 'firstName' || fieldName === 'lastName' || fieldName === 'email' || fieldName === 'phone' || fieldName === 'dateOfBirth' || fieldName === 'address') && '*'}
                        </FormLabel>
                        <FormControl>
                          {fieldName === 'dateOfBirth' ? (
                            <DateInput {...field} />
                          ) : (
                            <Input
                              type={fieldName === 'email' ? 'email' : 'text'}
                              placeholder={
                                fieldName === 'firstName' ? 'Enter first name' :
                                fieldName === 'lastName' ? 'Enter last name' :
                                fieldName === 'email' ? 'Enter email address' :
                                fieldName === 'phone' ? 'Enter phone number' :
                                'Enter full address'
                              }
                              {...field}
                              className="h-10 bg-background"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm bg-card/40 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg md:text-xl">Case Information</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField control={form.control} name="applicationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Application Type*</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedType(val);
                        setDynamicFields({});
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background">
                          <SelectValue placeholder="Select application type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-950 z-50 border">
                        {APPLICATION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel className="text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this lead"
                        {...field}
                        className="min-h-[100px] resize-none bg-background"
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {selectedType && (
              <Card className="rounded-xl border shadow-sm bg-card/40 overflow-hidden">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Case-Specific Information</CardTitle>
                  <CardDescription className="text-xs">Details for: {selectedType}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {renderDynamicFields()}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:min-w-[150px] gap-2 h-11 sm:h-10">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditMode ? 'Update Lead' : 'Save Lead'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
