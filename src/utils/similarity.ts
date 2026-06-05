export function normalizeEmbedding(
	embedding: Float32Array
) {
	let norm = 0;

	for (let i = 0; i < embedding.length; i++) {
		norm += embedding[i] * embedding[i];
	}

	norm = Math.sqrt(norm) + 1e-8;

	const result = new Float32Array(
		embedding.length
	);

	for (let i = 0; i < embedding.length; i++) {
		result[i] = embedding[i] / norm;
	}

	return result;
}

export function cosineSimilarity(
	a: Float32Array,
	b: Float32Array
) {
	let dot = 0;

	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
	}

	return dot;
}

export function bestMatch(
	currentEmbedding: Float32Array,
	allStoredEmbeddings: { id: string; name: string; embedding: Float32Array }[]
) {
	let bestScore = -1;
	let bestPerson: { id: string; name: string } | null = null;

	for (const person of allStoredEmbeddings) {
		const score = cosineSimilarity(currentEmbedding, person.embedding);
		if (score > bestScore) {
			bestScore = score;
			bestPerson = { id: person.id, name: person.name };
		}
	}

	return {
		personId: bestPerson?.id,
		personName: bestPerson?.name,
		score: bestScore,
	};
}