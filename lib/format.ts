export function money(cents: number) {
  const amount = (Number(cents) || 0) / 100;
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function moneyAbs(cents: number) {
  return Math.abs((Number(cents) || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function parseAmount(input: string) {
  const cleaned = String(input ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  return Math.round(Number(cleaned) * 100);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

export function formatStamp(iso: string) {
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

export function sharesForEqual(amount: number, participantIds: string[]) {
  const count = participantIds.length || 1;
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  const shares: Record<string, number> = {};
  participantIds.forEach((id, index) => {
    shares[id] = base + (index < remainder ? 1 : 0);
  });
  return shares;
}
