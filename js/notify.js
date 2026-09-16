import { daysUntil, formatDay, moneyPlain, reminderWindow, uid } from "./util.js";
import { friendSummaries } from "./balances.js";
import { addNotifications, currentUser, getState, rememberNotified } from "./store.js";

export function refreshReminders() {
  const state = getState();
  const me = currentUser();
  if (!me) return [];
  const today = new Date().toISOString().slice(0, 10);
  const rows = friendSummaries(me.id, state.users, state.expenses, state.settlements);
  const items = [];

  for (const row of rows) {
    for (const open of row.openFromYou) {
      const due = open.expense.dueDate;
      if (!due) continue;
      const days = daysUntil(due);
      if (days < 0) {
        pushItem(items, state, {
          key: `overdue:${open.expense.id}:${me.id}:${today}`,
          type: "overdue",
          title: "Payment overdue",
          body: `${open.expense.description} to ${row.user.name} is ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} late (${moneyPlain(open.remaining)}).`,
          relatedUserId: row.user.id,
          relatedExpenseId: open.expense.id,
        });
      } else if (reminderWindow(due)) {
        const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        pushItem(items, state, {
          key: `due:${open.expense.id}:${me.id}:${today}`,
          type: "due_soon",
          title: "Repayment reminder",
          body: `${open.expense.description} is due ${when} (${formatDay(due)}). ${moneyPlain(open.remaining)} still open with ${row.user.name}.`,
          relatedUserId: row.user.id,
          relatedExpenseId: open.expense.id,
        });
      }
    }

    for (const open of row.openToYou) {
      const due = open.expense.dueDate;
      if (!due) continue;
      const days = daysUntil(due);
      if (days < 0) {
        pushItem(items, state, {
          key: `collect:${open.expense.id}:${me.id}:${today}`,
          type: "overdue",
          title: "Unpaid split",
          body: `${row.user.name} still owes ${moneyPlain(open.remaining)} for ${open.expense.description}. You can file an Evenly Credit report.`,
          relatedUserId: row.user.id,
          relatedExpenseId: open.expense.id,
        });
      } else if (reminderWindow(due)) {
        pushItem(items, state, {
          key: `wait:${open.expense.id}:${me.id}:${today}`,
          type: "due_soon",
          title: "Incoming repayment",
          body: `${row.user.name}'s share of ${open.expense.description} is due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}.`,
          relatedUserId: row.user.id,
          relatedExpenseId: open.expense.id,
        });
      }
    }
  }

  addNotifications(items);
  return items;
}

function pushItem(items, state, payload) {
  if (state.notifiedKeys[payload.key]) return;
  items.push({
    id: uid("ntf"),
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  });
}

export async function enablePush() {
  if (!("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  return permission;
}

export function sendBrowserPushes(items) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const state = getState();
  for (const item of items.slice(0, 3)) {
    const pushKey = `push:${item.key}`;
    if (state.notifiedKeys[pushKey]) continue;
    try {
      new Notification(item.title, { body: item.body, icon: "/favicon.svg" });
      rememberNotified(pushKey);
    } catch {
      // Safari private mode and some desktop embeds block this.
    }
  }
}

export function dueTimeline(dueDate, createdAt) {
  if (!dueDate) return [];
  const created = (createdAt || "").slice(0, 10);
  const remindStart = shiftIso(dueDate, -3);
  return [
    { label: "Split created", date: created, tone: "muted" },
    { label: "Reminders begin", date: remindStart, tone: "gold" },
    { label: "Due date", date: dueDate, tone: "ink" },
  ];
}

function shiftIso(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + days, 12, 0, 0, 0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
