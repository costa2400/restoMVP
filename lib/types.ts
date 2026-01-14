// Database table types
export type UserRole = 'server' | 'manager' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'guest' | 'revoked';
export type ShiftStatus = 'open' | 'claimed' | 'approved' | 'denied' | 'completed' | 'expired';
export type NotificationType = 'shift_posted' | 'shift_claimed' | 'approval_needed' | 'approved' | 'denied';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  years_experience: number | null;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  user_id: string;
  restaurant_id: string;
  status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  posted_by: string;
  restaurant_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: ShiftStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  shift_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  sent_at: string | null;
}

// Extended types with relations
export interface ShiftWithRelations extends Shift {
  posted_by_user?: User;
  claimed_by_user?: User;
  restaurant?: Restaurant;
}

export interface VerificationWithRestaurant extends Verification {
  restaurant?: Restaurant;
}
