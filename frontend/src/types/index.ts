// User types
export type UserRole = "staff" | "parent" | "student";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// Student types
export interface Student {
  id: number;
  user_id: number;
  dob?: string | null;
  gender?: string | null;
  current_grade?: string | null;
  parent_id?: number | null;
  user: User;
}

export interface StudentCreate {
  name: string;
  email: string;
  password: string;
  dob?: string | null;
  gender?: string | null;
  current_grade?: string | null;
  parent_id?: number | null;
}

export interface StudentUpdate {
  name?: string;
  dob?: string | null;
  gender?: string | null;
  current_grade?: string | null;
  parent_id?: number | null;
}

// Parent types
export interface Parent {
  id: number;
  user_id: number;
  phone?: string | null;
  user: User;
}

export interface ParentCreate {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface ParentUpdate {
  name?: string;
  phone?: string | null;
}

// Class types
export interface Class {
  id: number;
  name: string;
  subject?: string | null;
  day_of_week?: string | null;
  time_slot?: string | null;
  teacher_name?: string | null;
  max_students?: number | null;
}

export interface ClassWithCount extends Class {
  current_students: number;
}

export interface ClassCreate {
  name: string;
  subject?: string | null;
  day_of_week?: string | null;
  time_slot?: string | null;
  teacher_name?: string | null;
  max_students?: number | null;
}

export interface ClassUpdate {
  name?: string;
  subject?: string | null;
  day_of_week?: string | null;
  time_slot?: string | null;
  teacher_name?: string | null;
  max_students?: number | null;
}

// Registration types
export interface ClassRegistration {
  id: number;
  student_id: number;
  class_id: number;
}

export interface RegistrationCreate {
  student_id: number;
}

export interface RegistrationDetail extends ClassRegistration {
  student_name: string;
  class_name: string;
  class_subject?: string | null;
  day_of_week?: string | null;
  time_slot?: string | null;
}

// Subscription types
export interface Subscription {
  id: number;
  student_id: number;
  package_name: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  is_active: boolean;
  student: Student; // Full student information
}

export interface SubscriptionCreate {
  student_id: number;
  package_name: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
}

export interface SubscriptionUpdate {
  package_name?: string;
  start_date?: string;
  end_date?: string;
  total_sessions?: number;
  used_sessions?: number;
}

export interface UseSessionRequest {
  sessions_to_use: number;
}

export interface SubscriptionDetail extends Subscription {
  student_name: string;
  student_grade?: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
