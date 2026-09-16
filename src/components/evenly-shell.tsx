"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AddExpenseDrawer } from "@/components/add-expense-drawer";
import { BalancesPanel } from "@/components/balances-panel";
import { ExpensesFeed } from "@/components/expenses-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyToClipboard } from "@/lib/copy";
import { money, moneyAbs } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export function EvenlyShell() {
  const { group, net, youOwe, youAreOwed } = useEvenly();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const invite = async () => {
    const copied = await copyToClipboard(group.inviteUrl);
    if (copied) {
      toast.success("Invite link copied", {
        description: group.inviteUrl,
      });
      return;
    }
    toast.message("Invite link", {
      description: group.inviteUrl,
    });
  };

  const owed = net > 0;
  const owes = net < 0;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-xl sm:px-6">
      <header className="flex items-center gap-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[1.35rem] leading-none tracking-tight text-emerald-400">
            evenly
          </p>
          <h1 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-slate-200">
            {group.name}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={invite}
          className="h-11 min-h-11 shrink-0 rounded-full border-white/10 bg-white/4 px-4 text-sm font-semibold text-slate-100 hover:bg-white/8"
        >
          <UserPlus className="size-4" />
          Invite Friends
        </Button>
      </header>

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
        <div className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-emerald-500/15 blur-3xl" />
        <p className="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
          Your Net Balance
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <p
            className={`font-heading text-4xl leading-none tracking-tight tabular-nums sm:text-5xl ${
              owed ? "text-emerald-400" : owes ? "text-red-400" : "text-slate-300"
            }`}
          >
            {money(net)}
          </p>
          <Badge
            className={`h-8 min-h-8 rounded-full px-3 text-sm font-semibold ${
              owed
                ? "bg-emerald-500/15 text-emerald-300"
                : owes
                  ? "bg-red-500/15 text-red-300"
                  : "bg-slate-500/20 text-slate-300"
            }`}
          >
            {owed ? "You are owed" : owes ? "You owe" : "Settled up"}
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 px-3 py-3">
            <p className="text-xs text-slate-400">You owe</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-red-400">
              {moneyAbs(youOwe)}
            </p>
          </div>
          <div className="rounded-2xl bg-black/20 px-3 py-3">
            <p className="text-xs text-slate-400">You are owed</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">
              {moneyAbs(youAreOwed)}
            </p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="feed" className="mt-6 gap-4">
        <TabsList className="h-14 min-h-14 w-full rounded-2xl bg-white/5 p-1">
          <TabsTrigger
            value="feed"
            className="h-11 min-h-11 rounded-xl px-3 text-sm font-semibold data-active:bg-slate-800 data-active:text-white"
          >
            Expenses Feed
          </TabsTrigger>
          <TabsTrigger
            value="balances"
            className="h-11 min-h-11 rounded-xl px-3 text-sm font-semibold data-active:bg-slate-800 data-active:text-white"
          >
            Balances & Settle
          </TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="outline-none">
          <ExpensesFeed />
        </TabsContent>
        <TabsContent value="balances" className="outline-none">
          <BalancesPanel />
        </TabsContent>
      </Tabs>

      <button
        type="button"
        aria-label="Add expense"
        onClick={() => setDrawerOpen(true)}
        className="fixed right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex size-14 min-h-14 min-w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_12px_40px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
      >
        <Plus className="size-7" strokeWidth={2.4} />
      </button>

      <AddExpenseDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
