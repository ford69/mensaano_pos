import { MenuItem, OrderItem } from '@/types';

export function getLineMenuItem(item: OrderItem, menuItems: MenuItem[]) {
  if (!item.menuItemId) return undefined;
  return menuItems.find((m) => m.id === item.menuItemId);
}

export function getLineDisplayName(item: OrderItem, menuItems: MenuItem[]) {
  const menuItem = getLineMenuItem(item, menuItems);
  if (menuItem) {
    if (item.size && menuItem.sizeVariants?.length) {
      return `${menuItem.name} (${item.size})`;
    }
    return menuItem.name;
  }
  if (item.name?.trim()) {
    return item.size ? `${item.name} (${item.size})` : item.name;
  }
  return 'Custom item';
}

export function getLineLineTotal(item: OrderItem, menuItems: MenuItem[]) {
  const menuItem = getLineMenuItem(item, menuItems);
  if (menuItem) {
    if (item.size && menuItem.sizeVariants) {
      const variant = menuItem.sizeVariants.find((v) => v.size === item.size);
      return variant ? variant.price * item.quantity : 0;
    }
    return (menuItem.price || 0) * item.quantity;
  }
  if (item.unitPrice != null && Number.isFinite(item.unitPrice)) {
    return item.unitPrice * item.quantity;
  }
  return 0;
}
