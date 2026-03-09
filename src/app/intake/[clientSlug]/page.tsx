'use client';

import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Check } from 'lucide-react';

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
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DateInput } from '@/components/ui/DateInput';
import { toast } from '@/components/ui/use-toast';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

const APPLICATION_TYPES = Object.keys(DYNAMIC_FIELDS);

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

export default function PublicIntakePage() {
  const params = useParams<{ clientSlug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const source = searchParams.get('src') || 'public_link';

  const clientSlug = useMemo(() => params.clientSlug || '', [params.clientSlug]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [honeypot, setHoneypot] = useState('');
  const [startedAt] = useState<number>(() => Date.now());

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
        variant: 'destructive',
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Error',
        description: 'Invalid or missing secure link token',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/public/intake', {
        ...values,
        fields: dynamicFields,
        clientSlug,
        token,
        hp: honeypot,
        startedAt,
        source,
      });

      setSubmitted(true);
      toast({ title: 'Success', description: 'Your information was submitted successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit form',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    const fields = DYNAMIC_FIELDS[selectedType] || [];
    return fields.map(field => {
      const isRequired =
        selectedType === 'Juvenile Detention Center (JDC)'
          ? field.key === 'Location Of Incident'
          : field.required;

      let inputComponent;
      if (field.type === 'date') {
        inputComponent = (
          <DateInput
            value={dynamicFields[field.key] || ''}
            onChange={value =>
              setDynamicFields(prev => ({
                ...prev,
                [field.key]: value,
              }))
            }
          />
        );
      } else if (field.type === 'textarea') {
        inputComponent = (
          <Textarea
            value={dynamicFields[field.key] || ''}
            onChange={e =>
              setDynamicFields(prev => ({
                ...prev,
                [field.key]: e.target.value,
              }))
            }
            className="min-h-[100px]"
          />
        );
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        const options = field.options || [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
        ];
        inputComponent = (
          <Select
            value={dynamicFields[field.key] || ''}
            onValueChange={value =>
              setDynamicFields(prev => ({
                ...prev,
                [field.key]: value,
              }))
            }
          >
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else {
        inputComponent = (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={dynamicFields[field.key] || ''}
            onChange={e =>
              setDynamicFields(prev => ({
                ...prev,
                [field.key]: e.target.value,
              }))
            }
            className="h-10"
          />
        );
      }

      return (
        <FormItem key={field.key}>
          <FormLabel>
            {field.label}
            {isRequired ? '*' : ''}
          </FormLabel>
          <FormControl>{inputComponent}</FormControl>
        </FormItem>
      );
    });
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Invalid Link</h1>
          <p className="mt-2 text-sm text-slate-600">
            This intake link is missing a security token. Please request a new link.
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-10 text-center shadow-sm">
          <Check className="mx-auto h-10 w-10 text-green-600" />
          <h1 className="mt-4 text-2xl font-semibold">Thank you</h1>
          <p className="mt-2 text-sm text-slate-600">Your details have been submitted. Our team will contact you.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Lead Intake Form</h1>
          <p className="mt-2 text-sm text-slate-600">Please fill in your details below.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input
              type="text"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden
            />

            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Of Birth*</FormLabel>
                      <FormControl>
                        <DateInput value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
                <CardDescription>Choose the type of application.</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                <FormField
                  control={form.control}
                  name="applicationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Type*</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value);
                          setSelectedType(value);
                          setDynamicFields({});
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select application type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {APPLICATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lawsuit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lawsuit</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {selectedType && (
              <Card>
                <CardHeader>
                  <CardTitle>Case-Specific Information</CardTitle>
                  <CardDescription>Details for: {selectedType}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                  {renderDynamicFields()}
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
