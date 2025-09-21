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
}

const normaliseSkillScores = (input: unknown): Record<string, number | null> | undefined => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, unknown>).reduce<Record<string, number | null>>(
    (acc, [key, value]) => {
      if (value === null) {
        acc[key] = null;
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

  const latest = rows[0];
  const skillScores = normaliseSkillScores(latest.skill_scores);
  const strengths = normaliseStringList(latest.strengths);
  const weaknesses = normaliseStringList(latest.weaknesses);
  const recommendedRoles = normaliseStringList(latest.recommended_roles);
  const developmentSuggestions = normaliseStringList(latest.development_suggestions);
  const summary = extractSummaryText(latest);

  const hasData =
    summary ||
    (strengths && strengths.length > 0) ||
    (weaknesses && weaknesses.length > 0) ||
    (recommendedRoles && recommendedRoles.length > 0) ||
    (developmentSuggestions && developmentSuggestions.length > 0) ||
    (skillScores && Object.keys(skillScores).length > 0) ||
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
  };
};
