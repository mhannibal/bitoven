import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { addTasksToCalendar } from '@/services/calendar';
import type { ExtractedTask } from '@/services/task-extraction';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function TranscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text: string; tasksJson?: string }>();
  const transcription = params.text || '';
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  
  // Parse tasks from JSON string
  const tasks: ExtractedTask[] = params.tasksJson 
    ? JSON.parse(params.tasksJson as string) 
    : [];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#999';
    }
  };

  const handleAddToCalendar = async () => {
    if (tasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks to add to calendar');
      return;
    }

    setIsAddingToCalendar(true);
    
    try {
      const result = await addTasksToCalendar(tasks);
      
      if (result.successful > 0) {
        if (Platform.OS === 'web') {
          Alert.alert(
            'Calendar File Downloaded',
            `A calendar file with ${result.successful} task${result.successful > 1 ? 's' : ''} has been downloaded. Open it to import into Google Calendar or any calendar app.`
          );
        } else {
          Alert.alert(
            'Success',
            `${result.successful} task${result.successful > 1 ? 's' : ''} added to calendar${result.failed > 0 ? `\n${result.failed} failed` : ''}`
          );
        }
      } else {
        Alert.alert('Error', 'Failed to add tasks to calendar');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add to calendar');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Results</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Original Transcription */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📝 Transcription
          </ThemedText>
          <ThemedView style={styles.transcriptionContainer}>
            <ThemedText style={styles.transcriptionText}>
              {transcription || 'No transcription available'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Extracted Tasks */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ✅ Extracted Tasks ({tasks.length})
          </ThemedText>
          
          {tasks.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No actionable tasks found
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.tasksContainer}>
              {tasks.map((task, index) => (
                <ThemedView key={index} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <ThemedText style={styles.taskTitle}>
                      {task.title}
                    </ThemedText>
                    {task.priority && (
                      <View 
                        style={[
                          styles.priorityBadge, 
                          { backgroundColor: getPriorityColor(task.priority) }
                        ]}>
                        <ThemedText style={styles.priorityText}>
                          {task.priority}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  {task.dueDate && (
                    <ThemedText style={styles.dueDateText}>
                      📅 {task.dueDate}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.footer}>
        {tasks.length > 0 && (
          <Pressable
            onPress={handleAddToCalendar}
            disabled={isAddingToCalendar}
            style={({ pressed }) => [
              styles.calendarButton,
              isAddingToCalendar && styles.calendarButtonDisabled,
              pressed && styles.calendarButtonPressed,
            ]}>
            {isAddingToCalendar ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <ThemedText style={styles.calendarButtonText}>
                  📅 Add to Google Calendar
                </ThemedText>
              </>
            )}
          </Pressable>
        )}
        
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <ThemedText style={styles.backButtonText}>← New Recording</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  transcriptionContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  tasksContainer: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dueDateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  calendarButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  calendarButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  calendarButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
