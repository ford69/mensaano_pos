const mongoose = require('mongoose');

function normalize(str) {
  return String(str).trim().toLowerCase();
}

/**
 * Find a menu row by Mongo id and/or human-readable name.
 */
function findMenuItem(menuItems, { id, name }) {
  if (id && mongoose.Types.ObjectId.isValid(String(id))) {
    const byId = menuItems.find((m) => String(m._id) === String(id));
    if (byId) return byId;
  }

  const searchName =
    (name && String(name).trim()) ||
    (id && !mongoose.Types.ObjectId.isValid(String(id)) ? String(id).trim() : null);

  if (!searchName) return null;

  const n = normalize(searchName);
  const exact = menuItems.find((m) => normalize(m.name) === n);
  if (exact) return exact;

  const partial = menuItems.find(
    (m) => normalize(m.name).includes(n) || n.includes(normalize(m.name))
  );
  return partial || null;
}

/**
 * Resolve one integration line item.
 * Accepts menuItemId (ObjectId or name string), and/or name.
 * Unmatched lines are stored with `name` (+ optional unitPrice) for kitchen/receipt display.
 */
function resolveIntegrationLine(line, menuItems) {
  const qty = Number(line.quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    return { error: 'Each item requires quantity >= 1' };
  }

  const hasId = line.menuItemId != null && String(line.menuItemId).trim() !== '';
  const hasName = line.name != null && String(line.name).trim() !== '';
  if (!hasId && !hasName) {
    return { error: 'Each item needs menuItemId and/or name' };
  }

  const matched = findMenuItem(menuItems, {
    id: hasId ? line.menuItemId : undefined,
    name: hasName ? line.name : undefined,
  });

  const size = line.size ? String(line.size).trim() : undefined;
  const note = line.note ? String(line.note).trim() : undefined;

  if (matched) {
    return {
      item: {
        menuItemId: String(matched._id),
        name: matched.name,
        quantity: qty,
        size: size || undefined,
        note: note || undefined,
      },
      matched: true,
    };
  }

  const displayName =
    (hasName ? String(line.name).trim() : null) ||
    (hasId ? String(line.menuItemId).trim() : null);

  const unitPriceRaw = line.unitPrice != null ? Number(line.unitPrice) : undefined;
  const unitPrice =
    unitPriceRaw != null && Number.isFinite(unitPriceRaw) && unitPriceRaw >= 0
      ? unitPriceRaw
      : undefined;

  return {
    item: {
      menuItemId: '',
      name: displayName,
      quantity: qty,
      size: size || undefined,
      note: note || undefined,
      unitPrice,
    },
    matched: false,
    warning: `No menu match for "${displayName}" — stored as custom line`,
  };
}

function resolveIntegrationItems(lines, menuItems) {
  const items = [];
  const warnings = [];

  for (let i = 0; i < lines.length; i++) {
    const result = resolveIntegrationLine(lines[i], menuItems);
    if (result.error) {
      return { error: result.error, index: i };
    }
    items.push(result.item);
    if (result.warning) {
      warnings.push({ index: i, message: result.warning, name: result.item.name });
    }
  }

  return { items, warnings };
}

function getLineLineTotal(item, menuItems) {
  if (item.menuItemId) {
    const menuItem = menuItems.find((m) => String(m._id) === String(item.menuItemId));
    if (menuItem) {
      if (item.size && menuItem.sizeVariants?.length) {
        const variant = menuItem.sizeVariants.find((v) => v.size === item.size);
        return variant ? variant.price * item.quantity : 0;
      }
      return (menuItem.price || 0) * item.quantity;
    }
  }
  if (item.unitPrice != null && Number.isFinite(item.unitPrice)) {
    return item.unitPrice * item.quantity;
  }
  return 0;
}

function getOrderItemsTotal(items, menuItems) {
  return items.reduce((sum, item) => sum + getLineLineTotal(item, menuItems), 0);
}

module.exports = {
  findMenuItem,
  resolveIntegrationLine,
  resolveIntegrationItems,
  getLineLineTotal,
  getOrderItemsTotal,
};
