import { Receipt } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 16 }}
    >
      <Text className="text-2xl font-semibold text-foreground">Activity</Text>
      <Text className="mt-1 text-sm text-muted">
        Every split, receipt, and settlement in one feed.
      </Text>
      <View className="mt-8 items-center rounded-3xl border border-dashed border-border bg-card px-6 py-12">
        <Receipt color="#94A3B8" size={28} strokeWidth={2} />
        <Text className="mt-3 text-base font-semibold text-foreground">
          No activity yet
        </Text>
        <Text className="mt-1 text-center text-sm leading-5 text-muted">
          New expenses will show up here as soon as someone adds them.
        </Text>
      </View>
    </View>
  );
}
