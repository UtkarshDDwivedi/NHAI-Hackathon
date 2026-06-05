import { Text, View, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
	loadTensorflowModel,
	type TfliteModel,
} from "react-native-fast-tflite";
import {
	Camera,
	useCameraPermission,
	useCameraDevice,
	CameraRef,
} from "react-native-vision-camera";
import { useIsFocused, useFocusEffect } from "expo-router";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { generateBlazeFaceAnchors } from "@/utils/blazeface";
import { extractEmbedding } from "@/utils/extractEmbedding";
import { saveEmbedding } from "@/storage/embeddings";
import { router } from "expo-router";

export default function Register() {
	const isFocused = useIsFocused();
	const [isCameraActive, setIsCameraActive] = useState(false);

	useFocusEffect(
		useCallback(() => {
			const timer = setTimeout(() => setIsCameraActive(true), 200);
			return () => {
				clearTimeout(timer);
				setIsCameraActive(false);
			};
		}, [])
	);

	const { hasPermission, requestPermission } = useCameraPermission();
	const [blazeFace, setBlazeFace] = useState<TfliteModel | null>(null);
	const [mobileFaceNet, setMobileFaceNet] = useState<TfliteModel | null>(null);
	const device = useCameraDevice("front");
	const camera = useRef<CameraRef>(null);
	const anchors = useMemo(() => generateBlazeFaceAnchors(), []);

	const [personName, setPersonName] = useState("");
	const [personId, setPersonId] = useState("");
	const [isRegistering, setIsRegistering] = useState(false);

	useEffect(() => {
		async function loadModels() {
			try {
				const blaze = await loadTensorflowModel(
					require("../../../assets/models/blazeface.tflite"),
					[],
				);
				const encoder = await loadTensorflowModel(
					require("../../../assets/models/mobilefacenet_encoder.tflite"),
					[],
				);
				setBlazeFace(blaze);
				setMobileFaceNet(encoder);
			} catch (error) {
				console.error(error);
			}
		}
		loadModels();
	}, []);

	if (!blazeFace || !mobileFaceNet) {
		return (
			<SafeAreaView style={styles.center}>
				<Text>Loading AI models...</Text>
			</SafeAreaView>
		);
	}

	if (!hasPermission) {
		return (
			<SafeAreaView style={[styles.center, { backgroundColor: Colors.background, padding: 24, gap: 16 }]}>
				<Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
					Camera Permission Required
				</Text>
				<Pressable
					onPress={requestPermission}
					style={styles.permissionButton}
				>
					<Text style={{ fontSize: 16, fontWeight: "bold" }}>Grant Permission</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	if (!device) {
		return <View style={styles.center}><Text>Loading camera...</Text></View>;
	}

	const handleRegister = async () => {
		if (!personName.trim() || !personId.trim()) {
			Alert.alert("Error", "Please enter both name and ID.");
			return;
		}

		if (!camera.current) return;

		setIsRegistering(true);
		try {
			const { embedding } = await extractEmbedding(
				camera.current,
				blazeFace,
				mobileFaceNet,
				anchors
			);
			
			saveEmbedding(personId.trim(), personName.trim(), embedding);
			Alert.alert("Success", "Personnel registered successfully!", [
				{ text: "OK", onPress: () => router.push("/") }
			]);
		} catch (err: any) {
			Alert.alert("Registration Failed", err.message || "Failed to register face.");
		} finally {
			setIsRegistering(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Register Personnel</Text>
			</View>

			<View style={styles.cameraWrapper}>
				{isCameraActive && (
					<Camera
						style={StyleSheet.absoluteFill}
						device={device}
						isActive={true}
						ref={camera}
					/>
				)}
			</View>

			<View style={styles.formContainer}>
				<TextInput
					style={styles.input}
					placeholder="Personnel Name"
					placeholderTextColor={Colors.textSecondary}
					value={personName}
					onChangeText={setPersonName}
				/>
				<TextInput
					style={styles.input}
					placeholder="Personnel ID"
					placeholderTextColor={Colors.textSecondary}
					value={personId}
					onChangeText={setPersonId}
				/>

				<Pressable 
					style={[styles.registerButton, isRegistering && styles.buttonDisabled]} 
					onPress={handleRegister}
					disabled={isRegistering}
				>
					<Text style={styles.registerButtonText}>
						{isRegistering ? "Registering..." : "Capture & Register"}
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	safeArea: {
		flex: 1,
		backgroundColor: Colors.background,
		padding: 24,
		gap: 16,
	},
	header: {
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 32,
		fontWeight: "bold",
		color: Colors.textPrimary,
	},
	cameraWrapper: {
		width: "100%",
		height: 350,
		borderRadius: 24,
		backgroundColor: "#000000",
		overflow: "hidden",
	},
	formContainer: {
		flex: 1,
		gap: 12,
		marginTop: 8,
	},
	input: {
		backgroundColor: Colors.cardBackground,
		borderWidth: 2,
		borderColor: Colors.border,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: Colors.textPrimary,
	},
	registerButton: {
		backgroundColor: Colors.primary,
		padding: 16,
		borderRadius: 16,
		alignItems: "center",
		marginTop: 16,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	registerButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	permissionButton: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: Colors.border,
		backgroundColor: Colors.yellow,
	}
});
