"use client";

import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { firstName, initials, moneyAbs } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export function BalancesPanel() {
  const { transfers, members, currentUser, settleTransfer } = useEvenly();

  if (transfers.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-12 text-center">
        <p className="font-medium text-emerald-400">All settled</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nobody in Cabin Trip owes anyone right now.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {transfers.map((transfer) => {
        const from = members.find((user) => user.id === transfer.fromId);
        const to = members.find((user) => user.id === transfer.toId);
        if (!from || !to) return null;
        const youPay = transfer.fromId === currentUser.id;
        const youReceive = transfer.toId === currentUser.id;
        return (
          <li
            key={`${transfer.fromId}-${transfer.toId}-${transfer.amount}`}
            className="rounded-2xl border border-white/6 bg-card/80 p-4 shadow-[0_8px_30px_rgba(2,6,23,0.28)]"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: from.color }}
                >
                  {initials(from.name)}
                </AvatarFallback>
              </Avatar>
              <ArrowRight
                className="size-4 shrink-0 text-slate-500"
                aria-hidden
              />
              <Avatar className="size-11">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: to.color }}
                >
                  {initials(to.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-tight">
                  {youPay ? "You" : firstName(from.name)} owe
                  {youPay ? "" : "s"} {youReceive ? "you" : firstName(to.name)}
                </p>
                <p
                  className={`mt-0.5 text-sm font-medium tabular-nums ${
                    youPay
                      ? "text-red-400"
                      : youReceive
                        ? "text-emerald-400"
                        : "text-slate-400"
                  }`}
                >
                  {moneyAbs(transfer.amount)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className={`mt-4 h-11 min-h-11 w-full rounded-xl text-[15px] font-semibold ${
                youPay || youReceive
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : "border border-white/10 bg-white/6 text-foreground hover:bg-white/10"
              }`}
              onClick={() => {
                settleTransfer(transfer.fromId, transfer.toId, transfer.amount);
                toast.success(
                  `Recorded ${moneyAbs(transfer.amount)} from ${firstName(from.name)} to ${firstName(to.name)}`
                );
              }}
            >
              <Check className="size-4" />
              Settle
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
