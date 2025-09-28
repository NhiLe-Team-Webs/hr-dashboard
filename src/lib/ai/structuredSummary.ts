export const EMPTY_VALUE = '—';

export const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(value);

export const formatDetailValue = (value: unknown): string => {
  if (value == null) {
    return EMPTY_VALUE;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatNumber(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : EMPTY_VALUE;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatDetailValue(item))
      .filter((item) => item && item !== EMPTY_VALUE);
    return items.length > 0 ? items.join(', ') : EMPTY_VALUE;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${key}: ${formatDetailValue(nested)}`)
      .filter((entry) => entry && !entry.endsWith(`: ${EMPTY_VALUE}`));
    return entries.length > 0 ? entries.join('; ') : EMPTY_VALUE;
  }

  return String(value);
};

export const toDisplayEntries = (input?: Record<string, unknown> | null) => {
  if (!input) {
    return [] as Array<{ key: string; value: string }>;
  }

  return Object.entries(input).map(([key, value]) => ({
    key,
    value: formatDetailValue(value),
  }));
};

const SUMMARY_IGNORED_KEYS = new Set<string>([
  'title',
  'name',
  'label',
  'heading',
  'description',
  'summary',
  'detail',
  'details',
  'overview',
  'note',
  'notes',
  'text',
  'items',
  'points',
  'bullets',
  'list',
  'highlights',
  'sections',
  'segments',
  'metrics',
  'scores',
  'values',
  'entries',
  'attributes',
  'data',
  'content',
  'children',
  'body',
]);

const formatSummaryLabel = (input: string) =>
  input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export interface StructuredSummarySection {
  id: string;
  title: string;
  description?: string;
  bullets?: string[];
  content?: Array<{ label: string; value: string }>;
}

export interface ParsedStructuredSummary {
  plainText: string | null;
  sections: StructuredSummarySection[];
}

const normaliseSummaryListItem = (item: unknown): string | null => {
  if (item == null) {
    return null;
  }

  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof item === 'number' && Number.isFinite(item)) {
    return formatNumber(item);
  }

  if (typeof item === 'boolean') {
    return item ? 'Có' : 'Không';
  }

  if (Array.isArray(item)) {
    const nested = item
      .map((entry) => normaliseSummaryListItem(entry))
      .filter((entry): entry is string => Boolean(entry));
    return nested.length > 0 ? nested.join(', ') : null;
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const title =
      typeof record.title === 'string'
        ? record.title
        : typeof record.name === 'string'
          ? record.name
          : typeof record.label === 'string'
            ? record.label
            : typeof record.heading === 'string'
              ? record.heading
              : undefined;

    const descriptionCandidates = ['description', 'detail', 'summary', 'note', 'text', 'value'];
    const description = descriptionCandidates
      .map((key) => record[key])
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    const scoreCandidateKeys = ['score', 'rating', 'percentage'];
    const scoreCandidate = scoreCandidateKeys
      .map((key) => record[key])
      .find((value) => typeof value === 'number' || typeof value === 'string');

    let scoreText: string | undefined;
    if (typeof scoreCandidate === 'number' && Number.isFinite(scoreCandidate)) {
      scoreText = formatNumber(scoreCandidate);
    } else if (typeof scoreCandidate === 'string') {
      const trimmed = scoreCandidate.trim();
      if (trimmed.length > 0) {
        scoreText = trimmed;
      }
    }

    const parts: string[] = [];
    if (title) {
      parts.push(title);
    }

    if (description) {
      parts.push(description);
    }

    if (scoreText) {
      parts.push(`Score: ${scoreText}`);
    }

    if (parts.length > 0) {
      return parts.join(' — ');
    }

    const fallback = formatDetailValue(item);
    return fallback && fallback !== EMPTY_VALUE ? fallback : null;
  }

  const fallback = formatDetailValue(item);
  return fallback && fallback !== EMPTY_VALUE ? fallback : null;
};

interface SummaryJsonParseResult {
  parsed: unknown | null;
  prefix?: string;
  suffix?: string;
}

const tryParseSummaryJson = (raw: string): SummaryJsonParseResult => {
  const trimmed = raw.trim();

  try {
    return { parsed: JSON.parse(trimmed) };
  } catch (error) {
    // Continue with substring attempts below.
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return {
        parsed: JSON.parse(candidate),
        prefix: trimmed.slice(0, firstBrace).trim() || undefined,
        suffix: trimmed.slice(lastBrace + 1).trim() || undefined,
      };
    } catch (error) {
      // Continue to bracket attempt.
    }
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.slice(firstBracket, lastBracket + 1);
    try {
      return {
        parsed: JSON.parse(candidate),
        prefix: trimmed.slice(0, firstBracket).trim() || undefined,
        suffix: trimmed.slice(lastBracket + 1).trim() || undefined,
      };
    } catch (error) {
      // Fall through to null response.
    }
  }

  return { parsed: null };
};

export const parseStructuredSummary = (raw?: string | null): ParsedStructuredSummary => {
  if (!raw) {
    return { plainText: null, sections: [] };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { plainText: null, sections: [] };
  }

  const { parsed, prefix, suffix } = tryParseSummaryJson(trimmed);
  if (parsed == null) {
    return { plainText: trimmed, sections: [] };
  }

  const additionalTextCandidates = [prefix, suffix].filter(
    (value): value is string => Boolean(value && value.trim().length > 0),
  );
  const additionalText = additionalTextCandidates.length > 0 ? additionalTextCandidates.join('\n\n') : null;

  if (typeof parsed === 'string') {
    const combined = [parsed.trim(), additionalText].filter((value) => value && value.length > 0).join('\n\n');
    return { plainText: combined || null, sections: [] };
  }

  const sections: StructuredSummarySection[] = [];

  const addSection = (section: StructuredSummarySection) => {
    const bullets = section.bullets?.filter((item) => item && item.trim().length > 0);
    const content = section.content?.filter((entry) => entry.value && entry.value !== EMPTY_VALUE);
    const description = typeof section.description === 'string' ? section.description.trim() : section.description;

    if (!description && (!bullets || bullets.length === 0) && (!content || content.length === 0)) {
      return;
    }

    sections.push({
      ...section,
      description: description ?? undefined,
      bullets,
      content,
    });
  };

  const handleRecord = (record: Record<string, unknown>, fallbackTitle: string, baseId: string) => {
    if (Array.isArray(record.sections)) {
      record.sections.forEach((sectionValue, index) => {
        const nestedId = `${baseId}-section-${index + 1}`;
        if (sectionValue && typeof sectionValue === 'object') {
          handleRecord(sectionValue as Record<string, unknown>, fallbackTitle, nestedId);
        } else if (Array.isArray(sectionValue)) {
          handleArray(sectionValue, fallbackTitle, nestedId);
        }
      });
    }

    const titleCandidateKeys = ['title', 'name', 'label', 'heading'];
    const titleCandidate = titleCandidateKeys
      .map((key) => record[key])
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    const descriptionCandidateKeys = ['description', 'summary', 'detail', 'overview', 'note', 'text', 'body'];
    const descriptionCandidate = descriptionCandidateKeys
      .map((key) => record[key])
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    const bulletKeyCandidates = [
      'highlights',
      'items',
      'points',
      'bullets',
      'list',
      'strengths',
      'weaknesses',
      'developmentAreas',
      'opportunities',
      'recommendations',
    ];

    const bullets: string[] = [];
    for (const key of bulletKeyCandidates) {
      const value = record[key];
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          const normalised = normaliseSummaryListItem(entry);
          if (normalised) {
            bullets.push(normalised);
          }
        });
      }
    }

    const nestedContent: Array<{ label: string; value: string }> = [];

    const ignoredKeys = new Set([
      ...SUMMARY_IGNORED_KEYS,
      ...titleCandidateKeys,
      ...descriptionCandidateKeys,
      ...bulletKeyCandidates,
    ]);

    for (const [key, value] of Object.entries(record)) {
      if (ignoredKeys.has(key)) {
        continue;
      }

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          const nestedList = value
            .map((item) => normaliseSummaryListItem(item))
            .filter((item): item is string => Boolean(item));
          if (nestedList.length > 0) {
            nestedContent.push({
              label: formatSummaryLabel(key),
              value: nestedList.join(', '),
            });
            continue;
          }
        } else {
          const nestedEntries = toDisplayEntries(value as Record<string, unknown>).filter(
            (entry) => entry.value && entry.value !== EMPTY_VALUE,
          );
          if (nestedEntries.length > 0) {
            nestedContent.push({
              label: formatSummaryLabel(key),
              value: nestedEntries.map((entry) => `${formatSummaryLabel(entry.key)}: ${entry.value}`).join('; '),
            });
            continue;
          }
        }
      }

      const formattedValue = formatDetailValue(value);
      if (formattedValue && formattedValue !== EMPTY_VALUE) {
        nestedContent.push({
          label: formatSummaryLabel(key),
          value: formattedValue,
        });
      }
    }

    addSection({
      id: baseId,
      title: titleCandidate ?? formatSummaryLabel(fallbackTitle),
      description: descriptionCandidate,
      bullets: bullets.length > 0 ? bullets : undefined,
      content: nestedContent.length > 0 ? nestedContent : undefined,
    });
  };

  const handleArray = (value: unknown[], fallbackTitle: string, baseId: string) => {
    const simpleItems: string[] = [];

    value.forEach((entry, index) => {
      if (entry == null) {
        return;
      }

      if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
        const normalised = normaliseSummaryListItem(entry);
        if (normalised) {
          simpleItems.push(normalised);
        }
        return;
      }

      if (Array.isArray(entry)) {
        handleArray(entry, `${fallbackTitle} ${index + 1}`, `${baseId}-${index + 1}`);
        return;
      }

      if (typeof entry === 'object') {
        handleRecord(entry as Record<string, unknown>, `${fallbackTitle} ${index + 1}`, `${baseId}-${index + 1}`);
      }
    });

    if (simpleItems.length > 0) {
      addSection({
        id: `${baseId}-list`,
        title: formatSummaryLabel(fallbackTitle),
        bullets: simpleItems,
      });
    }
  };

  if (Array.isArray(parsed)) {
    handleArray(parsed, 'Tóm tắt', 'summary');
  } else if (parsed && typeof parsed === 'object') {
    handleRecord(parsed as Record<string, unknown>, 'Tóm tắt', 'summary');
  }

  if (sections.length === 0) {
    const fallbackText = typeof parsed === 'object' ? formatDetailValue(parsed) : trimmed;
    const combinedFallback = [fallbackText, additionalText].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );

    return {
      plainText: combinedFallback.length > 0 ? combinedFallback.join('\n\n') : trimmed,
      sections: [],
    };
  }

  return {
    plainText: additionalText,
    sections,
  };
};
