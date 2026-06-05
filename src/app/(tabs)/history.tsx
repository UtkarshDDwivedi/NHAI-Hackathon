import { Text, View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getLogs, clearLogs, type VerificationLog } from "@/storage/history";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function History() {
  const [logs, setLogs] = useState<VerificationLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLogs(getLogs());
    }, [])
  );

  const handleClear = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all verification logs?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            clearLogs();
            setLogs([]);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: VerificationLog }) => {
    const isSuccess = item.status === "success";
    const date = new Date(item.timestamp);
    
    return (
      <View style={[styles.card, isSuccess ? styles.cardSuccess : styles.cardRejected]}>
        <View style={styles.cardHeader}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isSuccess ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={isSuccess ? Colors.green : Colors.red} 
            />
            <Text style={[styles.statusText, { color: isSuccess ? Colors.green : Colors.red }]}>
              {isSuccess ? "Authenticated" : "Rejected"}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>

        {isSuccess ? (
          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.personName}>{item.personName}</Text>
              <Text style={styles.personId}>ID: {item.personId}</Text>
            </View>
            {item.score !== undefined && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{(item.score * 100).toFixed(1)}% Match</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.detailsRow}>
            <Text style={styles.personId}>Unknown Person</Text>
            {item.score !== undefined && (
              <View style={[styles.scoreBadge, { backgroundColor: 'rgba(255,0,0,0.1)' }]}>
                <Text style={[styles.scoreText, { color: Colors.red }]}>{(item.score * 100).toFixed(1)}% Match</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {logs.length > 0 && (
          <Pressable onPress={handleClear} style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.7 }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={Colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No verification logs yet.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    gap: 12,
  },
  cardSuccess: {
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  cardRejected: {
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  personName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  personId: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.green,
  }
});
