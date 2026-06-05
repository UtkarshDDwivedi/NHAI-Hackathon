export function normalizeEmbedding(
	embedding: Float32Array
) {
	let norm = 0;

	for (let i = 0; i < embedding.length; i++) {
		norm += embedding[i] * embedding[i];
	}

	norm = Math.sqrt(norm) + 1e-8;

	const output = new Float32Array(embedding.length);

	for (let i = 0; i < embedding.length; i++) {
		output[i] = embedding[i] / norm;
	}

	return output;
}

export function cosineSimilarity(
	a: Float32Array,
	b: Float32Array
) {
	let dot = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	return (
		dot /
		(Math.sqrt(normA) * Math.sqrt(normB) + 1e-8)
	);
}