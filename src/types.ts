export type PlanetId = 'explore' | 'investigate' | 'debate' | 'connect' | 'create';

export interface Planet {
  id: PlanetId;
  name: string;
  subtitle: string;
  icon: string;
  description: string;
  color: string;
  accentColor: string;
}

export interface RocketCustomization {
  hullColor: string; // hex
  accentColor: string; // hex
  trailColor: string; // hex
  styleName: string;
}

export interface UserActivity {
  id: string;
  planetId: PlanetId;
  activityTitle: string;
  score: number;
  badgeEarned: string;
  completedAt: string;
}

export type WorkStatus = 'read' | 'reading' | 'want_to_read' | 'exploring' | 'used_in_challenge';

export interface UserWorkItem {
  id?: string;
  title: string;
  workTitle?: string;
  author: string;
  status: WorkStatus;
  dateAdded?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarRocket: RocketCustomization;
  readingStyle: string;
  readWorks: string[]; // List of works explicitly marked 'read'
  exploringWorks: string[]; // List of works marked 'exploring' (wishlist)
  workItems: UserWorkItem[]; // Comprehensive tracking of each work
  interests: string[];
  readingFrequency?: 'daily' | 'few_times_week' | 'weekend' | 'free_time' | '';
  experienceLevel: 'not_set' | 'beginner' | 'exploring' | 'regular' | 'avid';
  joinedDate: string;
  starsCount: number;
  visitedPlanets: PlanetId[]; // Planets visited (visited != completed)
  stats: {
    analysis: number; // 🔍 Phân tích
    multiPerspective: number; // ⚖️ Đa chiều
    criticalReasoning: number; // 🧠 Suy luận phản biện
    connection: number; // 🧩 Liên kết
    creativity: number; // ✨ Sáng tạo
  };
  completedActivities: UserActivity[];
  createdConstellations: ConstellationItem[];
  badgesWon?: string[];
  savedCreations?: {
    id: string;
    title: string;
    workTitle: string;
    content: string;
    date: string;
  }[];
  creativePerspectives?: CreativePerspective[];
}

export interface StoryBranchNode {
  id: string;
  stepType: 'original_plot' | 'turning_point' | 'user_choice' | 'new_development' | 'climax_ending';
  stepTitle: string;
  content: string;
  authorNote?: string;
  timestamp?: string;
}

export interface AIStoryPartnerAdvice {
  ideaOpens: string;
  rationalPoints: string[];
  considerations: string[];
  growthSuggestions: string[];
  openQuestions: string[];
}

export interface PerspectiveComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  starterType?: 'impression' | 'unthought' | 'agree' | 'explore_more' | 'custom';
}

export interface CreativePerspective {
  id: string;
  authorId: string;
  displayName: string;
  originalWorkId?: string;
  originalWorkTitle: string;
  originalWorkAuthor: string;
  characters?: string[];
  context?: string;
  turningPoint: string;
  originalSituationSummary: string;
  title: string;
  introduction: string;
  creativeContent: string;
  storyBranches: StoryBranchNode[];
  themes: string[];
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt?: string;
  empathyCount: number; // ♡ "Mình cũng từng nghĩ vậy"
  empathyUsers?: string[];
  bookmarkedBy?: string[];
  comments: PerspectiveComment[];
  aiPartnerAdvice?: AIStoryPartnerAdvice;
}

export interface BookWork {
  id: string;
  title: string;
  author: string;
  category: string;
  year?: string;
  shortSnippet: string;
}

export interface CommunityQuote {
  id: string;
  workTitle: string;
  author: string;
  quote: string;
  reflection: string;
  userName: string;
  userStyle: string;
  likes: number;
  insights: number;
  tags: string[];
  hasLiked?: boolean;
  hasInsight?: boolean;
  comments: Array<{
    id: string;
    userName: string;
    text: string;
    timestamp?: string;
    timeAgo?: string;
    avatar?: string;
  }>;
}

export interface DetectiveCase {
  id: string;
  workTitle: string;
  author: string;
  claim: string;
  context: string;
  guidingClues: string[];
  suggestedEvidences: string[];
  difficulty?: string;
}

export interface DebateTopic {
  id: string;
  title?: string;
  workTitle: string;
  author?: string;
  dilemma: string;
  stanceA: string;
  stanceB: string;
  contextPrompt?: string;
  rounds?: number;
}

export interface ConstellationItem {
  id: string;
  name: string;
  connectedThemes: string[];
  description: string;
  unlockedAt: string;
  color?: string;
}

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  whyRecommended: string;
  themes: string[];
  ponderQuestion: string;
  quoteSnippet: string;
}

export interface CreativeScenario {
  id: string;
  workTitle: string;
  author: string;
  title: string;
  promptScenario: string;
  characterFocus: string;
  inspirationalThought: string;
}
