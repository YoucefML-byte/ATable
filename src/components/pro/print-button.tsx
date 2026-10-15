'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export function PrintButton({ label }: { label: string }) {
  return (
    <Button onClick={() => window.print()}>
      <Printer aria-hidden className="h-4 w-4" /> {label}
    </Button>
  );
}
