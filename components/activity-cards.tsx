import {
  Flame,
  Home,
  Receipt,
  Ship,
  ShoppingBasket,
  Wine,
  type LucideIcon,
} from "lucide-react-native";
import { Text, View } from "react-native";

import { firstName, formatStamp, moneyAbs } from "@/lib/format";
import type { Expense, Settlement, User } from "@/lib/types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  stay: Home,
  home: Flame,
  food: Wine,
  groceries: ShoppingBasket,
  travel: Ship,
  general: Receipt,
};

export function ExpenseCard({
  expense,
  members,
  currentUserId,
}: {
  expense: Expense;
  members: User[];
  currentUserId: string;
}) {
  const payer = members.find((user) => user.id === expense.paidById);
  const Icon = CATEGORY_ICONS[expense.category] ?? Receipt;
  const yourShare = expense.shares[currentUserId] ?? 0;
  const youPaid = expense.paidById === currentUserId;

  return (
    <View className="rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-background">
          <Icon color="#38BDF8" size={20} strokeWidth={2.1} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
                {expense.description}
              </Text>
              <Text className="mt-0.5 text-sm text-muted">
                {payer ? firstName(payer.name) : "Someone"} paid{" "}
                {moneyAbs(expense.amount)}
              </Text>
            </View>
            <Text className="text-[15px] font-semibold tabular-nums text-foreground">
              {moneyAbs(expense.amount)}
            </Text>
          </View>
          <View className="mt-3">
            <Text className="text-xs text-muted" numberOfLines={1}>
              {formatStamp(expense.createdAt)} · split {expense.participantIds.length}
            </Text>
            <Text
              className={`mt-1 text-xs font-medium ${
                youPaid ? "text-credit" : "text-muted"
              }`}
              numberOfLines={1}
            >
              {youPaid
                ? `You lent ${moneyAbs(expense.amount - yourShare)}`
                : `Your share ${moneyAbs(yourShare)}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function SettlementCard({
  settlement,
  members,
  currentUserId,
}: {
  settlement: Settlement;
  members: User[];
  currentUserId: string;
}) {
  const from = members.find((user) => user.id === settlement.fromId);
  const to = members.find((user) => user.id === settlement.toId);
  const youPaid = settlement.fromId === currentUserId;
  const youReceived = settlement.toId === currentUserId;

  return (
    <View className="rounded-3xl border border-border bg-card p-4">
      <Text className="text-[15px] font-semibold text-foreground">
        {youPaid ? "You" : firstName(from?.name ?? "Someone")} paid{" "}
        {youReceived ? "you" : firstName(to?.name ?? "someone")}
      </Text>
      <Text
        className={`mt-1 text-sm font-medium tabular-nums ${
          youReceived ? "text-credit" : youPaid ? "text-debit" : "text-muted"
        }`}
      >
        {moneyAbs(settlement.amount)} settled
      </Text>
      <Text className="mt-2 text-xs text-muted">{formatStamp(settlement.createdAt)}</Text>
    </View>
  );
}

export function EmptyActivity() {
  return (
    <View className="items-center rounded-3xl border border-dashed border-border bg-card px-6 py-10">
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-background">
        <Receipt color="#94A3B8" size={22} strokeWidth={2} />
      </View>
      <Text className="text-base font-semibold text-foreground">No activity yet</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-muted">
        Split a dinner or scan a receipt and it will land here.
      </Text>
    </View>
  );
}
