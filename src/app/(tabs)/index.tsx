import { Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

SplashScreen.preventAutoHideAsync();

export default function Index() {
	const [fontsLoaded, fontError] = useFonts({
		MrsSaintDelafield: require("@/assets/fonts/MrsSaintDelafield-Regular.ttf"),
	});

	useEffect(() => {
		if (fontsLoaded || fontError) SplashScreen.hideAsync();
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) return null;

	return (
		<SafeAreaView style={styles.safeArea}>
			<Text style={styles.title}>Drishti</Text>
			<View style={styles.container}>
				<View style={styles.statusCard}>
					<Text style={styles.statusTitle}>Offline Mode</Text>
					<Text style={styles.statusDescription}>
						Records will be stored locally and synced when
						connectivity is restored.
					</Text>
					<Pressable style={styles.syncButton}>
						<Ionicons name="sync" color={Colors.textPrimary} size={24} />
						<Text style={{color: Colors.textPrimary, fontWeight: "bold"}}>Sync Manually</Text>
					</Pressable>
				</View>

				<Pressable style={styles.verifyCard}>
					<Ionicons name="camera" color="#fff" size={140} />
					<View style={styles.verifyTextContainer}>
						<Text style={styles.verifyTitle}>Verify Personnel</Text>
					</View>
				</Pressable>

				<View style={styles.bottomRow}>
					<Pressable style={styles.bottomCard}>
						<Ionicons
							size={60}
							color={Colors.textSecondary}
							name="person-add"
						/>
						<Text style={styles.bottomRowTitle}>Register</Text>
					</Pressable>
					<Pressable style={styles.bottomCard}>
						<Ionicons
							size={60}
							color={Colors.textSecondary}
							name="book"
						/>
						<Text style={styles.bottomRowTitle}>History</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.background,
		padding: 24,
	},

	container: {
		flex: 1,
		gap: 24,
		justifyContent: "center"
	},

	title: {
		fontSize: 72,
		fontFamily: "MrsSaintDelafield",
		color: Colors.textPrimary,
	},

	statusCard: {
		backgroundColor: Colors.cardBackground,
		padding: 12,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: Colors.border,
		gap: 8,
	},

	statusTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: Colors.textPrimary
	},

	statusDescription: {
		fontSize: 16,
		color: Colors.textSecondary
	},

	syncButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: Colors.green,
		alignSelf: "flex-start",
		padding: 4,
		paddingHorizontal: 8,
		borderRadius: 8,
	},

	verifyCard: {
		backgroundColor: Colors.primary,
		padding: 12,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: Colors.border,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
	},

	verifyTextContainer: {
		flex: 1,
		gap: 8,
		justifyContent: "center",
		alignItems: "center",
	},

	verifyTitle: {
		fontSize: 22,
		color: "#ffffff",
		fontWeight: "bold",
		textAlign: "center",
	},

	bottomRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	bottomCard: {
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: Colors.cardBackground,
		borderWidth: 2,
		borderRadius: 16,
		borderColor: Colors.border,
		padding: 20,
		paddingHorizontal: 36,
	},

	bottomRowTitle: {
		color: Colors.textPrimary,
		fontSize: 20,
		fontWeight: "bold",
	},
});
