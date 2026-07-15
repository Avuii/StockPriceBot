import { BarChart3, Bell, Bookmark, LayoutDashboard, PackageSearch, Settings, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { View } from '../../app/types';

export const navigationItems: Array<{ view: View; Icon: LucideIcon }> = [
  { view: 'dashboard', Icon: LayoutDashboard },
  { view: 'products', Icon: PackageSearch },
  { view: 'watchlist', Icon: Bookmark },
  { view: 'categories', Icon: Tags },
  { view: 'statistics', Icon: BarChart3 },
  { view: 'notifications', Icon: Bell },
  { view: 'settings', Icon: Settings }
];
