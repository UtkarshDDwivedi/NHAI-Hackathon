import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({
  id: "face-embeddings"
});

export interface Personnel {
  id: string;
  name: string;
}

export function saveEmbedding(id: string, name: string, embedding: Float32Array) {
  const personnelJson = storage.getString("personnel") || "[]";
  const personnel: Personnel[] = JSON.parse(personnelJson);
  
  const existingIndex = personnel.findIndex(p => p.id === id);
  if (existingIndex === -1) {
    personnel.push({ id, name });
  } else {
    personnel[existingIndex].name = name;
  }
  
  storage.set("personnel", JSON.stringify(personnel));

  storage.set(`embedding_${id}`, embedding.buffer as ArrayBuffer);
}

export function loadEmbedding(id: string): Float32Array | null {
  const arrayBuffer = storage.getBuffer(`embedding_${id}`);
  if (!arrayBuffer) return null;

  return new Float32Array(arrayBuffer);
}

export function listPersonnel(): Personnel[] {
  const personnelJson = storage.getString("personnel") || "[]";
  return JSON.parse(personnelJson);
}

export function deleteEmbedding(id: string) {
  const personnelJson = storage.getString("personnel") || "[]";
  let personnel: Personnel[] = JSON.parse(personnelJson);
  personnel = personnel.filter(p => p.id !== id);
  storage.set("personnel", JSON.stringify(personnel));
  
  storage.remove(`embedding_${id}`);
}

export function loadAllEmbeddings(): { id: string; name: string; embedding: Float32Array }[] {
  const personnel = listPersonnel();
  const result: { id: string; name: string; embedding: Float32Array }[] = [];
  
  for (const p of personnel) {
    const embedding = loadEmbedding(p.id);
    if (embedding) {
      result.push({
        id: p.id,
        name: p.name,
        embedding
      });
    }
  }
  return result;
}
