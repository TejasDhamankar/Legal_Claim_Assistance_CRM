"use client";

import React from 'react';
import {
  Clock, XCircle, CheckCircle, DollarSign, AlertTriangle,
  Copy, PhoneOff, ShieldAlert, TimerOff, FastForward,
  PhoneCall, Clock1, Clock2, Clock3, Clock4, CreditCard,
  FileQuestion, ArrowUpRight, Search, BadgeCheck, Zap,
  FileText, Timer, RefreshCw
} from 'lucide-react';

/**
 * Status visual identity — muted palette (readable, not neon).
 */
export const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; description: string }
> = {
  PAID: {
    icon: <DollarSign />,
    color: '#2f7d4a',
    description: 'Revenue transaction complete',
  },
  BILLABLE: {
    icon: <Zap />,
    color: '#0f766e',
    description: 'Validated for invoicing',
  },
  SENT_CLIENT: {
    icon: <ArrowUpRight />,
    color: '#1d4ed8',
    description: 'Transferred to client portal',
  },
  SENT_TO_CLIENT: {
    icon: <ArrowUpRight />,
    color: '#1d4ed8',
    description: 'Transferred to client portal',
  },
  SENT_TO_LAW_FIRM: {
    icon: <FileText />,
    color: '#7c4a1e',
    description: 'Transferred to legal council',
  },
  POSTED: {
    icon: <CheckCircle />,
    color: '#2563eb',
    description: 'Lead successfully posted to the destination system',
  },
  ID_VERIFIED: {
    icon: <BadgeCheck />,
    color: '#166534',
    description: 'Confirmed identity status',
  },
  VERIFIED: {
    icon: <CheckCircle />,
    color: '#15803d',
    description: 'Data points fully validated',
  },
  SIGNED: {
    icon: <FileText />,
    color: '#0f766e',
    description: 'Contract successfully signed',
  },
  WORKING: {
    icon: <FastForward />,
    color: '#1e40af',
    description: 'Active pipeline progression',
  },
  QC: {
    icon: <Search />,
    color: '#6b21a8',
    description: 'Quality assurance evaluation',
  },
  CALL_BACK: {
    icon: <PhoneCall />,
    color: '#0369a1',
    description: 'Scheduled follow-up sequence',
  },
  WAITING_ID: {
    icon: <FileQuestion />,
    color: '#a16207',
    description: 'Pending identity documents',
  },
  ATTEMPT_1: { icon: <Clock1 />, color: '#64748b', description: 'Initial outreach' },
  ATTEMPT_2: { icon: <Clock2 />, color: '#475569', description: 'Secondary contact' },
  ATTEMPT_3: { icon: <Clock3 />, color: '#334155', description: 'Tertiary contact' },
  ATTEMPT_4: { icon: <Clock4 />, color: '#1e293b', description: 'Final outreach' },
  PENDING: {
    icon: <Clock />,
    color: '#ca8a04',
    description: 'Awaiting initial system review',
  },
  REFRESH: {
    icon: <RefreshCw />,
    color: '#0e7490',
    description: 'Lead marked for refresh / re-work',
  },
  CAMPAIGN_PAUSED: {
    icon: <Timer />,
    color: '#64748b',
    description: 'Active campaign on hold',
  },
  NOT_RESPONDING: {
    icon: <PhoneOff />,
    color: '#475569',
    description: 'Communication attempts failed',
  },
  REJECTED: {
    icon: <XCircle />,
    color: '#b91c1c',
    description: 'Disqualified lead parameters',
  },
  REJECTED_BY_CLIENT: {
    icon: <AlertTriangle />,
    color: '#be123c',
    description: 'External client rejection',
  },
  DUPLICATE: {
    icon: <Copy />,
    color: '#7c3aed',
    description: 'Redundant entry detected',
  },
  RETURNED: {
    icon: <TimerOff />,
    color: '#475569',
    description: 'Returned back to source queue',
  },
  FELONY: {
    icon: <ShieldAlert />,
    color: '#7f1d1d',
    description: 'Legal eligibility restriction',
  },
  CHARGEBACK: {
    icon: <CreditCard />,
    color: '#9d174d',
    description: 'Financial reversal alert',
  },
  DEAD_LEAD: {
    icon: <TimerOff />,
    color: '#374151',
    description: 'Lead non-conversion state',
  },
  VM: {
    icon: <PhoneOff />,
    color: '#475569',
    description: 'Left voicemail',
  },
  TRANSFERRED: {
    icon: <ArrowUpRight />,
    color: '#1d4ed8',
    description: 'Transferred to another queue',
  },
  SEND_TO_ANOTHER_BUYER: {
    icon: <ArrowUpRight />,
    color: '#7c3aed',
    description: 'Sent to another buyer',
  },
};

export const STATUS_SEQUENCE = [
  "PAID", "BILLABLE", "SIGNED", "SENT_CLIENT", "SENT_TO_CLIENT", "SENT_TO_LAW_FIRM", "ID_VERIFIED", "VERIFIED", "POSTED",
  "WORKING", "QC", "CALL_BACK", "WAITING_ID", "PENDING", "REFRESH", "TRANSFERRED", "VM", "SEND_TO_ANOTHER_BUYER",
  "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CAMPAIGN_PAUSED", "NOT_RESPONDING", "REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "RETURNED", "FELONY", "CHARGEBACK", "DEAD_LEAD"
];

export const BUCKETS = {
  PIPELINE: ["WORKING", "QC", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", "CALL_BACK", "PENDING", "WAITING_ID", "REFRESH", "VM", "TRANSFERRED"],
  CONVERSION: ["VERIFIED", "ID_VERIFIED", "SIGNED", "SENT_CLIENT", "SENT_TO_CLIENT", "PAID", "BILLABLE", "SENT_TO_LAW_FIRM", "POSTED"],
  RISK: ["REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "RETURNED", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "CHARGEBACK", "SEND_TO_ANOTHER_BUYER"]
};

export { lawsuitColor } from '@/lib/lawsuit-color';

export const sortDataByStatus = (data: any[]) => {
  return [...data].sort((a, b) => {
    return STATUS_SEQUENCE.indexOf(a.status) - STATUS_SEQUENCE.indexOf(b.status);
  });
};
