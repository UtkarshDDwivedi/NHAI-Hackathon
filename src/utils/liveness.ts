export interface Landmark {
	x: number;
	y: number;
	z: number;
}

export function detectBlink(landmarks: Landmark[]) {
	const calcEAR = (eye: number[]) => {
		const p1 = landmarks[eye[0]];
		const p2 = landmarks[eye[1]];
		const p3 = landmarks[eye[2]];
		const p4 = landmarks[eye[3]];
		const p5 = landmarks[eye[4]];
		const p6 = landmarks[eye[5]];

		const v1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
		const v2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
		const h = Math.hypot(p1.x - p4.x, p1.y - p4.y);

		return (v1 + v2) / (2.0 * h);
	};

	// MediaPipe FaceMesh eye landmarks
	const leftEye = [33, 160, 158, 133, 153, 144];
	const rightEye = [362, 385, 387, 263, 373, 380];

	const leftEAR = calcEAR(leftEye);
	const rightEAR = calcEAR(rightEye);

	const ear = (leftEAR + rightEAR) / 2.0;

	return ear < 0.2; // Typical threshold for closed eyes
}

export function detectHeadTurn(landmarks: Landmark[]) {
	const nose = landmarks[1];
	const leftEar = landmarks[234];
	const rightEar = landmarks[454];

	const leftDist = Math.hypot(nose.x - leftEar.x, nose.y - leftEar.y);
	const rightDist = Math.hypot(nose.x - rightEar.x, nose.y - rightEar.y);

	const ratio = leftDist / rightDist;

	if (ratio > 1.5) return "left";
	if (ratio < 0.6) return "right";
	return "center";
}

export function verifyLiveness(landmarks: Landmark[]) {
	return {
		isBlinking: detectBlink(landmarks),
		headTurn: detectHeadTurn(landmarks),
	};
}
