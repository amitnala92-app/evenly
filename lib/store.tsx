import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { totalsFor } from "@/lib/balances";
import { sharesForEqual, uid } from "@/lib/format";
import { GROUPS, createSeed } from "@/lib/seed";
import type { AddExpenseInput, EvenlyState, Group } from "@/lib/types";

type EvenlyStore = EvenlyState & {
  net: number;
  youOwe: number;
  youAreOwed: number;
  transfers: ReturnType<typeof totalsFor>["transfers"];
  currentUser: EvenlyState["users"][number];
  members: EvenlyState["users"];
  groups: readonly (typeof GROUPS)[number][];
  addExpense: (input: AddExpenseInput) => void;
  settleTransfer: (fromId: string, toId: string, amount: number) => void;
  selectGroup: (groupId: string) => void;
};

const EvenlyContext = createContext<EvenlyStore | null>(null);

export function EvenlyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EvenlyState>(createSeed);

  const addExpense = useCallback((input: AddExpenseInput) => {
    const participantIds = Array.from(
      new Set(
        input.participantIds.includes(input.paidById)
          ? input.participantIds
          : [input.paidById, ...input.participantIds]
      )
    );
    const expense = {
      id: uid("exp"),
      description: input.description.trim(),
      amount: input.amount,
      paidById: input.paidById,
      participantIds,
      shares: sharesForEqual(input.amount, participantIds),
      createdAt: new Date().toISOString(),
      category: input.category || "general",
    };
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
  }, []);

  const settleTransfer = useCallback(
    (fromId: string, toId: string, amount: number) => {
      if (amount <= 0) return;
      setState((prev) => ({
        ...prev,
        settlements: [
          {
            id: uid("set"),
            fromId,
            toId,
            amount,
            createdAt: new Date().toISOString(),
          },
          ...prev.settlements,
        ],
      }));
    },
    []
  );

  const selectGroup = useCallback((groupId: string) => {
    const next = GROUPS.find((group) => group.id === groupId);
    if (!next) return;
    setState((prev) => ({
      ...prev,
      group: {
        ...prev.group,
        id: next.id,
        name: next.name,
        slug: next.slug,
        inviteUrl: next.inviteUrl,
      } satisfies Group,
    }));
  }, []);

  const value = useMemo<EvenlyStore>(() => {
    const members = state.group.memberIds
      .map((id) => state.users.find((user) => user.id === id))
      .filter((user): user is EvenlyState["users"][number] => Boolean(user));
    const currentUser =
      state.users.find((user) => user.id === state.sessionUserId) ?? members[0];
    if (!currentUser) {
      throw new Error("Evenly requires at least one group member");
    }
    const summary = totalsFor(
      currentUser.id,
      members,
      state.expenses,
      state.settlements
    );
    return {
      ...state,
      ...summary,
      currentUser,
      members,
      groups: GROUPS,
      addExpense,
      settleTransfer,
      selectGroup,
    };
  }, [addExpense, selectGroup, settleTransfer, state]);

  return (
    <EvenlyContext.Provider value={value}>{children}</EvenlyContext.Provider>
  );
}

export function useEvenly() {
  const ctx = useContext(EvenlyContext);
  if (!ctx) {
    throw new Error("useEvenly must be used within EvenlyProvider");
  }
  return ctx;
}
