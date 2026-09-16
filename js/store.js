import { createSeed } from "./seed.js";
import { uid } from "./util.js";
import { wasOnTime } from "./balances.js";

const KEY = "evenly.v1";

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeed();
    const parsed = JSON.parse(raw);
    if (!parsed?.users?.length) return createSeed();
    return parsed;
  } catch {
    return createSeed();
  }
}

function commit(next) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetDemo() {
  localStorage.removeItem(KEY);
  commit(createSeed());
}

export function startSession(userId = "u1") {
  commit({ ...state, sessionUserId: userId });
}

export function switchUser(userId) {
  commit({ ...state, sessionUserId: userId });
}

export function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) ?? null;
}

export function addExpense(input) {
  const expense = {
    id: uid("exp"),
    description: input.description,
    amount: input.amount,
    paidById: input.paidById,
    participantIds: input.participantIds,
    shares: input.shares,
    groupId: input.groupId || null,
    category: input.category || "general",
    dueDate: input.dueDate || null,
    createdAt: new Date().toISOString(),
  };
  const me = currentUser();
  commit({
    ...state,
    expenses: [expense, ...state.expenses],
    activity: [
      {
        id: uid("act"),
        text: `${me?.name ?? "Someone"} added ${expense.description}`,
        createdAt: expense.createdAt,
      },
      ...state.activity,
    ],
  });
  return expense;
}

export function addSettlement(input) {
  const createdAt = new Date().toISOString();
  const onTime = wasOnTime(
    input.fromId,
    input.toId,
    input.amount,
    state.expenses,
    state.settlements,
    createdAt
  );
  const settlement = {
    id: uid("set"),
    fromId: input.fromId,
    toId: input.toId,
    amount: input.amount,
    method: input.method,
    last4: input.last4 || null,
    brand: input.brand || null,
    createdAt,
    onTime,
  };
  const from = state.users.find((user) => user.id === input.fromId);
  const to = state.users.find((user) => user.id === input.toId);
  const reports = state.reports.map((report) => {
    if (report.subjectId !== input.fromId || report.reporterId !== input.toId || report.status === "resolved") {
      return report;
    }
    return { ...report, status: "resolved", resolvedAt: createdAt };
  });
  commit({
    ...state,
    settlements: [settlement, ...state.settlements],
    reports,
    activity: [
      {
        id: uid("act"),
        text: `${from?.name ?? "Someone"} paid ${to?.name ?? "a friend"} via ${labelMethod(input.method)}`,
        createdAt,
      },
      ...state.activity,
    ],
  });
  return settlement;
}

export function fileReport(input) {
  const report = {
    id: uid("rep"),
    reporterId: input.reporterId,
    subjectId: input.subjectId,
    amount: input.amount,
    reason: input.reason,
    expenseIds: input.expenseIds,
    status: "filed",
    filedAt: new Date().toISOString(),
  };
  const reporter = state.users.find((user) => user.id === input.reporterId);
  const subject = state.users.find((user) => user.id === input.subjectId);
  commit({
    ...state,
    reports: [report, ...state.reports],
    activity: [
      {
        id: uid("act"),
        text: `${reporter?.name ?? "Someone"} filed an Evenly Credit report on ${subject?.name ?? "a user"}`,
        createdAt: report.filedAt,
      },
      ...state.activity,
    ],
    notifications: [
      {
        id: uid("ntf"),
        type: "credit_report",
        title: "Credit report filed",
        body: `${reporter?.name ?? "A friend"} filed a late-payment report against ${subject?.name ?? "a user"}.`,
        createdAt: report.filedAt,
        read: false,
        relatedUserId: input.subjectId,
      },
      ...state.notifications,
    ],
  });
  return report;
}

export function disputeReport(reportId) {
  commit({
    ...state,
    reports: state.reports.map((report) =>
      report.id === reportId ? { ...report, status: "disputed" } : report
    ),
  });
}

export function addNotifications(items) {
  if (!items.length) return;
  const existing = new Set(state.notifications.map((item) => item.key).filter(Boolean));
  const fresh = items.filter((item) => !item.key || !existing.has(item.key));
  if (!fresh.length) return;
  commit({
    ...state,
    notifications: [...fresh, ...state.notifications],
    notifiedKeys: {
      ...state.notifiedKeys,
      ...Object.fromEntries(fresh.filter((item) => item.key).map((item) => [item.key, true])),
    },
  });
}

export function markNotificationsRead() {
  if (state.notifications.every((item) => item.read)) return;
  commit({
    ...state,
    notifications: state.notifications.map((item) => ({ ...item, read: true })),
  });
}

export function rememberNotified(key) {
  commit({
    ...state,
    notifiedKeys: { ...state.notifiedKeys, [key]: true },
  });
}

function labelMethod(method) {
  if (method === "card") return "card";
  if (method === "debit") return "debit";
  return "cash";
}
