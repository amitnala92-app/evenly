import { daysUntil } from "./util.js";

export function pairwiseNet(fromId, toId, expenses, settlements) {
  let cents = 0;
  for (const expense of expenses) {
    if (expense.paidById === toId) cents += expense.shares[fromId] || 0;
    if (expense.paidById === fromId) cents -= expense.shares[toId] || 0;
  }
  for (const settlement of settlements) {
    if (settlement.fromId === fromId && settlement.toId === toId) cents -= settlement.amount;
    if (settlement.fromId === toId && settlement.toId === fromId) cents += settlement.amount;
  }
  return cents;
}

export function openShares(fromId, toId, expenses, settlements) {
  const items = expenses
    .filter((expense) => expense.paidById === toId && fromId !== toId && (expense.shares[fromId] || 0) > 0)
    .map((expense) => ({
      expense,
      remaining: expense.shares[fromId],
    }))
    .sort((a, b) => (a.expense.dueDate || "9999-12-31").localeCompare(b.expense.dueDate || "9999-12-31"));

  let paid = settlements
    .filter((settlement) => settlement.fromId === fromId && settlement.toId === toId)
    .reduce((sum, settlement) => sum + settlement.amount, 0);

  for (const item of items) {
    const applied = Math.min(item.remaining, paid);
    item.remaining -= applied;
    paid -= applied;
  }

  return items.filter((item) => item.remaining > 0);
}

export function friendSummaries(currentId, users, expenses, settlements) {
  return users
    .filter((user) => user.id !== currentId)
    .map((user) => {
      const theyOwe = pairwiseNet(user.id, currentId, expenses, settlements);
      const youOwe = pairwiseNet(currentId, user.id, expenses, settlements);
      const net = theyOwe; // positive: they owe you
      const openToYou = openShares(user.id, currentId, expenses, settlements);
      const openFromYou = openShares(currentId, user.id, expenses, settlements);
      const soonest = [...openToYou, ...openFromYou]
        .map((item) => item.expense.dueDate)
        .filter(Boolean)
        .sort()[0];
      return {
        user,
        net,
        youOwe: Math.max(youOwe, 0),
        theyOwe: Math.max(theyOwe, 0),
        openToYou,
        openFromYou,
        soonest,
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

export function totalsFor(currentId, users, expenses, settlements) {
  const rows = friendSummaries(currentId, users, expenses, settlements);
  const youOwe = rows.reduce((sum, row) => sum + row.youOwe, 0);
  const youAreOwed = rows.reduce((sum, row) => sum + row.theyOwe, 0);
  return { youOwe, youAreOwed, net: youAreOwed - youOwe, rows };
}

export function groupBalances(group, currentId, expenses, settlements) {
  const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
  return group.memberIds
    .filter((id) => id !== currentId)
    .map((id) => ({
      id,
      net: pairwiseNet(id, currentId, groupExpenses, settlements),
    }));
}

export function creditScore(userId, expenses, settlements, reports) {
  let score = 760;
  const against = reports.filter((report) => report.subjectId === userId);
  score -= against.filter((report) => report.status === "filed").length * 48;
  score -= against.filter((report) => report.status === "resolved").length * 12;
  score -= against.filter((report) => report.status === "disputed").length * 20;

  const payers = new Set(expenses.filter((expense) => expense.paidById !== userId).map((expense) => expense.paidById));
  for (const payerId of payers) {
    const open = openShares(userId, payerId, expenses, settlements);
    for (const item of open) {
      if (item.expense.dueDate && daysUntil(item.expense.dueDate) < 0) score -= 8;
    }
  }

  const onTime = settlements.filter((settlement) => settlement.fromId === userId && settlement.onTime);
  score += onTime.length * 4;
  return Math.max(300, Math.min(850, score));
}

export function scoreBand(score) {
  if (score >= 780) return { label: "Excellent", tone: "good" };
  if (score >= 720) return { label: "Strong", tone: "good" };
  if (score >= 660) return { label: "Fair", tone: "warn" };
  return { label: "At risk", tone: "bad" };
}

export function reportableDebts(reporterId, subjectId, expenses, settlements, reports) {
  const open = openShares(subjectId, reporterId, expenses, settlements).filter((item) => {
    return item.expense.dueDate && daysUntil(item.expense.dueDate) < 0;
  });
  const already = new Set(
    reports
      .filter((report) => report.reporterId === reporterId && report.subjectId === subjectId && report.status !== "resolved")
      .flatMap((report) => report.expenseIds)
  );
  return open.filter((item) => !already.has(item.expense.id));
}

export function wasOnTime(fromId, toId, amount, expenses, settlementsBefore, paidAtIso) {
  const open = openShares(fromId, toId, expenses, settlementsBefore);
  const due = open.map((item) => item.expense.dueDate).filter(Boolean).sort()[0];
  if (!due) return true;
  return paidAtIso.slice(0, 10) <= due;
}
