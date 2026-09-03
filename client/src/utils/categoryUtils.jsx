import {
  Fuel,
  Utensils,
  Home,
  Receipt,
  HelpCircle,
  Briefcase,
} from 'lucide-react';

export function CategoryIcon({ category, type, className = 'w-4 h-4' }) {
  if (type === 'credit') {
    return <Briefcase className={className} />;
  }

  switch (category?.toLowerCase()) {
    case 'fuel':
      return <Fuel className={className} />;
    case 'food':
      return <Utensils className={className} />;
    case 'housing':
    case 'rent':
      return <Home className={className} />;
    case 'bills':
      return <Receipt className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}
