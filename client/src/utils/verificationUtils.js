import { Check, AlertTriangle, Sparkles, FileCheck } from 'lucide-react';

export const BADGE_CONFIG = {
  receipt_verified: {
    label: 'Receipt Verified',
    icon: FileCheck,
    shortLabel: '✓ Receipt Verified',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
    iconClass: 'text-emerald-400',
    description: 'Transaction has supporting receipt evidence processed by Dhara.',
    prefix: '✓',
  },
  self_reported: {
    label: 'Self Reported',
    icon: AlertTriangle,
    shortLabel: '⚠ Self Reported',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
    iconClass: 'text-amber-400',
    description: 'Transaction was entered manually without supporting receipt evidence.',
    prefix: '⚠',
  },
  aa_verified: {
    label: 'AA Verified',
    icon: Check,
    shortLabel: '✓ AA Verified',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
    iconClass: 'text-blue-400',
    description: 'Transaction imported through the simulated Account Aggregator flow.',
    prefix: '✓',
  },
  synthetic_demo: {
    label: 'DEMO · Synthetic',
    icon: Sparkles,
    shortLabel: 'DEMO · Synthetic',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
    iconClass: 'text-purple-400',
    description: 'Synthetic transaction used for the hackathon demonstration.',
    prefix: 'DEMO',
  },
};

export function getBadgeConfig(status) {
  const normStatus = (status || 'self_reported').toLowerCase();
  return BADGE_CONFIG[normStatus] || BADGE_CONFIG.self_reported;
}
