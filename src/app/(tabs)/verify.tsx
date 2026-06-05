import { Text, View, StyleSheet, Pressable } from "react-native";
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
import { useEffect, useState, useRef, useMemo } from "react";
import { generateBlazeFaceAnchors } from "@/utils/blazeface";
import { decodeBox } from "@/utils/decode";

export default function Verify() {
	const { hasPermission, requestPermission } = useCameraPermission();

	const [blazeFace, setBlazeFace] = useState<TfliteModel | null>(null);

	const [faceMesh, setFaceMesh] = useState<TfliteModel | null>(null);

	const [mobileFaceNet, setMobileFaceNet] = useState<TfliteModel | null>(
		null,
	);

	const device = useCameraDevice("front");

	const camera = useRef<CameraRef>(null);

	const anchors = useMemo(() => generateBlazeFaceAnchors(), []);

	useEffect(() => {
		console.log("CAMERA");
		console.log(camera.current);
	}, []);

	useEffect(() => {
		async function loadModels() {
			try {
				const blaze = await loadTensorflowModel(
					require("../../../assets/models/blazeface.tflite"),
					[],
				);

				const mesh = await loadTensorflowModel(
					require("../../../assets/models/face_mesh.tflite"),
					[],
				);

				const encoder = await loadTensorflowModel(
					require("../../../assets/models/mobilefacenet_encoder.tflite"),
					[],
				);

				setBlazeFace(blaze);
				setFaceMesh(mesh);
				setMobileFaceNet(encoder);

				console.log("All models loaded");
			} catch (error) {
				console.error(error);
			}
		}

		loadModels();
	}, []);

	if (!blazeFace || !faceMesh || !mobileFaceNet) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text>Loading AI model...</Text>
			</SafeAreaView>
		);
	}

	if (!hasPermission) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: Colors.background,
					padding: 24,
					justifyContent: "center",
					alignItems: "center",
					gap: 16,
				}}
			>
				<Text
					style={{
						fontSize: 24,
						fontWeight: "bold",
						textAlign: "center",
					}}
				>
					Camera Permission Required
				</Text>
				<Pressable
					onPress={requestPermission}
					style={{
						padding: 16,
						borderRadius: 12,
						borderWidth: 2,
						borderColor: Colors.border,
						backgroundColor: Colors.yellow,
					}}
				>
					{" "}
					<Text style={{ fontSize: 16, fontWeight: "bold" }}>
						Grant Permission
					</Text>{" "}
				</Pressable>
			</SafeAreaView>
		);
	}

	if (!device) {
		return (
			<View>
				<Text>Loading camera...</Text>
			</View>
		);
	}

	const verifyPerson = async () => {
		try {
			console.log("Capturing...");

			const snapshot = await camera.current?.takeSnapshot();

			if (!snapshot) {
				console.log("No snapshot");
				return;
			}

			// =========================
			// PREPARE BLAZEFACE INPUT
			// =========================

			const resized = snapshot.resize(128, 128);

			const raw = resized.toRawPixelData();
			const pixels = new Uint8Array(raw.buffer);

			console.log("Width:", raw.width);
			console.log("Height:", raw.height);
			console.log("Format:", raw.pixelFormat);

			const input = new Float32Array(128 * 128 * 3);

			let j = 0;

			for (let i = 0; i < pixels.length; i += 4) {
				const b = pixels[i];
				const g = pixels[i + 1];
				const r = pixels[i + 2];

				input[j++] = (r - 127.5) / 127.5;
				input[j++] = (g - 127.5) / 127.5;
				input[j++] = (b - 127.5) / 127.5;
			}

			// =========================
			// RUN BLAZEFACE
			// =========================

			console.log("Running BlazeFace...");

			const outputs = blazeFace.runSync([input.buffer]);

			const regressors = new Float32Array(outputs[0] as ArrayBuffer);

			const scores = new Float32Array(outputs[1] as ArrayBuffer);

			let bestIdx = -1;
			let bestScore = -Infinity;

			for (let i = 0; i < scores.length; i++) {
				if (scores[i] > bestScore) {
					bestScore = scores[i];
					bestIdx = i;
				}
			}

			const confidence = 1 / (1 + Math.exp(-bestScore));

			console.log("Confidence:", confidence);

			if (confidence < 0.75) {
				console.log("No face detected");
				return;
			}

			// =========================
			// DECODE BOX
			// =========================

			const boxOffset = bestIdx * 16;

			const box = Array.from(regressors.slice(boxOffset, boxOffset + 16));

			const anchor = anchors[bestIdx];

			const decoded = decodeBox(box, anchor);

			console.log("Best Anchor:", bestIdx);
			console.log("Anchor:", anchor);
			console.log("Decoded:", decoded);

			console.log("Pixels:", {
				x: decoded.x * snapshot.width,
				y: decoded.y * snapshot.height,
				w: decoded.width * snapshot.width,
				h: decoded.height * snapshot.height,
			});

			// =========================
			// FACE CROP
			// =========================

			const x1 = Math.max(
				0,
				(decoded.x - decoded.width / 2) * snapshot.width,
			);

			const y1 = Math.max(
				0,
				(decoded.y - decoded.height / 2) * snapshot.height,
			);

			const x2 = Math.min(
				snapshot.width,
				(decoded.x + decoded.width / 2) * snapshot.width,
			);

			const y2 = Math.min(
				snapshot.height,
				(decoded.y + decoded.height / 2) * snapshot.height,
			);

			console.log("Crop:", {
				x1,
				y1,
				x2,
				y2,
			});

			if (x2 <= x1 || y2 <= y1) {
				console.log("Invalid crop");
				return;
			}

			const faceCrop = snapshot.crop(x1, y1, x2, y2);

			// =========================
			// MOBILEFACENET INPUT
			// =========================

			const face112 = faceCrop.resize(112, 112);

			const faceRaw = face112.toRawPixelData();

			const facePixels = new Uint8Array(faceRaw.buffer);

			const encoderInput = new Float32Array(112 * 112 * 3);

			let k = 0;

			for (let i = 0; i < facePixels.length; i += 4) {
				const b = facePixels[i];
				const g = facePixels[i + 1];
				const r = facePixels[i + 2];

				encoderInput[k++] = (r - 127.5) / 127.5;

				encoderInput[k++] = (g - 127.5) / 127.5;

				encoderInput[k++] = (b - 127.5) / 127.5;
			}

			// =========================
			// RUN MOBILEFACENET
			// =========================

			console.log("Running MobileFaceNet...");

			const embeddingOutput = mobileFaceNet.runSync([
				encoderInput.buffer,
			]);

			const embedding = new Float32Array(
				embeddingOutput[0] as ArrayBuffer,
			);

			

			console.log("Embedding Length:", embedding.length);

			console.log("First 10 Values:", Array.from(embedding.slice(0, 10)));

			console.log("Verification complete.");
		} catch (error) {
			console.error("Verification Error:", error);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Verify Personnel</Text>
			</View>

			<View style={styles.cameraWrapper}>
				<Camera
					style={StyleSheet.absoluteFill}
					device={device}
					isActive={true}
					ref={camera}
				/>
			</View>

			<Pressable style={styles.verifyButton} onPress={verifyPerson}>
				<Text style={styles.verifyButtonText}>Verify</Text>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
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
		height: 400,
		borderRadius: 24,
		backgroundColor: "#000000",
		overflow: "hidden",
	},

	verifyButton: {
		backgroundColor: Colors.primary,
		padding: 16,
		borderRadius: 16,
		alignItems: "center",
		marginTop: 16,
	},

	verifyButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
});
