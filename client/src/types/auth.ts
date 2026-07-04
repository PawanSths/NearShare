export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface ProfileUser extends AuthUser {
  profilePhoto: string | null;
  bio: string | null;
  interests: string[];
  discoveryRadius: number;
}

export interface ProfileResponse {
  user: ProfileUser;
  createdEvents: Array<{
    id: string;
    title: string;
    category: string;
    startTime: string;
    location: string;
    status: string;
  }>;
  joinedEvents: Array<{
    id: string;
    title: string;
    category: string;
    startTime: string;
    location: string;
    status: string;
  }>;
}
