import {
  createDemoData,
  getGroupTotalSpend,
  getSuggestedTransfers,
  getUserNetBalance,
  splitEqualCents,
} from "./useExpenseStore";

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

const remainder = splitEqualCents(1000, ["a", "b", "c"]);
assertEqual(
  remainder.reduce((sum, row) => sum + row.owedAmountCents, 0),
  1000,
  "remainder split sums to total"
);
assertEqual(remainder[0]?.owedAmountCents ?? 0, 334, "first share gets leftover cent");
assertEqual(remainder[1]?.owedAmountCents ?? 0, 333, "second share");
assertEqual(remainder[2]?.owedAmountCents ?? 0, 333, "third share");

const demo = createDemoData();
assertEqual(getGroupTotalSpend(demo), 48400, "group spend is 360+84+40");
assertEqual(getUserNetBalance(demo, "user-you"), 22900, "You net +$229");
assertEqual(getUserNetBalance(demo, "user-alex"), -2700, "Alex net -$27");
assertEqual(getUserNetBalance(demo, "user-jordan"), -9100, "Jordan net -$91");
assertEqual(getUserNetBalance(demo, "user-sam"), -11100, "Sam net -$111");

const nets = ["user-you", "user-alex", "user-jordan", "user-sam"].map((id) =>
  getUserNetBalance(demo, id)
);
assertEqual(
  nets.reduce((sum, value) => sum + value, 0),
  0,
  "group nets sum to zero"
);

const transfers = getSuggestedTransfers(demo);
assertEqual(
  transfers.reduce((sum, row) => sum + row.amountCents, 0),
  22900,
  "suggested transfers cover the creditor"
);

console.log("ledger invariants ok");
