import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { firstName, parseAmount } from "@/lib/format";
import { useEvenly } from "@/lib/store";

export default function AddExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const scanned = source === "scan";

  const { members, currentUser, addExpense } = useEvenly();
  const [description, setDescription] = useState(scanned ? "Scanned receipt" : "");
  const [amount, setAmount] = useState(scanned ? "24.80" : "");
  const [paidById, setPaidById] = useState(currentUser.id);
  const [splitIds, setSplitIds] = useState<string[]>(members.map((user) => user.id));

  const cents = parseAmount(amount);
  const canSubmit = description.trim().length > 0 && cents > 0 && splitIds.length >= 1;
  const sharePreview = useMemo(() => {
    if (cents <= 0 || splitIds.length === 0) return null;
    return Math.floor(cents / splitIds.length);
  }, [cents, splitIds.length]);

  const toggleSplit = (id: string) => {
    setSplitIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const save = () => {
    if (!canSubmit) return;
    addExpense({
      description: description.trim(),
      amount: cents,
      paidById,
      participantIds: splitIds,
      category: scanned ? "general" : "food",
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between px-5 pb-2">
          <Text className="text-2xl font-semibold text-foreground">
            {scanned ? "Scan receipt" : "Add expense"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <X color="#F8FAFC" size={18} strokeWidth={2.2} />
          </Pressable>
        </View>
        <Text className="px-5 text-sm text-muted">
          {scanned
            ? "We filled in a receipt draft. Confirm the amount and split."
            : "Split a new charge equally across Cabin Trip."}
        </Text>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-5"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm font-medium text-muted">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Dinner, gas, cabin snacks"
            placeholderTextColor="#94A3B8"
            className="mt-2 h-12 rounded-2xl border border-border bg-card px-4 text-base text-foreground"
          />

          <Text className="mt-5 text-sm font-medium text-muted">Amount</Text>
          <View className="mt-2 h-12 flex-row items-center rounded-2xl border border-border bg-card px-4">
            <Text className="mr-1 text-base text-muted">$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-base tabular-nums text-foreground"
            />
          </View>

          <Text className="mt-5 text-sm font-medium text-muted">Paid by</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {members.map((user) => {
              const selected = user.id === paidById;
              return (
                <Pressable
                  key={user.id}
                  onPress={() => setPaidById(user.id)}
                  className={`h-10 rounded-full border px-4 justify-center ${
                    selected ? "border-primary bg-primary/15" : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {user.id === currentUser.id ? `${firstName(user.name)} (you)` : firstName(user.name)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-muted">Split equally</Text>
            {sharePreview != null ? (
              <Text className="text-xs text-muted">
                {(sharePreview / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}{" "}
                each
              </Text>
            ) : null}
          </View>
          <View className="mt-2 gap-2">
            {members.map((user) => {
              const selected = splitIds.includes(user.id);
              return (
                <Pressable
                  key={user.id}
                  onPress={() => toggleSplit(user.id)}
                  className={`h-12 flex-row items-center rounded-2xl border px-4 ${
                    selected ? "border-primary bg-card" : "border-border bg-card"
                  }`}
                >
                  <View
                    className={`mr-3 h-5 w-5 items-center justify-center rounded-md border ${
                      selected ? "border-primary bg-primary" : "border-muted"
                    }`}
                  >
                    {selected ? <Text className="text-[11px] font-bold text-background">✓</Text> : null}
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {user.id === currentUser.id ? `${firstName(user.name)} (you)` : user.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable
            onPress={() => {
              if (!canSubmit) {
                Alert.alert("Missing details", "Add a description, amount, and at least one person.");
                return;
              }
              save();
            }}
            className={`h-12 items-center justify-center rounded-2xl ${
              canSubmit ? "bg-primary" : "bg-card"
            }`}
          >
            <Text
              className={`text-[15px] font-semibold ${
                canSubmit ? "text-background" : "text-muted"
              }`}
            >
              Save expense
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
