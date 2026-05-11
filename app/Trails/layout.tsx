import { Stack } from "expo-router";

export default function TrailsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Trails" }} />
    </Stack>
  );
}
