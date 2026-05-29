"use client";

import React from 'react';
import { 
  Clock, XCircle, CheckCircle, DollarSign, AlertTriangle, 
  Copy, PhoneOff, ShieldAlert, TimerOff, FastForward, 
  PhoneCall, Clock1, Clock2, Clock3, Clock4, CreditCard, 
  FileQuestion, ArrowUpRight, Search, BadgeCheck, Zap, 
  FileText, Timer 
} from 'lucide-react';

/**
 * 1. STATUS CONFIGURATION
 * Maps status keys to their visual identity (Icon, Color, and Label)
 */
export const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; description: string }
> = {
  // --- SUCCESS & REVENUE ---
  PAID: {
    icon: <DollarSign />,
    color: '#16a34a', // money green
    description: 'Revenue transaction complete',
  },
  BILLABLE: {
    icon: <Zap />,
    color: '#14b8a6', // teal
    description: 'Validated for invoicing',
  },
  SENT_CLIENT: {
    icon: <ArrowUpRight />,
    color: '#1e40af', // emerald
    description: 'Transferred to client portal',
  },
  SENT_TO_LAW_FIRM: {
    icon: <FileText />,
    color: '#7c2d12', // brown
    description: 'Transferred to legal council',
  },

   POSTED: {
    icon: <CheckCircle />, // Or <ArrowUpRight />
    color: '#3b82f6', // Bright Blue (Success/Active)
    description: 'Lead successfully posted to the destination system',
  },
  ID_VERIFIED: {
    icon: <BadgeCheck />,
    color: '#15803d', // dark green
    description: 'Confirmed identity status',
  },
  VERIFIED: {
    icon: <CheckCircle />,
    color: '#22c55e', // green
    description: 'Data points fully validated',
  },
  SIGNED: {
  icon: <FileText />,
  color: '#059669',
  description: 'Contract successfully signed',
},

  // --- ACTIVE PIPELINE ---
  WORKING: {
    icon: <FastForward />,
    color: '#2563eb', // blue
    description: 'Active pipeline progression',
  },
  QC: {
    icon: <Search />,
    color: '#9333ea', // purple
    description: 'Quality assurance evaluation',
  },
  CALL_BACK: {
    icon: <PhoneCall />,
    color: '#0ea5e9', // sky blue
    description: 'Scheduled follow-up sequence',
  },
  WAITING_ID: {
    icon: <FileQuestion />,
    color: '#eab308', // yellow
    description: 'Pending identity documents',
  },
  ATTEMPT_1: { icon: <Clock1 />, color: '#c7d2fe', description: 'Initial outreach' },
  ATTEMPT_2: { icon: <Clock2 />, color: '#818cf8', description: 'Secondary contact' },
  ATTEMPT_3: { icon: <Clock3 />, color: '#6366f1', description: 'Tertiary contact' },
  ATTEMPT_4: { icon: <Clock4 />, color: '#4338ca', description: 'Final outreach' },
  PENDING: {
    icon: <Clock />,
    color: '#facc15', // amber
    description: 'Awaiting initial system review',
  },

  // --- RISKS & INACTIVE ---
  CAMPAIGN_PAUSED: {
    icon: <Timer />,
    color: '#94a3b8', // gray-blue
    description: 'Active campaign on hold',
  },
  NOT_RESPONDING: {
    icon: <PhoneOff />,
    color: '#64748b', // slate
    description: 'Communication attempts failed',
  },
  REJECTED: {
    icon: <XCircle />,
    color: '#dc2626', // red
    description: 'Disqualified lead parameters',
  },
  REJECTED_BY_CLIENT: {
    icon: <AlertTriangle />,
    color: '#fb7185', // rose
    description: 'External client rejection',
  },
  DUPLICATE: {
    icon: <Copy />,
    color: '#a78bfa', // violet
    description: 'Redundant entry detected',
  },
  RETURNED: {
    icon: <TimerOff />,
    color: '#475569', // slate-600
    description: 'Returned back to source queue',
  },
  FELONY: {
    icon: <ShieldAlert />,
    color: '#7f1d1d', // dark red
    description: 'Legal eligibility restriction',
  },
  CHARGEBACK: {
    icon: <CreditCard />,
    color: '#be185d', // magenta
    description: 'Financial reversal alert',
  },
  DEAD_LEAD: {
    icon: <TimerOff />,
    color: '#1f2937', // charcoal
    description: 'Lead non-conversion state',
  },
  
};

/**
 * 2. SORTING SEQUENCE
 * Use this array to sort your charts and lists.
 * Order: Money -> Pipeline -> Outreach -> Rejection
 */
export const STATUS_SEQUENCE = [
  "PAID", "BILLABLE", "SIGNED", "SENT_TO_CLIENT", "SENT_TO_LAW_FIRM", "ID_VERIFIED", "VERIFIED",
  "WORKING", "QC", "CALL_BACK", "WAITING_ID", "PENDING",
  "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CAMPAIGN_PAUSED", "NOT_RESPONDING", "REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "RETURNED", "FELONY", "CHARGEBACK", "DEAD_LEAD"
];

/**
 * 3. LOGICAL BUCKETS
 */
export const BUCKETS = {
  PIPELINE: ["WORKING", "QC", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", "CALL_BACK"],
  CONVERSION: ["VERIFIED", "ID_VERIFIED", "SIGNED", "SENT_TO_CLIENT", "PAID", "BILLABLE", "SENT_TO_LAW_FIRM"],
  RISK: ["REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "RETURNED", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "CHARGEBACK"]
};

/**
 * 4. HELPER FUNCTION
 * Use this to sort your raw data before rendering the chart
 */
export const sortDataByStatus = (data: any[]) => {
  return [...data].sort((a, b) => {
    return STATUS_SEQUENCE.indexOf(a.status) - STATUS_SEQUENCE.indexOf(b.status);
  });
};
