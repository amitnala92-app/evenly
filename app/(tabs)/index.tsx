import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  Camera,
  ChevronDown,
  Link as LinkIcon,
  Plus,
  Scale,
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyActivity, ExpenseCard, SettlementCard } from "@/components/activity-cards";
import { money } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { group, groups, net, selectGroup, expenses, settlements, members, currentUser } =
    useEvenly();
  const [pickerOpen, setPickerOpen] = useState(false);

  const owed = net > 0;
  const owes = net < 0;
  const balanceColor = owed
    ? "text-credit"
    : owes
      ? "text-debit"
      : "text-foreground";
  const standingLabel = owed
    ? "You're owed overall"
    : owes
      ? "You owe overall"
      : "You're settled up";

  const invite = async () => {
    await Clipboard.setStringAsync(group.inviteUrl);
    Alert.alert("Invite link copied", group.inviteUrl);
  };

  const recentItems = [
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
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 3);

  return (
    <View className="flex-1 bg-background">
      <View
        className="z-30 overflow-visible bg-background px-5 pb-2"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-3">
          <Text className="flex-1 text-[28px] font-semibold tracking-tight text-foreground">
            evenly•
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invite friends"
            onPress={() => {
              void invite();
            }}
            className="h-11 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-4"
          >
            <LinkIcon color="#38BDF8" size={16} strokeWidth={2.2} />
            <Text className="text-sm font-semibold text-foreground">Invite</Text>
          </Pressable>
        </View>

        <View className="relative z-20 mt-3 self-start">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select group"
            onPress={() => setPickerOpen((open) => !open)}
            className="h-12 flex-row items-center rounded-full border border-border bg-card px-4"
          >
            <Text className="mr-2 text-[15px] font-semibold text-foreground">
              {group.name}
            </Text>
            <ChevronDown color="#94A3B8" size={18} strokeWidth={2.2} />
          </Pressable>
          {pickerOpen ? (
            <View className="absolute left-0 top-14 z-40 min-w-[220px] rounded-2xl border border-border bg-card p-2">
              {groups.map((item) => {
                const selected = item.id === group.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      selectGroup(item.id);
                      setPickerOpen(false);
                    }}
                    className={`h-11 flex-row items-center rounded-xl px-3 ${
                      selected ? "bg-background" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-medium ${
                        selected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setPickerOpen(false)}
      >
        <View className="mt-4 rounded-3xl border border-border bg-card p-5">
          <Text className="text-xs font-medium uppercase tracking-[1.6px] text-muted">
            Your Net Balance
          </Text>
          <Text
            className={`mt-3 text-5xl font-semibold tracking-tight tabular-nums ${balanceColor}`}
          >
            {money(net)}
          </Text>
          <Text className="mt-2 text-sm text-muted">{standingLabel}</Text>
        </View>

        <View className="mt-5 flex-row gap-2">
          <QuickAction
            label="+ Add Expense"
            icon={<Plus color="#0F172A" size={16} strokeWidth={2.6} />}
            accent
            onPress={() => router.push("/add-expense")}
          />
          <QuickAction
            label="Scan Receipt"
            icon={<Camera color="#F8FAFC" size={16} strokeWidth={2.2} />}
            onPress={() => router.push({ pathname: "/add-expense", params: { source: "scan" } })}
          />
          <QuickAction
            label="Settle Up"
            icon={<Scale color="#F8FAFC" size={16} strokeWidth={2.2} />}
            onPress={() => router.push("/(tabs)/settle")}
          />
        </View>

        <View className="mt-8">
          <View className="flex-row items-end justify-between">
            <Text className="text-lg font-semibold text-foreground">
              Recent Activity
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/activity")}>
              <Text className="text-sm font-semibold text-primary">See all</Text>
            </Pressable>
          </View>
          <View className="mt-3 gap-3">
            {recentItems.length === 0 ? (
              <EmptyActivity />
            ) : (
              recentItems.map((item) =>
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
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
  accent = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[88px] flex-1 items-center justify-center rounded-2xl border px-2 ${
        accent ? "border-primary bg-primary" : "border-border bg-card"
      }`}
    >
      <View
        className={`mb-2 h-8 w-8 items-center justify-center rounded-full ${
          accent ? "bg-background/15" : "bg-background"
        }`}
      >
        {icon}
      </View>
      <Text
        className={`text-center text-[11px] font-semibold leading-4 ${
          accent ? "text-background" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
