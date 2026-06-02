import { ReputationRepository } from '../repositories/ReputationRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { HealthSnapshotRepository } from '../repositories/HealthSnapshotRepository';
import { ReportRepository } from '../repositories/ReportRepository';
import { EventLogRepository } from '../repositories/EventLogRepository';
import { AISettingsRepository } from '../repositories/AISettingsRepository';
import { AIUsageRepository } from '../repositories/AIUsageRepository';
import { ConversationSummaryRepository } from '../repositories/ConversationSummaryRepository';
import { CommunityInsightRepository } from '../repositories/CommunityInsightRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';

import { ReputationService } from './ReputationService';
import { AnalyticsAggregationService } from './AnalyticsAggregationService';
import { HealthScoreService } from './HealthScoreService';
import { ReportService } from './ReportService';

import { GroqProvider } from './ai/providers/GroqProvider';
import { PromptManager } from './ai/PromptManager';
import { ContextBuilder } from './ai/ContextBuilder';
import { TokenManager } from './ai/TokenManager';
import { AISafetyService } from './ai/AISafetyService';
import { AIUsageTracker } from './ai/AIUsageTracker';
import { AIOrchestrator } from './ai/AIOrchestrator';

import { SummarizationService } from './ai/features/SummarizationService';
import { AIInsightsService } from './ai/features/AIInsightsService';
import { RecommendationService } from './ai/features/RecommendationService';
import { HealthExplanationService } from './ai/features/HealthExplanationService';
import { AIAssistantService } from './ai/features/AIAssistantService';
import { AIReportEnhancer } from './ai/features/AIReportEnhancer';

// Repositories
export const reputationRepo = new ReputationRepository();
export const analyticsRepo = new AnalyticsRepository();
export const healthRepo = new HealthSnapshotRepository();
export const reportRepo = new ReportRepository();
export const eventLogRepo = new EventLogRepository();

// AI Repositories
export const aiSettingsRepo = new AISettingsRepository();
export const aiUsageRepo = new AIUsageRepository();
export const conversationSummaryRepo = new ConversationSummaryRepository();
export const communityInsightRepo = new CommunityInsightRepository();
export const recommendationRepo = new RecommendationRepository();

// Services
export const reputationService = new ReputationService(reputationRepo);
export const analyticsService = new AnalyticsAggregationService(analyticsRepo);
export const healthScoreService = new HealthScoreService(analyticsRepo, healthRepo);
export const reportService = new ReportService(analyticsRepo, reportRepo, healthRepo);

// AI Core Foundation
const aiProvider = new GroqProvider();
const promptManager = new PromptManager();
const contextBuilder = new ContextBuilder(analyticsRepo, healthRepo, reportRepo);
const tokenManager = new TokenManager();
const aiSafetyService = new AISafetyService(aiSettingsRepo, aiUsageRepo);
const aiUsageTracker = new AIUsageTracker(aiUsageRepo);

export const aiOrchestrator = new AIOrchestrator(
  aiProvider,
  promptManager,
  contextBuilder,
  tokenManager,
  aiSafetyService,
  aiUsageTracker
);

// AI Feature Services
export const summarizationService = new SummarizationService(aiOrchestrator, conversationSummaryRepo);
export const aiInsightsService = new AIInsightsService(aiOrchestrator, communityInsightRepo, contextBuilder);
export const aiRecommendationService = new RecommendationService(aiOrchestrator, recommendationRepo, contextBuilder);
export const healthExplanationService = new HealthExplanationService(aiOrchestrator, healthRepo);
export const aiAssistantService = new AIAssistantService(aiOrchestrator, contextBuilder);
export const aiReportEnhancer = new AIReportEnhancer(aiOrchestrator);
