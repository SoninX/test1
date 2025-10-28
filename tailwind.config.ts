import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      fontSize: {
        'tiny': ['0.625rem', { lineHeight: '0.875rem' }],
        'xxs': ['0.5rem', { lineHeight: '0.75rem' }],
      },
    },
  },
} satisfies Config