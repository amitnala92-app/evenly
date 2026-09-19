import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyActivity, ExpenseCard, SettlementCard } from "@/components/activity-cards";
import { useEvenly } from "@/lib/store";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, settlements, members, currentUser } = useEvenly();

  const items = [
    ...expenses.map((expense) => ({
      kind: "expense" as const,
      at: expense.createdAt,
      expense,
    })),
    ...settlements.map((settlement) => ({
      kind: "settlement" as const,
      at: settlement.createdAt,
      settlement,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-end justify-between px-5">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-semibold text-foreground">Activity</Text>
          <Text className="mt-1 text-sm text-muted">
            Every split, receipt, and settlement in one feed.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-expense")}
          className="h-10 flex-row items-center rounded-full bg-primary px-3"
        >
          <Plus color="#0F172A" size={16} strokeWidth={2.4} />
          <Text className="ml-1 text-sm font-semibold text-background">Add</Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-5 gap-3"
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyActivity />
        ) : (
          items.map((item) =>
            item.kind === "expense" ? (
              <ExpenseCard
                key={item.expense.id}
                expense={item.expense}
                members={members}
                currentUserId={currentUser.id}
              />
            ) : (
              <SettlementCard
                key={item.settlement.id}
                settlement={item.settlement}
                members={members}
                currentUserId={currentUser.id}
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}
