import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// The secret key bypasses RLS: its client may only be imported by the files listed in
// src/server/supabase/admin-usage.md (vol. 05 §5). Adding a file here requires an ADR.
const ADMIN_CLIENT_ALLOWED = [
  'src/server/supabase/admin.ts',
  'src/server/media/images.ts',
  'src/server/staff/device.ts',
  'src/app/api/staff/login/route.ts',
  'src/app/api/staff/logout/route.ts',
  'src/app/int-pro/equipe/page.tsx',
  'src/features/staff/actions.ts',
  'src/features/theming/actions.ts',
  'src/features/console/actions.ts',
  'src/features/console/queries.ts',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ADMIN_CLIENT_ALLOWED,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/server/supabase/admin',
              message:
                'Secret key client: closed list of uses (src/server/supabase/admin-usage.md). Use the user client and RLS.',
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/types/database.ts',
    'supabase/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);

export default eslintConfig;
