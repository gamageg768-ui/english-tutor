import fs from 'fs';
import path from 'path';

export interface Situation {
  id: number | string;
  title: string;
  domain: string;
  module: string;
  level: string;
  role: string;
  context?: string;
  description?: string;
  user_role?: string;
  goal?: string;
  system_prompt?: string;
  is_custom?: boolean;
  created_at?: string;
}

let _situations: Situation[] | null = null;

export function getSituations(): Situation[] {
  if (_situations) return _situations;
  try {
    const filePath = path.join(process.cwd(), 'public', 'situations_500.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    _situations = JSON.parse(raw);
    return _situations!;
  } catch {
    return [];
  }
}
