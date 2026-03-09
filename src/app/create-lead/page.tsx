import { redirect } from 'next/navigation';
import { createIntakeToken } from '@/lib/public-intake';

const DEFAULT_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

export default function CreateLeadShortcutPage() {
  const clientSlug = process.env.PUBLIC_INTAKE_DEFAULT_SLUG || 'public-client';
  const expiresAtUnix = Math.floor(Date.now() / 1000) + DEFAULT_TOKEN_TTL_SECONDS;
  const token = createIntakeToken(clientSlug, expiresAtUnix);

  redirect(`/intake/${clientSlug}?t=${encodeURIComponent(token)}&src=direct_link`);
}
