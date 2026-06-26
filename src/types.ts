export interface Activity {
  id: string;
  name: string;
  category: 'outdoor' | 'culture' | 'food' | 'family' | 'adventure' | 'relaxation';
  description: string;
  address: string;
  latitude: number; // relative offset or simulated coordinates
  longitude: number; // relative offset or simulated coordinates
  cost: 'Free' | '$' | '$$' | '$$$';
  duration: string; // e.g., "1-2 hours"
  rating: number; // e.g., 4.7
  reviewsCount: number;
  bestTime: string; // e.g., "Morning" or "Sunset"
  tips: string[];
  localSecret?: string; // a special local tip or fun fact
}

export interface DayPlan {
  id: string;
  date: string;
  cityName: string;
  activities: {
    activityId: string;
    slot: 'Morning' | 'Afternoon' | 'Evening';
    notes?: string;
  }[];
}

export interface SearchHistoryItem {
  id: string;
  location: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
