import { createMMKV } from "react-native-mmkv";

const storage = createMMKV();

export function saveEmbedding(
	personId: string,
	embedding: number[]
) {
	storage.set(
		`embedding:${personId}`,
		JSON.stringify(embedding)
	);
}

export function loadEmbedding(
	personId: string
) {
	const data = storage.getString(
		`embedding:${personId}`
	);

	if (!data) return null;

	return new Float32Array(
		JSON.parse(data)
	);
}

export function getAllPersonnel() {
	const keys = storage
		.getAllKeys()
		.filter(k =>
			k.startsWith("embedding:")
		);

	return keys.map(k =>
		k.replace("embedding:", "")
	);
}