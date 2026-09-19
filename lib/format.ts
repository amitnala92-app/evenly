export function money(cents: number) {
  const value = Number.isInteger(cents) ? cents : 0;
  const formatted = moneyAbs(value);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function moneyAbs(cents: number) {
  const value = Math.abs(Number.isInteger(cents) ? cents : 0);
  const dollars = Math.trunc(value / 100);
  const fraction = value - dollars * 100;
  return `$${dollars.toLocaleString("en-US")}.${String(fraction).padStart(2, "0")}`;
}

export function parseAmount(input: string) {
  const cleaned = String(input ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const [wholeRaw, fractionRaw = ""] = cleaned.split(".");
  const whole = Number.parseInt(wholeRaw || "0", 10);
  const fraction = Number.parseInt((fractionRaw + "00").slice(0, 2), 10);
  if (!Number.isInteger(whole) || !Number.isInteger(fraction)) return 0;
  return whole * 100 + fraction;
}

export function digitsToCents(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const cents = Number.parseInt(digits, 10);
  return Number.isInteger(cents) ? cents : 0;
}

export function formatCentsInput(cents: number): string {
  const value = Number.isInteger(cents) && cents > 0 ? cents : 0;
  const dollars = Math.trunc(value / 100);
  const fraction = value - dollars * 100;
  return `${dollars}.${String(fraction).padStart(2, "0")}`;
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
  return `${prefix}_${Math.trunc(Math.random() * 1_000_000).toString(36)}${Date.now().toString(36)}`;
}
