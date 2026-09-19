import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const CABIN_GROUP_ID = "group-cabin";

export type SplitType = "EQUAL" | "EXACT" | "ITEMIZED";
export type PaymentMethod = "CASH" | "VENMO" | "CARD" | "UPI";

export type User = {
  id: string;
  name: string;
  avatar: string;
  isCurrentUser: boolean;
  venmoHandle?: string;
  upiId?: string;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  totalAmountCents: number;
  paidByUserId: string;
  splitType: SplitType;
  expenseDate: string;
  receiptUrl?: string;
};

export type ExpenseSplit = {
  expenseId: string;
  userId: string;
  owedAmountCents: number;
};

export type Settlement = {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  status: "COMPLETED";
  settledAt: string;
};

export type Transfer = {
  fromId: string;
  toId: string;
  amountCents: number;
};

export type AddExpenseInput = {
  groupId?: string;
  description: string;
  totalAmountCents: number;
  paidByUserId: string;
  splitType: SplitType;
  expenseDate?: string;
  receiptUrl?: string;
  participantUserIds?: string[];
  splits?: Array<{ userId: string; owedAmountCents: number }>;
};

export type RecordSettlementInput = {
  groupId?: string;
  payerId: string;
  payeeId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
};

export type ExpenseLedger = {
  users: User[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
};

type ExpenseStore = ExpenseLedger & {
  getUserNetBalance: (userId: string) => number;
  getGroupTotalSpend: (groupId?: string) => number;
  getSuggestedTransfers: (groupId?: string) => Transfer[];
  addExpense: (input: AddExpenseInput) => Expense;
  recordSettlement: (input: RecordSettlementInput) => Settlement;
  resetDemoData: () => void;
};

function assertIntegerCents(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number of cents`);
  }
  return value;
}

function newId(prefix: string): string {
  const rand = Math.trunc(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  const tick = Date.now().toString(36);
  return `${prefix}_${tick}${rand}`;
}

export function splitEqualCents(
  totalAmountCents: number,
  userIds: string[]
): Array<{ userId: string; owedAmountCents: number }> {
  const total = assertIntegerCents(totalAmountCents, "totalAmountCents");
  if (userIds.length === 0) {
    throw new Error("EQUAL splits require at least one participant");
  }
  const count = userIds.length;
  const base = Math.trunc(total / count);
  const remainder = total - base * count;
  return userIds.map((userId, index) => ({
    userId,
    owedAmountCents: base + (index < remainder ? 1 : 0),
  }));
}

export function getUserNetBalance(
  ledger: ExpenseLedger,
  userId: string,
  groupId?: string
): number {
  const expenses = groupId
    ? ledger.expenses.filter((expense) => expense.groupId === groupId)
    : ledger.expenses;
  const expenseIds = new Set(expenses.map((expense) => expense.id));
  const splits = ledger.splits.filter((split) => expenseIds.has(split.expenseId));
  const settlements = groupId
    ? ledger.settlements.filter((row) => row.groupId === groupId)
    : ledger.settlements;

  let paid = 0;
  let owed = 0;

  for (const expense of expenses) {
    if (expense.paidByUserId === userId) {
      paid += assertIntegerCents(expense.totalAmountCents, "totalAmountCents");
    }
  }
  for (const split of splits) {
    if (split.userId === userId) {
      owed += assertIntegerCents(split.owedAmountCents, "owedAmountCents");
    }
  }
  for (const settlement of settlements) {
    const amount = assertIntegerCents(settlement.amountCents, "amountCents");
    if (settlement.payerId === userId) paid += amount;
    if (settlement.payeeId === userId) owed += amount;
  }

  return paid - owed;
}

export function getGroupTotalSpend(
  ledger: ExpenseLedger,
  groupId: string = CABIN_GROUP_ID
): number {
  let total = 0;
  for (const expense of ledger.expenses) {
    if (expense.groupId !== groupId) continue;
    total += assertIntegerCents(expense.totalAmountCents, "totalAmountCents");
  }
  return total;
}

export function getSuggestedTransfers(
  ledger: ExpenseLedger,
  groupId: string = CABIN_GROUP_ID
): Transfer[] {
  const nets = ledger.users
    .map((user) => ({
      id: user.id,
      net: getUserNetBalance(ledger, user.id, groupId),
    }))
    .filter((row) => row.net !== 0);

  const creditors = nets
    .filter((row) => row.net > 0)
    .map((row) => ({ ...row }))
    .sort((a, b) => b.net - a.net);
  const debtors = nets
    .filter((row) => row.net < 0)
    .map((row) => ({ id: row.id, net: -row.net }))
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amountCents = Math.min(debtor.net, creditor.net);
    if (amountCents > 0) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amountCents,
      });
      debtor.net -= amountCents;
      creditor.net -= amountCents;
    }
    if (debtor.net === 0) i += 1;
    if (creditor.net === 0) j += 1;
  }
  return transfers;
}

function buildSplits(
  expenseId: string,
  input: AddExpenseInput,
  users: User[]
): ExpenseSplit[] {
  if (input.splitType === "EQUAL") {
    const participantUserIds =
      input.participantUserIds && input.participantUserIds.length > 0
        ? input.participantUserIds
        : users.map((user) => user.id);
    return splitEqualCents(input.totalAmountCents, participantUserIds).map(
      (row) => ({
        expenseId,
        userId: row.userId,
        owedAmountCents: row.owedAmountCents,
      })
    );
  }

  const rows = input.splits ?? [];
  if (rows.length === 0) {
    throw new Error(`${input.splitType} splits require explicit owed amounts`);
  }
  let sum = 0;
  const splits = rows.map((row) => {
    const owedAmountCents = assertIntegerCents(
      row.owedAmountCents,
      "owedAmountCents"
    );
    sum += owedAmountCents;
    return {
      expenseId,
      userId: row.userId,
      owedAmountCents,
    };
  });
  if (sum !== input.totalAmountCents) {
    throw new Error("Split amounts must sum to the expense total");
  }
  return splits;
}

export function createDemoData(): ExpenseLedger {
  const users: User[] = [
    {
      id: "user-you",
      name: "You",
      avatar: "#38BDF8",
      isCurrentUser: true,
      venmoHandle: "@you",
    },
    {
      id: "user-alex",
      name: "Alex",
      avatar: "#10B981",
      isCurrentUser: false,
      venmoHandle: "@alex",
    },
    {
      id: "user-jordan",
      name: "Jordan",
      avatar: "#A78BFA",
      isCurrentUser: false,
      upiId: "jordan@oksbi",
    },
    {
      id: "user-sam",
      name: "Sam",
      avatar: "#F59E0B",
      isCurrentUser: false,
      venmoHandle: "@sam",
    },
  ];

  const allIds = users.map((user) => user.id);
  const youAndJordan = ["user-you", "user-jordan"];

  const expenses: Expense[] = [
    {
      id: "exp-airbnb",
      groupId: CABIN_GROUP_ID,
      description: "Airbnb Cabin",
      totalAmountCents: 36000,
      paidByUserId: "user-you",
      splitType: "EQUAL",
      expenseDate: "2026-09-11T09:00:00.000Z",
    },
    {
      id: "exp-groceries",
      groupId: CABIN_GROUP_ID,
      description: "Supermarket Groceries",
      totalAmountCents: 8400,
      paidByUserId: "user-alex",
      splitType: "EQUAL",
      expenseDate: "2026-09-12T11:20:00.000Z",
    },
    {
      id: "exp-gas",
      groupId: CABIN_GROUP_ID,
      description: "Highway Gas & Tolls",
      totalAmountCents: 4000,
      paidByUserId: "user-jordan",
      splitType: "EQUAL",
      expenseDate: "2026-09-13T16:40:00.000Z",
    },
  ];

  const splits: ExpenseSplit[] = [
    ...splitEqualCents(36000, allIds).map((row) => ({
      expenseId: "exp-airbnb",
      userId: row.userId,
      owedAmountCents: row.owedAmountCents,
    })),
    ...splitEqualCents(8400, allIds).map((row) => ({
      expenseId: "exp-groceries",
      userId: row.userId,
      owedAmountCents: row.owedAmountCents,
    })),
    ...splitEqualCents(4000, youAndJordan).map((row) => ({
      expenseId: "exp-gas",
      userId: row.userId,
      owedAmountCents: row.owedAmountCents,
    })),
  ];

  return {
    users,
    expenses,
    splits,
    settlements: [],
  };
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      ...createDemoData(),
      getUserNetBalance: (userId: string) =>
        getUserNetBalance(get(), userId, CABIN_GROUP_ID),
      getGroupTotalSpend: (groupId = CABIN_GROUP_ID) =>
        getGroupTotalSpend(get(), groupId),
      getSuggestedTransfers: (groupId = CABIN_GROUP_ID) =>
        getSuggestedTransfers(get(), groupId),
      addExpense: (input: AddExpenseInput) => {
        const totalAmountCents = assertIntegerCents(
          input.totalAmountCents,
          "totalAmountCents"
        );
        if (totalAmountCents <= 0) {
          throw new Error("Expense amount must be greater than zero cents");
        }
        const state = get();
        const payer = state.users.find((user) => user.id === input.paidByUserId);
        if (!payer) {
          throw new Error("paidByUserId must match a known user");
        }
        const expense: Expense = {
          id: newId("exp"),
          groupId: input.groupId ?? CABIN_GROUP_ID,
          description: input.description.trim(),
          totalAmountCents,
          paidByUserId: input.paidByUserId,
          splitType: input.splitType,
          expenseDate: input.expenseDate ?? new Date().toISOString(),
          receiptUrl: input.receiptUrl,
        };
        const splits = buildSplits(expense.id, input, state.users);
        set({
          expenses: [expense, ...state.expenses],
          splits: [...splits, ...state.splits],
        });
        return expense;
      },
      recordSettlement: (input: RecordSettlementInput) => {
        const amountCents = assertIntegerCents(input.amountCents, "amountCents");
        if (amountCents <= 0) {
          throw new Error("Settlement amount must be greater than zero cents");
        }
        if (input.payerId === input.payeeId) {
          throw new Error("Payer and payee must be different users");
        }
        const state = get();
        const known = new Set(state.users.map((user) => user.id));
        if (!known.has(input.payerId) || !known.has(input.payeeId)) {
          throw new Error("Settlement users must already exist");
        }
        const settlement: Settlement = {
          id: newId("set"),
          groupId: input.groupId ?? CABIN_GROUP_ID,
          payerId: input.payerId,
          payeeId: input.payeeId,
          amountCents,
          paymentMethod: input.paymentMethod,
          status: "COMPLETED",
          settledAt: new Date().toISOString(),
        };
        set({
          settlements: [settlement, ...state.settlements],
        });
        return settlement;
      },
      resetDemoData: () => set(createDemoData()),
    }),
    {
      name: "evenly-expense-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        users: state.users,
        expenses: state.expenses,
        splits: state.splits,
        settlements: state.settlements,
      }),
    }
  )
);

export function useCurrentUser(): User {
  const user = useExpenseStore((state) =>
    state.users.find((member) => member.isCurrentUser)
  );
  if (!user) {
    throw new Error("Evenly requires a current user");
  }
  return user;
}
