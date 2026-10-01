import { MENU_SIDEBAR } from '@/config/layout-1.config';
import type { MenuItem } from '@/config/types';
import { useText } from './locale-provider';

export function useLocalizedMenu() {
  const t = useText();
  const translate = (item: MenuItem): MenuItem => ({
    ...item,
    title: item.titleKey ? t(item.titleKey) : item.title,
    children: item.children?.map(translate),
  });
  return MENU_SIDEBAR.map(translate);
}
