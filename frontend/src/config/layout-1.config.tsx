import { House, Tags } from 'lucide-react';
import { MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  { title: 'Home', titleKey: 'nav.home', icon: House, path: '/' },
  {
    title: 'Category Management',
    titleKey: 'nav.categories',
    icon: Tags,
    path: '/categories',
  },
];
