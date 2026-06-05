import type { TfliteModel } from "react-native-fast-tflite";

export function extractFaceMeshLandmarks(
	faceMesh: TfliteModel,
	facePixels: Uint8Array
) {
	const input = new Float32Array(192 * 192 * 3);

	let j = 0;
	for (let i = 0; i < facePixels.length; i += 4) {
		const b = facePixels[i];
		const g = facePixels[i + 1];
		const r = facePixels[i + 2];

		input[j++] = (r - 127.5) / 127.5;
		input[j++] = (g - 127.5) / 127.5;
		input[j++] = (b - 127.5) / 127.5;
	}

	const outputs = faceMesh.runSync([input.buffer]);

	// FaceMesh outputs:
	// regressors: [1, 1, 1, 1404] (468 landmarks * 3 coordinates)
	// face_flag: [1, 1, 1, 1]
	
	// Fast-TFLite might return them in different order depending on model version,
	// but normally regressors is the larger output.
	
	let regressorsArray: ArrayBuffer;
	let scoreArray: ArrayBuffer;

	if ((outputs[0] as ArrayBuffer).byteLength > (outputs[1] as ArrayBuffer).byteLength) {
		regressorsArray = outputs[0] as ArrayBuffer;
		scoreArray = outputs[1] as ArrayBuffer;
	} else {
		regressorsArray = outputs[1] as ArrayBuffer;
		scoreArray = outputs[0] as ArrayBuffer;
	}

	const regressors = new Float32Array(regressorsArray);
	const scoreRaw = new Float32Array(scoreArray);

	// scoreRaw[0] is typically un-normalized logit, apply sigmoid
	const score = 1 / (1 + Math.exp(-scoreRaw[0]));

	if (score < 0.5) {
		return null; // Face not present in mesh crop
	}

	const landmarks: { x: number; y: number; z: number }[] = [];
	for (let i = 0; i < 468; i++) {
		landmarks.push({
			x: regressors[i * 3],
			y: regressors[i * 3 + 1],
			z: regressors[i * 3 + 2],
		});
	}

	return landmarks;
}
