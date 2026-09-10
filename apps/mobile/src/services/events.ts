import type { AuthUser } from '@/auth/AuthProvider';
import { supabase } from '@/services/supabase';

export type EventCategory = 'assessment' | 'meeting' | 'training' | 'seminar' | 'event';
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EventStatus = 'draft' | 'scheduled';

export type EventInput = {
  title: string;
  description: string;
  department: string;
  category: EventCategory;
  priority: EventPriority;
  audience: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
};

export type CreatedEvent = { message: string; row: string[] };

function parseManilaDate(value: string) {
  const normalized = value.trim().replace(' ', 'T');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) throw new Error('Use YYYY-MM-DD HH:mm for event dates.');
  const date = new Date(`${normalized}:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid event date and time.');
  return date;
}

function displayDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(date);
}

export async function createEvent(input: EventInput, user: AuthUser, demoMode: boolean): Promise<CreatedEvent> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3 || title.length > 120) throw new Error('Event title must contain 3 to 120 characters.');
  if (description.length > 1000) throw new Error('Description cannot exceed 1,000 characters.');
  const startsAt = parseManilaDate(input.startsAt);
  const endsAt = parseManilaDate(input.endsAt);
  if (endsAt <= startsAt) throw new Error('End date and time must be after the start.');
  const row = [title, displayDate(startsAt), input.audience, `${user.firstName} ${user.lastName}`, input.status === 'scheduled' ? 'Scheduled' : 'Draft'];
  if (demoMode) return { message: 'Event added to the validation dataset.', row };
  if (!supabase) throw new Error('APMS is not connected. The event was not created.');
  const { data: department, error: departmentError } = await supabase.from('departments').select('id').eq('name', input.department).maybeSingle();
  if (departmentError) throw departmentError;
  if (!department) throw new Error('The selected department is not available in APMS.');
  const { error } = await supabase.from('events').insert({ department_id: department.id, title, description, category: input.category, priority: input.priority, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), audience: { label: input.audience }, status: input.status, created_by: user.id });
  if (error) throw error;
  return { message: 'Event created successfully.', row };
}
