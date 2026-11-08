/** Time-of-day greeting key (pure, testable). */
export function greetingKey(now: Date): "home.greeting.morning" | "home.greeting.afternoon" | "home.greeting.evening" {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "home.greeting.morning";
  if (hour >= 12 && hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
}
