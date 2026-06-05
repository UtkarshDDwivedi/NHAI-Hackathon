import type { CameraRef } from "react-native-vision-camera";
import type { TfliteModel } from "react-native-fast-tflite";

import { decodeBox } from "./decode";
import { sigmoid } from "./sigmoid";
import { normalizeEmbedding } from "./similarity";

export async function extractEmbedding(
	camera: CameraRef,
	blazeFace: TfliteModel,
	mobileFaceNet: TfliteModel,
	anchors: number[][]
) {
	const snapshot =
		await camera.takeSnapshot();

	const resized =
		snapshot.resize(128, 128);

	const raw =
		resized.toRawPixelData();

	const pixels =
		new Uint8Array(raw.buffer);

	const input =
		new Float32Array(
			128 * 128 * 3
		);

	let j = 0;

	for (
		let i = 0;
		i < pixels.length;
		i += 4
	) {
		const b = pixels[i];
		const g = pixels[i + 1];
		const r = pixels[i + 2];

		input[j++] =
			(r - 127.5) / 127.5;

		input[j++] =
			(g - 127.5) / 127.5;

		input[j++] =
			(b - 127.5) / 127.5;
	}

	const outputs =
		blazeFace.runSync([
			input.buffer,
		]);

	const regressors =
		new Float32Array(
			outputs[0] as ArrayBuffer
		);

	const scores =
		new Float32Array(
			outputs[1] as ArrayBuffer
		);

	let bestIndex = -1;
	let bestScore = 0;

	for (
		let i = 0;
		i < scores.length;
		i++
	) {
		const confidence =
			sigmoid(scores[i]);

		if (
			confidence >
			bestScore
		) {
			bestScore =
				confidence;
			bestIndex = i;
		}
	}

	if (bestScore < 0.75) {
		throw new Error(
			"No face detected"
		);
	}

	const box = Array.from(
		regressors.slice(
			bestIndex * 16,
			bestIndex * 16 + 4
		)
	);

	const decoded =
		decodeBox(
			box,
			anchors[bestIndex]
		);

	const x =
		decoded.x *
		snapshot.width;

	const y =
		decoded.y *
		snapshot.height;

	const w =
		decoded.width *
		snapshot.width;

	const h =
		decoded.height *
		snapshot.height;

	const cropX = Math.max(0, x - w / 2);
	const cropY = Math.max(0, y - h / 2);
	const cropW = Math.min(snapshot.width - cropX, w);
	const cropH = Math.min(snapshot.height - cropY, h);

	const crop = snapshot.crop(cropX, cropY, cropW, cropH);

	const face =
		crop.resize(
			112,
			112
		);

	const faceRaw =
		face.toRawPixelData();

	const facePixels =
		new Uint8Array(
			faceRaw.buffer
		);

	const encoderInput =
		new Float32Array(
			112 *
				112 *
				3
		);

	let k = 0;

	for (
		let i = 0;
		i <
		facePixels.length;
		i += 4
	) {
		const b =
			facePixels[i];

		const g =
			facePixels[i + 1];

		const r =
			facePixels[i + 2];

		encoderInput[k++] =
			(r - 127.5) /
			127.5;

		encoderInput[k++] =
			(g - 127.5) /
			127.5;

		encoderInput[k++] =
			(b - 127.5) /
			127.5;
	}

	const embeddingOutput =
		mobileFaceNet.runSync([
			encoderInput.buffer,
		]);

	const embedding = new Float32Array(
		embeddingOutput[0] as ArrayBuffer
	);

	return {
		embedding: normalizeEmbedding(embedding),
		box: { x, y, width: w, height: h }
	};
}