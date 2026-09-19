import { ArrowLeftRight } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { moneyAbs } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export default function SettleScreen() {
  const insets = useSafeAreaInsets();
  const { net } = useEvenly();
  const owed = net > 0;
  const owes = net < 0;

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 16 }}
    >
      <Text className="text-2xl font-semibold text-foreground">Settle</Text>
      <Text className="mt-1 text-sm text-muted">
        Cash out the group with the fewest transfers.
      </Text>
      <View className="mt-6 rounded-3xl border border-border bg-card p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-background">
          <ArrowLeftRight color="#38BDF8" size={22} strokeWidth={2.2} />
        </View>
        <Text className="mt-4 text-sm font-medium uppercase tracking-[1.6px] text-muted">
          Suggested
        </Text>
        <Text
          className={`mt-2 text-3xl font-semibold tabular-nums ${
            owed ? "text-credit" : owes ? "text-debit" : "text-foreground"
          }`}
        >
          {owes ? `Pay ${moneyAbs(net)}` : owed ? `Collect ${moneyAbs(net)}` : "$0.00"}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-muted">
          Settlement actions will appear here once you confirm a payout.
        </Text>
      </View>
    </View>
  );
}
