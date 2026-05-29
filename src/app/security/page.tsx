'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SecurityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      setSubmitting(true);
      await axios.post('/api/auth/update-password', values);
      toast({ title: "Security updated", description: "Your password is now synchronized." });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.error || "Error connecting to security server",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) { router.push('/login'); return null; }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 dark:bg-transparent p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Account Security</h1>
              <p className="text-slate-500 mt-1">Manage your account security and login settings</p>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Account Protected
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form Column */}
            <div className="lg:col-span-7">
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/80 dark:bg-slate-900/50 backdrop-blur-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-indigo-500" />
Login Details                  </CardTitle>
                  <CardDescription>Update your login password below</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 focus:ring-indigo-500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" className="bg-slate-50/50 dark:bg-slate-950 border-slate-200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">Confirm New</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" className="bg-slate-50/50 dark:bg-slate-950 border-slate-200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        disabled={submitting} 
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply Changes'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  Security Checklist
                </h3>
                <ul className="space-y-4">
                  {[
                    "Use 8+ characters for better entropy",
                    "Mix symbols (!@#) and numbers",
                    "Avoid using names or birthdays",
                    "Change this every 90 days"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-tight">Access History</h4>
                <p className="text-sm font-medium">
                  Last active session identified:
                </p>
                <code className="block mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-600 dark:text-slate-400">
                  {format(new Date(), 'MM/dd/yyyy')} — {new Date().toLocaleTimeString()} (Current Device)
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}