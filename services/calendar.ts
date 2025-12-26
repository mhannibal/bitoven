import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';
import type { ExtractedTask } from './task-extraction';

export async function requestCalendarPermissions(): Promise<boolean> {
  // Web doesn't need permissions
  if (Platform.OS === 'web') {
    return true;
  }
  
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is needed to create events from your tasks.'
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Calendar permission error:', error);
    return false;
  }
}

export async function getDefaultCalendar(): Promise<string | null> {
  // Web doesn't use calendar ID
  if (Platform.OS === 'web') {
    return 'web';
  }
  
  try {
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return defaultCalendar.id;
    } else {
      // Android: Find or create a calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Try to find user's primary calendar - prioritize Google Calendar
      let primaryCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.isPrimary
      );
      
      // Fallback to any Google calendar
      if (!primaryCalendar) {
        primaryCalendar = calendars.find(
          (cal) => cal.allowsModifications && (cal.source.name === 'Google' || cal.source.type === 'com.google')
        );
      }
      
      // Fallback to any writable calendar
      if (!primaryCalendar) {
        primaryCalendar = calendars.find((cal) => cal.allowsModifications);
      }
      
      if (!primaryCalendar && calendars.length > 0) {
        console.log('Available calendars:', calendars.map(c => ({
          id: c.id,
          title: c.title,
          source: c.source.name,
          allowsModifications: c.allowsModifications
        })));
      }
      
      return primaryCalendar?.id || null;
    }
  } catch (error) {
    console.error('Get default calendar error:', error);
    return null;
  }
}

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

// Format date for iCalendar format (YYYYMMDDTHHMMSSZ)
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Create .ics file content with all tasks
function createICalContent(tasks: ExtractedTask[]): string {
  const events = tasks.map(task => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 86400000);
    
    const startDate = new Date(dueDate);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0);
    
    const uid = `bithoven-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create alarm based on priority
    let valarm = '';
    if (task.priority === 'high') {
      valarm = `BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Task reminder
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1440M
ACTION:DISPLAY
DESCRIPTION:Task reminder (1 day before)
END:VALARM`;
    } else if (task.priority === 'medium') {
      valarm = `BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Task reminder
END:VALARM`;
    } else {
      valarm = `BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Task reminder
END:VALARM`;
    }
    
    return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startDate)}
DTEND:${formatICalDate(endDate)}
SUMMARY:${task.title}
DESCRIPTION:Priority: ${task.priority || 'normal'}\\nCreated by Bithoven
${valarm}
END:VEVENT`;
  }).join('\n');
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bithoven//Voice to Tasks//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;
}

// Download .ics file for web
function downloadICalFile(tasks: ExtractedTask[]): void {
  const icalContent = createICalContent(tasks);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bithoven-tasks-${Date.now()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function addTaskToCalendar(
  task: ExtractedTask,
  calendarId: string
): Promise<CreateEventResult> {
  try {
    // Native: Use expo-calendar
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 86400000);
    
    const startDate = new Date(dueDate);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0);
    
    const alarms = [];
    if (task.priority === 'high') {
      alarms.push({ relativeOffset: -60 });
      alarms.push({ relativeOffset: -1440 });
    } else if (task.priority === 'medium') {
      alarms.push({ relativeOffset: -60 });
    } else {
      alarms.push({ relativeOffset: -30 });
    }
    
    // Use device's default timezone for better Android compatibility
    const eventDetails: any = {
      title: task.title,
      startDate: startDate,
      endDate: endDate,
      alarms: alarms,
      notes: `Priority: ${task.priority || 'normal'}\nCreated by Bithoven`,
    };
    
    // Only add timeZone for iOS, Android handles it automatically
    if (Platform.OS === 'ios') {
      eventDetails.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    
    return {
      success: true,
      eventId,
    };
  } catch (error) {
    console.error('Add task to calendar error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create calendar event',
    };
  }
}

export async function addTasksToCalendar(
  tasks: ExtractedTask[]
): Promise<{ successful: number; failed: number }> {
  // Web: Download .ics file with all tasks
  if (Platform.OS === 'web') {
    try {
      downloadICalFile(tasks);
      // User needs to manually import the file to their calendar
      return { successful: tasks.length, failed: 0 };
    } catch (error) {
      console.error('Failed to download calendar file:', error);
      return { successful: 0, failed: tasks.length };
    }
  }
  
  // Native: Request permissions and add each task
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    return { successful: 0, failed: tasks.length };
  }
  
  const calendarId = await getDefaultCalendar();
  if (!calendarId) {
    Alert.alert('Error', 'Could not find a calendar to add events to');
    return { successful: 0, failed: tasks.length };
  }
  
  let successful = 0;
  let failed = 0;
  
  for (const task of tasks) {
    const result = await addTaskToCalendar(task, calendarId);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  return { successful, failed };
}
