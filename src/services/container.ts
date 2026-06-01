import { ReputationRepository } from '../repositories/ReputationRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { HealthSnapshotRepository } from '../repositories/HealthSnapshotRepository';
import { ReportRepository } from '../repositories/ReportRepository';
import { EventLogRepository } from '../repositories/EventLogRepository';

import { ReputationService } from './ReputationService';
import { AnalyticsAggregationService } from './AnalyticsAggregationService';
import { HealthScoreService } from './HealthScoreService';
import { ReportService } from './ReportService';

// Repositories
export const reputationRepo = new ReputationRepository();
export const analyticsRepo = new AnalyticsRepository();
export const healthRepo = new HealthSnapshotRepository();
export const reportRepo = new ReportRepository();
export const eventLogRepo = new EventLogRepository();

// Services
export const reputationService = new ReputationService(reputationRepo);
export const analyticsService = new AnalyticsAggregationService(analyticsRepo);
export const healthScoreService = new HealthScoreService(analyticsRepo, healthRepo);
export const reportService = new ReportService(analyticsRepo, reportRepo, healthRepo);
