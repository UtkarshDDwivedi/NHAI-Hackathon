import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: Colors.primary,
				tabBarStyle: {
					backgroundColor: Colors.background,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="home-outline"
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="verify"
				options={{
					title: "Verify",
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="camera-outline"
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="register"
				options={{
					title: "Register",
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="person-add-outline"
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="book-outline"
							color={color}
							size={size}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
