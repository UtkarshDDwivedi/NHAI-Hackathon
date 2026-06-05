export function generateBlazeFaceAnchors() {
	const anchors: number[][] = [];

	// 16x16 layer
	for (let y = 0; y < 16; y++) {
		for (let x = 0; x < 16; x++) {
			const xCenter = (x + 0.5) / 16;
			const yCenter = (y + 0.5) / 16;

			anchors.push([xCenter, yCenter]);
			anchors.push([xCenter, yCenter]);
		}
	}

	// 8x8 layer
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const xCenter = (x + 0.5) / 8;
			const yCenter = (y + 0.5) / 8;

			for (let i = 0; i < 6; i++) {
				anchors.push([xCenter, yCenter]);
			}
		}
	}

	console.log("Generated anchors:", anchors.length);

	return anchors;
}