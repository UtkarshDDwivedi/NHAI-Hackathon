import { createMMKV } from "react-native-mmkv";

const historyStorage = createMMKV({
  id: "verification-history"
});

export interface VerificationLog {
  id: string;
  timestamp: string;
  status: "success" | "rejected";
  personId?: string;
  personName?: string;
  score?: number;
}

export function saveLog(log: Omit<VerificationLog, "id">) {
  const currentLogsJson = historyStorage.getString("logs") || "[]";
  const logs: VerificationLog[] = JSON.parse(currentLogsJson);
  
  const newLog: VerificationLog = {
    ...log,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
  };
  
  // Prepend to show newest first
  logs.unshift(newLog);
  
  // Keep only the last 100 logs to save space
  if (logs.length > 100) {
    logs.pop();
  }
  
  historyStorage.set("logs", JSON.stringify(logs));
}

export function getLogs(): VerificationLog[] {
  const logsJson = historyStorage.getString("logs") || "[]";
  return JSON.parse(logsJson);
}

export function clearLogs() {
  historyStorage.remove("logs");
}
