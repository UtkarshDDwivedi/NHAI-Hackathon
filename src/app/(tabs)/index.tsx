import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function Index() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text>Home</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},

	safeArea: {
		flex: 1,
		backgroundColor: Colors.background,
		padding: 24,
	},
});
