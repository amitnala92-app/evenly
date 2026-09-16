"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { firstName, parseAmount } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export function AddExpenseDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { members, currentUser, addExpense } = useEvenly();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentUser.id);
  const [splitIds, setSplitIds] = useState<string[]>(
    members.map((user) => user.id)
  );

  const reset = () => {
    setDescription("");
    setAmount("");
    setPaidById(currentUser.id);
    setSplitIds(members.map((user) => user.id));
  };

  const cents = parseAmount(amount);
  const canSubmit =
    description.trim().length > 0 && cents > 0 && splitIds.length >= 1;

  const preview = useMemo(() => {
    if (cents <= 0 || splitIds.length === 0) return null;
    const share = Math.floor(cents / splitIds.length);
    return share;
  }, [cents, splitIds.length]);

  const toggleSplit = (id: string, checked: boolean) => {
    setSplitIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      if (prev.length === 1) return prev;
      return prev.filter((item) => item !== id);
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    addExpense({
      description: description.trim(),
      amount: cents,
      paidById,
      participantIds: splitIds,
    });
    toast.success("Expense added to Cabin Trip");
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      showSwipeHandle
    >
      <DrawerContent className="bg-[#111827] text-foreground">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="items-start px-5 pt-2 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-left font-heading text-xl tracking-tight">
              Add expense
            </DrawerTitle>
            <DrawerDescription className="text-left">
              Split a new charge across Cabin Trip.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Dinner, gas, cabin snacks…"
                className="h-11 min-h-11 bg-white/4 text-base md:text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="h-11 min-h-11 bg-white/4 pl-7 text-base tabular-nums md:text-base"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Paid by</Label>
              <Select
                value={paidById}
                onValueChange={(value) => {
                  if (typeof value === "string") setPaidById(value);
                }}
              >
                <SelectTrigger className="h-11 min-h-11 w-full bg-white/4">
                  <span className="flex-1 truncate text-left">
                    {paidById === currentUser.id
                      ? `${firstName(currentUser.name)} (you)`
                      : (members.find((user) => user.id === paidById)?.name ??
                        "Select who paid")}
                  </span>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="bg-[#1E293B]"
                >
                  {members.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="min-h-11"
                    >
                      {user.id === currentUser.id
                        ? `${firstName(user.name)} (you)`
                        : user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Split equally</Label>
                {preview != null && (
                  <span className="text-xs text-muted-foreground">
                    {(preview / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    each
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                {members.map((user) => {
                  const checked = splitIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleSplit(user.id, value === true)
                        }
                        className="size-5"
                      />
                      <span className="text-sm font-medium">
                        {user.id === currentUser.id
                          ? `${firstName(user.name)} (you)`
                          : user.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DrawerFooter className="px-5 pb-6">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 min-h-12 rounded-xl bg-emerald-500 text-[15px] font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Save expense
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
