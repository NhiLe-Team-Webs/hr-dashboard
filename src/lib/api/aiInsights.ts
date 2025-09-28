import type { CandidateAIInsights } from './types';

export interface SupabaseResultRow {
  id: string;
  overall_score: number | null;
  skill_scores: Record<string, unknown> | null;
  strengths: unknown;
  weaknesses: unknown;
  recommended_roles: unknown;
  summary: string | null;
  development_suggestions: unknown;
  ai_summary: Record<string, unknown> | null;
  analysis_model: string | null;
  analysis_version: string | null;
  analysis_completed_at: string | null;
  created_at?: string | null;
  role_fit?: Record<string, unknown> | null;
  time_analysis?: Record<string, unknown> | null;
  cheating_summary?: Record<string, unknown> | null;
  personality_traits?: Record<string, unknown> | null;
  insight_locale?: string | null;
  insight_version?: string | null;
}

const isPlainObject = (input: unknown): input is Record<string, unknown> =>
  Boolean(input) && typeof input === 'object' && !Array.isArray(input);

const normaliseNumericRecord = (input: unknown): Record<string, number | null> | undefined => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, unknown>).reduce<Record<string, number | null>>(
    (acc, [key, value]) => {
      if (value === null) {
        acc[key] = null;
        return acc;
      }

      if (value && typeof value === 'object' && 'score' in (value as Record<string, unknown>)) {
        const rawScore = (value as Record<string, unknown>).score;
        const numericScore = typeof rawScore === 'number' ? rawScore : Number(rawScore);
        if (!Number.isNaN(numericScore) && Number.isFinite(numericScore)) {
          acc[key] = numericScore;
        }
        return acc;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        acc[key] = value;
        return acc;
      }

      const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        acc[key] = parsed;
      }

      return acc;
    },
    {},
  );

  return Object.keys(entries).length > 0 ? entries : undefined;
};

const normaliseSkillScores = normaliseNumericRecord;

const normaliseStringList = (input: unknown): string[] | undefined => {
  if (!input) {
    return undefined;
  }

  if (Array.isArray(input)) {
    const items = input
      .map((entry) => {
        if (typeof entry === 'string') {
          const trimmed = entry.trim();
          return trimmed.length > 0 ? trimmed : null;
        }

        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>;

          if (typeof record.title === 'string' && record.title.trim().length > 0) {
            const title = record.title.trim();
            const description =
              typeof record.description === 'string' && record.description.trim().length > 0
                ? record.description.trim()
                : undefined;
            return description ? `${title}: ${description}` : title;
          }

          if (typeof record.summary === 'string' && record.summary.trim().length > 0) {
            return record.summary.trim();
          }

          if ('value' in record && typeof record.value === 'string' && record.value.trim().length > 0) {
            return record.value.trim();
          }
        }

        return null;
      })
      .filter((value): value is string => Boolean(value));

    return items.length > 0 ? items : undefined;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return undefined;
    }

    const tokens = trimmed
      .split(/\r?\n|[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);

    return tokens.length > 0 ? tokens : [trimmed];
  }

  return undefined;
};

const extractSummaryText = (row: SupabaseResultRow): string | undefined => {
  if (typeof row.summary === 'string' && row.summary.trim().length > 0) {
    return row.summary.trim();
  }

  const aiSummary = row.ai_summary;
  if (aiSummary && typeof aiSummary === 'object' && 'summary' in aiSummary) {
    const summaryCandidate = (aiSummary as Record<string, unknown>).summary;
    if (typeof summaryCandidate === 'string') {
      const summaryText = summaryCandidate.trim();
      if (summaryText.length > 0) {
        return summaryText;
      }
    }
  }

  return undefined;
};

export const mapAiInsights = (rows?: SupabaseResultRow[] | null): CandidateAIInsights | undefined => {
  if (!rows || rows.length === 0) {
    return undefined;
  }

  const sortedRows = [...rows].sort((a, b) => {
    const getTimestamp = (value?: string | null) => (value ? Date.parse(value) : Number.NEGATIVE_INFINITY);
    const bCompleted = getTimestamp(b.analysis_completed_at);
    const aCompleted = getTimestamp(a.analysis_completed_at);
    if (bCompleted !== aCompleted) {
      return bCompleted - aCompleted;
    }
    const bCreated = getTimestamp(b.created_at);
    const aCreated = getTimestamp(a.created_at);
    return bCreated - aCreated;
  });

  const latest = sortedRows[0];
  const skillScores = normaliseSkillScores(latest.skill_scores);
  const strengths = normaliseStringList(latest.strengths);
  const weaknesses = normaliseStringList(latest.weaknesses);
  const recommendedRoles = normaliseStringList(latest.recommended_roles);
  const developmentSuggestions = normaliseStringList(latest.development_suggestions);
  const roleFit = normaliseNumericRecord(latest.role_fit);
  const timeAnalysis = isPlainObject(latest.time_analysis) ? latest.time_analysis : undefined;
  const cheatingSummary = isPlainObject(latest.cheating_summary) ? latest.cheating_summary : undefined;
  const personalityTraits = isPlainObject(latest.personality_traits) ? latest.personality_traits : undefined;
  const summary = extractSummaryText(latest);

  const hasData =
    summary ||
    (strengths && strengths.length > 0) ||
    (weaknesses && weaknesses.length > 0) ||
    (recommendedRoles && recommendedRoles.length > 0) ||
    (developmentSuggestions && developmentSuggestions.length > 0) ||
    (skillScores && Object.keys(skillScores).length > 0) ||
    (roleFit && Object.keys(roleFit).length > 0) ||
    (timeAnalysis && Object.keys(timeAnalysis).length > 0) ||
    (cheatingSummary && Object.keys(cheatingSummary).length > 0) ||
    (personalityTraits && Object.keys(personalityTraits).length > 0) ||
    latest.overall_score != null ||
    latest.analysis_model ||
    latest.analysis_version ||
    latest.analysis_completed_at;

  if (!hasData) {
    return undefined;
  }

  return {
    overallScore: latest.overall_score ?? undefined,
    skillScores,
    strengths,
    weaknesses,
    recommendedRoles,
    summary,
    developmentSuggestions,
    rawAiSummary: latest.ai_summary ?? null,
    model: latest.analysis_model ?? undefined,
    version: latest.analysis_version ?? undefined,
    analysisCompletedAt: latest.analysis_completed_at ?? undefined,
    createdAt: latest.created_at ?? undefined,
    insightLocale: latest.insight_locale ?? undefined,
    insightVersion: latest.insight_version ?? undefined,
    roleFit,
    timeAnalysis: timeAnalysis ?? undefined,
    cheatingSummary: cheatingSummary ?? undefined,
    personalityTraits: personalityTraits ?? undefined,
  };
};
