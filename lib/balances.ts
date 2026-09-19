import type { Expense, Settlement, Transfer, User } from "@/lib/types";

export function personNet(
  userId: string,
  expenses: Expense[],
  settlements: Settlement[]
) {
  let net = 0;
  for (const expense of expenses) {
    if (expense.paidById === userId) net += expense.amount;
    net -= expense.shares[userId] ?? 0;
  }
  for (const settlement of settlements) {
    if (settlement.fromId === userId) net += settlement.amount;
    if (settlement.toId === userId) net -= settlement.amount;
  }
  return net;
}

export function simplifyDebts(
  users: User[],
  expenses: Expense[],
  settlements: Settlement[]
): Transfer[] {
  const nets = users
    .map((user) => ({
      id: user.id,
      net: personNet(user.id, expenses, settlements),
    }))
    .filter((row) => row.net !== 0);

  const creditors = nets
    .filter((row) => row.net > 0)
    .map((row) => ({ ...row }))
    .sort((a, b) => b.net - a.net);
  const debtors = nets
    .filter((row) => row.net < 0)
    .map((row) => ({ ...row, net: -row.net }))
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(debtor.net, creditor.net);
    if (amount > 0) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount,
      });
      debtor.net -= amount;
      creditor.net -= amount;
    }
    if (debtor.net === 0) i += 1;
    if (creditor.net === 0) j += 1;
  }
  return transfers;
}

export function totalsFor(
  currentId: string,
  users: User[],
  expenses: Expense[],
  settlements: Settlement[]
) {
  const transfers = simplifyDebts(users, expenses, settlements);
  const youOwe = transfers
    .filter((row) => row.fromId === currentId)
    .reduce((sum, row) => sum + row.amount, 0);
  const youAreOwed = transfers
    .filter((row) => row.toId === currentId)
    .reduce((sum, row) => sum + row.amount, 0);
  return {
    youOwe,
    youAreOwed,
    net: youAreOwed - youOwe,
    transfers,
  };
}
