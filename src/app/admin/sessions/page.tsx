'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, Clock3, LogIn, LogOut, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SessionUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type SessionOrg = {
  _id: string;
  name: string;
};

type SessionRecord = {
  _id: string;
  sessionId: string;
  userId: SessionUser;
  organizationId?: SessionOrg;
  loginAt: string;
  logoutAt?: string;
  lastSeenAt: string;
  isActive: boolean;
  logoutReason?: string;
  loginIp?: string;
  logoutIp?: string;
};

type SessionsApiResponse = {
  summary: {
    onlineUsers: number;
    todayLogins: number;
    todayLogouts: number;
    onlineWindowMs: number;
  };
  activeSessions: SessionRecord[];
  recentSessions: SessionRecord[];
};

export default function AdminSessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading, authChecked } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SessionsApiResponse | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get<SessionsApiResponse>('/api/admin/sessions');
      setData(response.data);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        router.replace('/dashboard');
        return;
      }
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !authChecked || !user) return;
    if (!isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
    void fetchSessions();
    const timer = window.setInterval(() => {
      void fetchSessions();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [authLoading, authChecked, user, isSuperAdmin, router]);

  const onlineWindowLabel = useMemo(() => {
    if (!data?.summary.onlineWindowMs) return '2 minutes';
    const minutes = Math.max(1, Math.round(data.summary.onlineWindowMs / 60000));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }, [data]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Loading session activity...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Session Activity</h1>
            <p className="text-sm text-muted-foreground">
              Live presence and login/logout history. Online is based on heartbeat within {onlineWindowLabel}.
            </p>
          </div>
          <Button onClick={fetchSessions} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Online Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.summary.onlineUsers ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <LogIn className="h-4 w-4" />
                Today Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.summary.todayLogins ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <LogOut className="h-4 w-4" />
                Today Logouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.summary.todayLogouts ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Currently Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.activeSessions ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No active sessions right now.
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.activeSessions ?? []).map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>
                        <div className="font-medium">{session.userId?.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{session.userId?.email || '-'}</div>
                      </TableCell>
                      <TableCell>{session.userId?.role || '-'}</TableCell>
                      <TableCell>{session.organizationId?.name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(session.loginAt), 'PPp')}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(session.lastSeenAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Login / Logout Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Logout</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentSessions ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No audit records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.recentSessions ?? []).map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>
                        <div className="font-medium">{session.userId?.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{session.userId?.email || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {session.sessionId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{format(new Date(session.loginAt), 'PPp')}</TableCell>
                      <TableCell>
                        {session.logoutAt ? (
                          format(new Date(session.logoutAt), 'PPp')
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Clock3 className="h-3 w-3" />
                            Not logged out
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(session.lastSeenAt), 'PPp')}</TableCell>
                      <TableCell>{session.logoutReason || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
