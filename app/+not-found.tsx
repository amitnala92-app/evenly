import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Missing screen", headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-semibold text-foreground">
          This screen does not exist.
        </Text>
        <Link href="/" className="mt-4">
          <Text className="text-base font-semibold text-primary">
            Back to dashboard
          </Text>
        </Link>
      </View>
    </>
  );
}
