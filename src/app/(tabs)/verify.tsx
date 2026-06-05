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
import { useIsFocused, useFocusEffect } from "expo-router";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { generateBlazeFaceAnchors } from "@/utils/blazeface";
import { decodeBox } from "@/utils/decode";
import { extractEmbedding } from "@/utils/extractEmbedding";
import { loadAllEmbeddings } from "@/storage/embeddings";
import { bestMatch } from "@/utils/similarity";

export default function Verify() {
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

	const [boundingBox, setBoundingBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [result, setResult] = useState<{personName?: string, personId?: string, score?: number, status: "success" | "rejected" | null} | null>(null);

	// Background tracking loop for bounding box
	useEffect(() => {
		let isMounted = true;
		let timeoutId: any;

		const trackFace = async () => {
			if (!camera.current || !blazeFace || !isFocused) return;
			if (isVerifying) {
				timeoutId = setTimeout(trackFace, 500);
				return;
			}
			try {
				const snapshot = await camera.current.takeSnapshot();
				if (!snapshot || !isMounted) return;

				const resized = snapshot.resize(128, 128);
				const raw = resized.toRawPixelData();
				const pixels = new Uint8Array(raw.buffer);
				const input = new Float32Array(128 * 128 * 3);
				let j = 0;
				for (let i = 0; i < pixels.length; i += 4) {
					input[j++] = (pixels[i+2] - 127.5) / 127.5;
					input[j++] = (pixels[i+1] - 127.5) / 127.5;
					input[j++] = (pixels[i] - 127.5) / 127.5;
				}

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
				if (confidence > 0.75) {
					const boxOffset = bestIdx * 16;
					const box = Array.from(regressors.slice(boxOffset, boxOffset + 16));
					const anchor = anchors[bestIdx];
					const decoded = decodeBox(box, anchor);
					setBoundingBox({
						x: decoded.x,
						y: decoded.y,
						w: decoded.width,
						h: decoded.height,
					});
				} else {
					setBoundingBox(null);
				}
			} catch (err) {
				// Ignore tracking errors
			}

			if (isMounted) {
				timeoutId = setTimeout(trackFace, 150);
			}
		};

		if (device && camera.current && blazeFace && isFocused) {
			timeoutId = setTimeout(trackFace, 500);
		}

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [device, blazeFace, anchors, isVerifying, isFocused]);

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
			<SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading AI models...</Text>
			</SafeAreaView>
		);
	}

	if (!hasPermission) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
					Camera Permission Required
				</Text>
				<Pressable onPress={requestPermission} style={styles.permissionButton}>
					<Text style={{ fontSize: 16, fontWeight: "bold" }}>Grant Permission</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	if (!device) {
		return <View><Text>Loading camera...</Text></View>;
	}

	const verifyPerson = async () => {
		if (!camera.current || !blazeFace || !mobileFaceNet) return;
		setIsVerifying(true);
		setResult(null);

		try {
			const { embedding } = await extractEmbedding(
				camera.current,
				blazeFace,
				mobileFaceNet,
				anchors
			);

			const allStored = loadAllEmbeddings();
			
			if (allStored.length === 0) {
				setResult({ status: "rejected" });
				return;
			}

			const match = bestMatch(embedding, allStored);
			
			// Set threshold to 0.7 as per plan
			if (match.score > 0.7) {
				setResult({
					status: "success",
					personName: match.personName,
					personId: match.personId,
					score: match.score,
				});
			} else {
				setResult({ status: "rejected", score: match.score });
			}
		} catch (error) {
			console.error("Verification Error:", error);
			setResult({ status: "rejected" });
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Verify Personnel</Text>
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
				{boundingBox && !isVerifying && (
					<View
						style={{
							position: "absolute",
							left: `${(boundingBox.x - boundingBox.w / 2) * 100}%` as any,
							top: `${(boundingBox.y - boundingBox.h / 2) * 100}%` as any,
							width: `${boundingBox.w * 100}%` as any,
							height: `${boundingBox.h * 100}%` as any,
							borderWidth: 3,
							borderColor: "red",
							borderRadius: 8,
						}}
					/>
				)}
			</View>

			<Pressable 
				style={[styles.verifyButton, isVerifying && { opacity: 0.7 }]} 
				onPress={verifyPerson}
				disabled={isVerifying}
			>
				<Text style={styles.verifyButtonText}>
					{isVerifying ? "Verifying..." : "Verify"}
				</Text>
			</Pressable>

			{result && (
				<View style={[styles.resultCard, result.status === "success" ? styles.resultSuccess : styles.resultRejected]}>
					{result.status === "success" ? (
						<>
							<Text style={styles.resultTitle}>✅ Authenticated</Text>
							<Text style={styles.resultText}>Name: {result.personName}</Text>
							<Text style={styles.resultText}>ID: {result.personId}</Text>
							<Text style={styles.resultScore}>Confidence: {(result.score! * 100).toFixed(1)}%</Text>
						</>
					) : (
						<>
							<Text style={styles.resultTitle}>❌ Rejected</Text>
							<Text style={styles.resultText}>No match found or confidence too low.</Text>
							{result.score !== undefined && (
								<Text style={styles.resultScore}>Best Match Score: {(result.score * 100).toFixed(1)}%</Text>
							)}
						</>
					)}
				</View>
			)}
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
	permissionButton: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: Colors.border,
		backgroundColor: Colors.yellow,
	},
	resultCard: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 2,
		marginTop: 8,
		gap: 8,
	},
	resultSuccess: {
		backgroundColor: "rgba(0, 255, 0, 0.1)",
		borderColor: Colors.green,
	},
	resultRejected: {
		backgroundColor: "rgba(255, 0, 0, 0.1)",
		borderColor: Colors.red,
	},
	resultTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: Colors.textPrimary,
	},
	resultText: {
		fontSize: 18,
		color: Colors.textPrimary,
	},
	resultScore: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	}
});
