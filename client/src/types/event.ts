export interface EventOrganizer {
  id: string;
  displayName: string;
  username: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  location: string;
  latitude: number;
  longitude: number;
  maxAttendees: number;
  organizerId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organizer: EventOrganizer;
  participantCount: number;
  isParticipant?: boolean;
}

export interface EventCreate {
  title: string;
  description: string;
  category: 'SOCIAL' | 'SPORTS' | 'FOOD' | 'MUSIC' | 'OUTDOOR' | 'OTHER';
  startTime: string;
  location: string;
  latitude: number;
  longitude: number;
  maxAttendees: number;
}
