import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  digitsToCents,
  firstName,
  formatCentsInput,
  initials,
  moneyAbs,
  parseAmount,
} from "@/lib/format";
import {
  splitEqualCents,
  useCurrentUser,
  useExpenseStore,
} from "@/src/store/useExpenseStore";

type SplitMode = "EQUAL" | "EXACT";

export default function AddExpenseModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const scanned = source === "scan";

  const currentUser = useCurrentUser();
  const users = useExpenseStore((state) => state.users);
  const addExpense = useExpenseStore((state) => state.addExpense);

  const [cents, setCents] = useState(scanned ? 2480 : 0);
  const [description, setDescription] = useState(scanned ? "Scanned receipt" : "");
  const [paidById, setPaidById] = useState(currentUser.id);
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [selectedIds, setSelectedIds] = useState<string[]>(users.map((user) => user.id));
  const [unequalDrafts, setUnequalDrafts] = useState<Record<string, string>>({});

  const equalShares = useMemo(
    () => (selectedIds.length === 0 ? [] : splitEqualCents(cents, selectedIds)),
    [cents, selectedIds]
  );

  const assignedCents = useMemo(
    () =>
      selectedIds.reduce((sum, id) => sum + parseAmount(unequalDrafts[id] ?? "0"), 0),
    [selectedIds, unequalDrafts]
  );
  const remainingCents = cents - assignedCents;
  const equalReady = description.trim().length > 0 && cents > 0 && selectedIds.length > 0;
  const unequalReady = equalReady && remainingCents === 0;
  const canSave = splitMode === "EQUAL" ? equalReady : unequalReady;

  useEffect(() => {
    if (splitMode !== "EXACT") return;
    setUnequalDrafts((prev) => {
      const next: Record<string, string> = {};
      const seeded = selectedIds.length === 0 ? [] : splitEqualCents(cents, selectedIds);
      for (const row of seeded) {
        next[row.userId] = prev[row.userId] ?? formatCentsInput(row.owedAmountCents);
      }
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);
      return unchanged ? prev : next;
    });
  }, [cents, selectedIds, splitMode]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const save = () => {
    if (!canSave) return;
    if (splitMode === "EQUAL") {
      addExpense({
        description: description.trim(),
        totalAmountCents: cents,
        paidByUserId: paidById,
        splitType: "EQUAL",
        participantUserIds: selectedIds,
        receiptUrl: scanned ? "demo://scanned-receipt" : undefined,
      });
    } else {
      addExpense({
        description: description.trim(),
        totalAmountCents: cents,
        paidByUserId: paidById,
        splitType: "EXACT",
        splits: selectedIds.map((userId) => ({
          userId,
          owedAmountCents: parseAmount(unequalDrafts[userId] ?? "0"),
        })),
        receiptUrl: scanned ? "demo://scanned-receipt" : undefined,
      });
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 4 }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="h-12 flex-row items-center px-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
            className="min-w-[72px] px-2"
            hitSlop={8}
          >
            <Text className="text-[17px] font-medium text-primary">Cancel</Text>
          </Pressable>
          <Text className="flex-1 text-center text-[17px] font-semibold text-foreground">
            Add Expense
          </Text>
          <View className="min-w-[72px]" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="flex-row items-end justify-center">
            <Text className="mb-1 mr-1 text-4xl font-semibold text-muted">$</Text>
            <TextInput
              autoFocus
              value={formatCentsInput(cents)}
              onChangeText={(text) => setCents(digitsToCents(text))}
              keyboardType="number-pad"
              inputMode="numeric"
              caretHidden={Platform.OS !== "web"}
              className="min-w-[160px] text-center text-6xl font-semibold tabular-nums text-foreground"
              accessibilityLabel="Amount"
            />
          </View>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What was this for? e.g., Dinner, Groceries"
            placeholderTextColor="#94A3B8"
            className="mt-6 h-12 rounded-2xl border border-border bg-card px-4 text-base text-foreground"
          />

          <Text className="mt-6 text-xs font-medium uppercase tracking-[1.6px] text-muted">
            Paid by
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerClassName="gap-3 pr-2"
          >
            {users.map((user) => {
              const selected = user.id === paidById;
              return (
                <Pressable
                  key={user.id}
                  onPress={() => setPaidById(user.id)}
                  className="w-[72px] items-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Paid by ${user.name}`}
                >
                  <View
                    className={`h-14 w-14 items-center justify-center rounded-full border-2 ${
                      selected ? "border-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: user.avatar }}
                  >
                    <Text className="text-sm font-semibold text-white">
                      {initials(user.name)}
                    </Text>
                  </View>
                  <Text
                    className={`mt-2 text-center text-xs font-medium ${
                      selected ? "text-primary" : "text-muted"
                    }`}
                    numberOfLines={1}
                  >
                    {user.isCurrentUser ? "You" : firstName(user.name)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-6 h-11 flex-row rounded-2xl bg-card p-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Split equally"
              onPress={() => setSplitMode("EQUAL")}
              className={`flex-1 items-center justify-center rounded-xl ${
                splitMode === "EQUAL" ? "bg-background" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  splitMode === "EQUAL" ? "text-foreground" : "text-muted"
                }`}
              >
                Split Equally
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Unequal amounts"
              onPress={() => setSplitMode("EXACT")}
              className={`flex-1 items-center justify-center rounded-xl ${
                splitMode === "EXACT" ? "bg-background" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  splitMode === "EXACT" ? "text-foreground" : "text-muted"
                }`}
              >
                Unequal Amounts
              </Text>
            </Pressable>
          </View>

          {splitMode === "EQUAL" ? (
            <Text className="mt-3 text-xs text-muted">
              {selectedIds.length === 0 || cents <= 0
                ? "Select people to split this expense."
                : equalShares.length > 0 &&
                    equalShares.every(
                      (row) => row.owedAmountCents === (equalShares[0]?.owedAmountCents ?? 0)
                    )
                  ? `${moneyAbs(equalShares[0]?.owedAmountCents ?? 0)} each`
                  : `${moneyAbs(equalShares[equalShares.length - 1]?.owedAmountCents ?? 0)}–${moneyAbs(equalShares[0]?.owedAmountCents ?? 0)} each`}
            </Text>
          ) : (
            <Text
              className={`mt-3 text-sm font-medium ${
                remainingCents === 0 ? "text-credit" : "text-debit"
              }`}
            >
              Remaining to assign: {remainingCents < 0 ? "-" : ""}
              {moneyAbs(remainingCents)}
            </Text>
          )}

          <View className="mt-4 gap-2">
            {users.map((user) => {
              const selected = selectedIds.includes(user.id);
              const equalShare =
                equalShares.find((row) => row.userId === user.id)?.owedAmountCents ?? 0;
              return (
                <View
                  key={user.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    selected ? "border-primary bg-card" : "border-border bg-card"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => toggleMember(user.id)}
                      className="flex-1 flex-row items-center"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View
                        className={`mr-3 h-5 w-5 items-center justify-center rounded-md border ${
                          selected ? "border-primary bg-primary" : "border-muted"
                        }`}
                      >
                        {selected ? (
                          <Text className="text-[11px] font-bold text-background">✓</Text>
                        ) : null}
                      </View>
                      <View
                        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: user.avatar }}
                      >
                        <Text className="text-[11px] font-semibold text-white">
                          {initials(user.name)}
                        </Text>
                      </View>
                      <Text className="flex-1 text-[15px] font-medium text-foreground">
                        {user.isCurrentUser ? "You" : user.name}
                      </Text>
                      {splitMode === "EQUAL" && selected ? (
                        <Text className="text-sm font-semibold tabular-nums text-muted">
                          {moneyAbs(equalShare)}
                        </Text>
                      ) : null}
                    </Pressable>
                  </View>
                  {splitMode === "EXACT" && selected ? (
                    <View className="mt-3 h-11 flex-row items-center rounded-xl bg-background px-3">
                      <Text className="mr-1 text-base text-muted">$</Text>
                      <TextInput
                        value={unequalDrafts[user.id] ?? "0.00"}
                        onChangeText={(text) =>
                          setUnequalDrafts((prev) => ({
                            ...prev,
                            [user.id]: text,
                          }))
                        }
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        className="flex-1 text-base tabular-nums text-foreground"
                        accessibilityLabel={`${user.name} amount`}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save expense"
            disabled={!canSave}
            onPress={save}
            className={`h-12 items-center justify-center rounded-2xl ${
              canSave ? "bg-primary" : "bg-card"
            }`}
          >
            <Text
              className={`text-[15px] font-semibold ${
                canSave ? "text-background" : "text-muted"
              }`}
            >
              Save Expense
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
