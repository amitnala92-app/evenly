export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

export function money(cents) {
  const amount = (Number(cents) || 0) / 100;
  const absolute = Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return amount < 0 ? `-${absolute}` : absolute;
}

export function moneyPlain(cents) {
  return Math.abs((Number(cents) || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function parseAmount(input) {
  const cleaned = String(input ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  return Math.round(Number(cleaned) * 100);
}

export function isoDate(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(offset, from = new Date()) {
  const copy = new Date(from);
  copy.setHours(12, 0, 0, 0);
  copy.setDate(copy.getDate() + offset);
  return isoDate(copy);
}

export function parseDay(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function daysUntil(iso, from = new Date()) {
  const start = parseDay(isoDate(from)).getTime();
  const end = parseDay(iso).getTime();
  return Math.round((end - start) / 86400000);
}

export function formatDay(iso, options = { month: "short", day: "numeric" }) {
  return parseDay(iso).toLocaleDateString("en-US", options);
}

export function formatStamp(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function initials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function luhnOk(number) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function cardBrand(number) {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

export function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function sharesForEqual(amount, participantIds) {
  const count = participantIds.length || 1;
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  const shares = {};
  participantIds.forEach((id, index) => {
    shares[id] = base + (index < remainder ? 1 : 0);
  });
  return shares;
}

export function dueStatus(dueDate, remainingCents) {
  if (!dueDate || remainingCents <= 0) return { kind: "clear", label: "Settled" };
  const days = daysUntil(dueDate);
  if (days < 0) return { kind: "overdue", label: `${Math.abs(days)}d overdue`, days };
  if (days === 0) return { kind: "due", label: "Due today", days };
  if (days <= 3) return { kind: "soon", label: `Due in ${days}d`, days };
  return { kind: "open", label: `Due ${formatDay(dueDate)}`, days };
}

export function reminderWindow(dueDate) {
  if (!dueDate) return false;
  const days = daysUntil(dueDate);
  return days >= 0 && days <= 3;
}
