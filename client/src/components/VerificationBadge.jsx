import { getBadgeConfig } from '../utils/verificationUtils';

export default function VerificationBadge({
  status = 'self_reported',
  size = 'sm',
  showTooltip = true,
  className = '',
}) {
  const config = getBadgeConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      title={showTooltip ? config.description : undefined}
      className={`
        inline-flex items-center font-medium rounded-full border transition-all cursor-default select-none
        ${config.badgeClass}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      <Icon className={`${iconSizes[size] || iconSizes.sm} ${config.iconClass} flex-shrink-0`} />
      <span className="font-semibold tracking-tight whitespace-nowrap">
        {config.label}
      </span>
    </span>
  );
}
