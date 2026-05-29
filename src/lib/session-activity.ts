import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import SessionActivity, { SessionLogoutReason } from "@/models/SessionActivity";

export const SESSION_COOKIE_NAME = "crm_session_id";
export const SESSION_COOKIE_MAX_AGE = 2 * 24 * 60 * 60; // 2 days in seconds
export const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function getRequestIp(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  return realIp || undefined;
}

export function getSessionIdFromRequest(req: NextRequest): string | undefined {
  const value = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return value || undefined;
}

export function createSessionId() {
  return randomUUID();
}

export function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE_NAME);
}

export async function ensureSessionHeartbeat(params: {
  userId: string;
  sessionId: string;
  organizationId?: string;
  ip?: string;
  userAgent?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const setFields: Record<string, unknown> = {
    isActive: true,
    lastSeenAt: now,
  };

  if (params.organizationId) {
    setFields.organizationId = params.organizationId;
  }

  await SessionActivity.findOneAndUpdate(
    { sessionId: params.sessionId, userId: params.userId },
    {
      $setOnInsert: {
        userId: params.userId,
        sessionId: params.sessionId,
        loginAt: now,
        loginIp: params.ip,
        userAgent: params.userAgent,
      },
      $set: setFields,
      $unset: {
        logoutAt: "",
        logoutIp: "",
        logoutReason: "",
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}

export async function closeSession(params: {
  userId: string;
  sessionId?: string;
  ip?: string;
  reason?: SessionLogoutReason;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  if (!params.sessionId) return;

  await SessionActivity.findOneAndUpdate(
    { sessionId: params.sessionId, userId: params.userId, isActive: true },
    {
      $set: {
        isActive: false,
        logoutAt: now,
        logoutIp: params.ip,
        logoutReason: params.reason ?? "unknown",
      },
    }
  );
}

export async function markTimedOutSessions(now = new Date()) {
  const staleSince = new Date(now.getTime() - HEARTBEAT_TIMEOUT_MS);
  await SessionActivity.updateMany(
    {
      isActive: true,
      lastSeenAt: { $lt: staleSince },
    },
    {
      $set: {
        isActive: false,
        logoutAt: now,
        logoutReason: "heartbeat_timeout",
      },
    }
  );
}
