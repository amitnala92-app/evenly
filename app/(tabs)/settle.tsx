import { ArrowRight, Check } from "lucide-react-native";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { firstName, initials, money, moneyAbs } from "@/lib/format";
import {
  getSuggestedTransfers,
  preferredPayment,
  useCurrentUser,
  useExpenseStore,
} from "@/src/store/useExpenseStore";

export default function SettleScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const users = useExpenseStore((state) => state.users);
  const expenses = useExpenseStore((state) => state.expenses);
  const splits = useExpenseStore((state) => state.splits);
  const settlements = useExpenseStore((state) => state.settlements);
  const net = useExpenseStore((state) => state.getUserNetBalance(currentUser.id));
  const recordSettlement = useExpenseStore((state) => state.recordSettlement);
  const transfers = useMemo(
    () => getSuggestedTransfers({ users, expenses, splits, settlements }),
    [users, expenses, splits, settlements]
  );
  const owed = net > 0;
  const owes = net < 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Text className="text-2xl font-semibold text-foreground">Settle</Text>
        <Text className="mt-1 text-sm text-muted">
          Cash out the group with the fewest transfers.
        </Text>
        <View className="mt-5 rounded-3xl border border-border bg-card p-5">
          <Text className="text-xs font-medium uppercase tracking-[1.6px] text-muted">
            Your Net Balance
          </Text>
          <Text
            className={`mt-2 text-3xl font-semibold tabular-nums ${
              owed ? "text-credit" : owes ? "text-debit" : "text-foreground"
            }`}
          >
            {money(net)}
          </Text>
          <Text className="mt-1 text-sm text-muted">
            {owes
              ? `Pay ${moneyAbs(net)} to get even`
              : owed
                ? `Collect ${moneyAbs(net)} to get even`
                : "You're settled up"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-5 gap-3"
        showsVerticalScrollIndicator={false}
      >
        {transfers.length === 0 ? (
          <View className="items-center rounded-3xl border border-credit/30 bg-card px-6 py-10">
            <Text className="text-base font-semibold text-credit">All settled</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-muted">
              Nobody in this group owes anyone right now.
            </Text>
          </View>
        ) : (
          transfers.map((transfer) => {
            const from = users.find((user) => user.id === transfer.fromId);
            const to = users.find((user) => user.id === transfer.toId);
            if (!from || !to) return null;
            const youPay = transfer.fromId === currentUser.id;
            const youReceive = transfer.toId === currentUser.id;
            const payout = preferredPayment(to);
            return (
              <View
                key={`${transfer.fromId}-${transfer.toId}-${transfer.amountCents}`}
                className="rounded-3xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: from.avatar }}
                  >
                    <Text className="text-xs font-semibold text-white">
                      {initials(from.name)}
                    </Text>
                  </View>
                  <View className="mx-2">
                    <ArrowRight color="#94A3B8" size={16} />
                  </View>
                  <View
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: to.avatar }}
                  >
                    <Text className="text-xs font-semibold text-white">
                      {initials(to.name)}
                    </Text>
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
                      {youPay ? "You" : firstName(from.name)} owe{youPay ? "" : "s"}{" "}
                      {youReceive ? "you" : firstName(to.name)}
                    </Text>
                    <Text
                      className={`mt-0.5 text-sm font-medium tabular-nums ${
                        youPay ? "text-debit" : youReceive ? "text-credit" : "text-muted"
                      }`}
                    >
                      {moneyAbs(transfer.amountCents)}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                      {payout.method === "VENMO"
                        ? `Venmo ${payout.detail}`
                        : payout.method === "UPI"
                          ? `UPI ${payout.detail}`
                          : "Cash"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    recordSettlement({
                      payerId: transfer.fromId,
                      payeeId: transfer.toId,
                      amountCents: transfer.amountCents,
                      paymentMethod: payout.method,
                    });
                    Alert.alert(
                      "Settled",
                      `Recorded ${moneyAbs(transfer.amountCents)} from ${firstName(from.name)} to ${firstName(to.name)}.`
                    );
                  }}
                  className="mt-4 h-11 flex-row items-center justify-center rounded-2xl bg-credit/15"
                >
                  <Check color="#10B981" size={16} strokeWidth={2.4} />
                  <Text className="ml-2 text-[15px] font-semibold text-credit">Settle</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
