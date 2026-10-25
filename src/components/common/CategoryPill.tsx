import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Sparkles,
  Film,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Smile,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Coins,
  Building,
  Gift,
  ArrowDownLeft,
  Tag,
} from 'lucide-react';
import { getCategoryMeta } from '../../utils/categories';

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Sparkles,
  Film,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Smile,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Coins,
  Building,
  Gift,
  ArrowDownLeft,
  Tag,
};

interface CategoryPillProps {
  category: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  category,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const meta = getCategoryMeta(category);
  const IconComponent = ICON_MAP[meta.icon] || Tag;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border transition-colors ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: meta.bgColor,
        color: meta.color,
        borderColor: `${meta.color}30`,
      }}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className="truncate">{category}</span>
    </span>
  );
};
