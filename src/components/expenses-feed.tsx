"use client";

import {
  Flame,
  Home,
  Receipt,
  Ship,
  ShoppingBasket,
  Wine,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { firstName, formatStamp, initials, moneyAbs } from "@/lib/format";
import { useEvenly } from "@/lib/store";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  stay: Home,
  home: Flame,
  food: Wine,
  groceries: ShoppingBasket,
  travel: Ship,
  general: Receipt,
};

export function ExpensesFeed() {
  const { expenses, members, currentUser } = useEvenly();

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-white/6 bg-card/60 px-5 py-12 text-center">
        <p className="font-medium text-foreground">No expenses yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap + to add the first split for this trip.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => {
        const payer = members.find((user) => user.id === expense.paidById);
        const Icon = CATEGORY_ICONS[expense.category] ?? Receipt;
        const yourShare = expense.shares[currentUser.id] || 0;
        const youPaid = expense.paidById === currentUser.id;
        return (
          <li
            key={expense.id}
            className="rounded-2xl border border-white/6 bg-card/80 p-4 shadow-[0_8px_30px_rgba(2,6,23,0.28)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/4 text-emerald-400">
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight">
                      {expense.description}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {payer ? firstName(payer.name) : "Someone"} paid{" "}
                      {moneyAbs(expense.amount)}
                    </p>
                  </div>
                  <p className="text-right text-[15px] font-semibold tabular-nums tracking-tight">
                    {moneyAbs(expense.amount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="size-6">
                      <AvatarFallback
                        className="text-[10px] font-semibold text-white"
                        style={{ background: payer?.color }}
                      >
                        {payer ? initials(payer.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {formatStamp(expense.createdAt)} · split{" "}
                      {expense.participantIds.length}
                    </span>
                  </div>
                  <span
                    className={
                      youPaid
                        ? "text-xs font-medium text-emerald-400"
                        : "text-xs font-medium text-muted-foreground"
                    }
                  >
                    {youPaid
                      ? `You lent ${moneyAbs(expense.amount - yourShare)}`
                      : `Your share ${moneyAbs(yourShare)}`}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
