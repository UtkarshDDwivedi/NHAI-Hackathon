export function decodeBox(
	box: number[],
	anchor: number[],
	inputSize = 128
) {
	const dx = box[0];
	const dy = box[1];
	const w = box[2];
	const h = box[3];

	const anchorX = anchor[0];
	const anchorY = anchor[1];

	const centerX = dx / inputSize + anchorX;
	const centerY = dy / inputSize + anchorY;

	const width = w / inputSize;
	const height = h / inputSize;

	return {
		x: centerX,
		y: centerY,
		width,
		height,
	};
}