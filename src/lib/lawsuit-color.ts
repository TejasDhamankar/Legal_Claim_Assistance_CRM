const LAWSUIT_PALETTE = [
  '#5b4b8a',
  '#2f6f6a',
  '#1f5c8a',
  '#8a6a1f',
  '#8a3a3a',
  '#4a5d8a',
  '#6a4a3a',
  '#3a6a4a',
];

export function lawsuitColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LAWSUIT_PALETTE[Math.abs(hash) % LAWSUIT_PALETTE.length];
}
