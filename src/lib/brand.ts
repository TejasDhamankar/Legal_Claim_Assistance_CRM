export const BRAND = {
  name: 'Lexora',
  tagline: 'Claims CRM',
  shortTagline: 'Claims CRM',
  description:
    'CRM for legal teams, consultants, and claim operations.',
} as const;

export const brandTitle = (page?: string) =>
  page ? `${page} | ${BRAND.name}` : BRAND.name;
