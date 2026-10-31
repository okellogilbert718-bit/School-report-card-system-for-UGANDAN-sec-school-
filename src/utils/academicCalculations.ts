import {
  GradeBoundary,
  HeadTeacherCommentRule,
  Subject,
  OLevelMark,
  ALevelMark,
  Learner,
} from '../types';

/**
 * Calculates O-Level weighted total score and grade dynamically from active boundaries
 */
export function calculateOLevelScore(
  a1_score3: number,
  a1_score20: number,
  a2_score3: number,
  a2_score20: number,
  a3_eot: number,
  boundaries: GradeBoundary[],
  fallbackWeighted?: number
): { weightedAverage: number; totalScore: number; grade: string; defaultComment: string; aggregate: number } {
  let weightedAverage = 0;
  let totalScore = 0;

  if (
    Number(a1_score20) === 0 &&
    Number(a2_score20) === 0 &&
    Number(a3_eot) === 0 &&
    fallbackWeighted !== undefined &&
    fallbackWeighted > 0
  ) {
    weightedAverage = fallbackWeighted;
    totalScore = Math.round(fallbackWeighted);
  } else {
    // A1 contributes 20%, A2 contributes 20%, A3 (End of term /80) contributes 60%
    const a1Pct = Math.min(100, Math.max(0, (Number(a1_score20) / 20) * 100));
    const a2Pct = Math.min(100, Math.max(0, (Number(a2_score20) / 20) * 100));
    const a3Pct = Math.min(100, Math.max(0, (Number(a3_eot) / 80) * 100));

    const weighted = a1Pct * 0.2 + a2Pct * 0.2 + a3Pct * 0.6;
    weightedAverage = Math.round(weighted * 10) / 10;
    totalScore = Math.round(weightedAverage);
  }

  // Robust grade boundary matching with numeric coercion
  const rounded = Math.round(totalScore);
  let matched = boundaries.find(
    (b) => rounded >= Number(b.minScore) && rounded <= Number(b.maxScore)
  );

  if (!matched) {
    const sorted = [...boundaries].sort((a, b) => Number(b.minScore) - Number(a.minScore));
    matched = sorted.find((b) => rounded >= Number(b.minScore));
  }

  if (!matched) {
    matched = boundaries[boundaries.length - 1];
  }

  return {
    weightedAverage,
    totalScore,
    grade: matched ? matched.grade : 'F9',
    defaultComment: matched ? matched.commentTemplate : 'Needs improvement',
    aggregate: matched ? Number(matched.points) : 9,
  };
}

/**
 * Calculates A-Level average score, grade, points, and comment dynamically from active boundaries
 */
export function calculateALevelSubjectScore(
  subject: Subject,
  paperScores: { [paperNumber: number]: number },
  boundaries: GradeBoundary[],
  fallbackAverage?: number
): { averageScore: number; grade: string; points: number; defaultComment: string } {
  // Find active papers
  const activePapers = subject.papers
    ? subject.papers.filter((p) => p.active)
    : [{ paperNumber: 1, label: 'Paper 1', active: true, maxScore: 100 }];

  let averageScore = 0;

  if (activePapers.length === 0) {
    if (fallbackAverage !== undefined && fallbackAverage > 0) {
      averageScore = fallbackAverage;
    } else {
      return { averageScore: 0, grade: 'F', points: 0, defaultComment: 'No papers active' };
    }
  } else {
    let total = 0;
    let count = 0;
    for (const paper of activePapers) {
      const score = paperScores[paper.paperNumber];
      if (score !== undefined) {
        total += Math.min(100, Math.max(0, Number(score)));
        count++;
      }
    }
    if (count > 0) {
      averageScore = Math.round((total / count) * 10) / 10;
    } else if (fallbackAverage !== undefined && fallbackAverage > 0) {
      averageScore = fallbackAverage;
    }
  }

  const isSubsidiary =
    subject.category === 'subsidiary' ||
    subject.code.startsWith('S') ||
    subject.code === 'P850';

  if (isSubsidiary) {
    if (averageScore >= 40) {
      return {
        averageScore,
        grade: 'Pass (P)',
        points: 1,
        defaultComment: 'Subsidiary pass achieved. Demonstrates satisfactory understanding.',
      };
    } else {
      return {
        averageScore,
        grade: 'Fail (F)',
        points: 0,
        defaultComment: 'Subsidiary credit missed. Requires extra coursework review.',
      };
    }
  }

  // Principal Subject (Grades A - F, Points 6 - 0)
  const rounded = Math.round(averageScore);
  let matched = boundaries.find(
    (b) => rounded >= Number(b.minScore) && rounded <= Number(b.maxScore)
  );

  if (!matched) {
    const sorted = [...boundaries].sort((a, b) => Number(b.minScore) - Number(a.minScore));
    matched = sorted.find((b) => rounded >= Number(b.minScore));
  }

  if (!matched) {
    matched = boundaries[boundaries.length - 1];
  }

  return {
    averageScore,
    grade: matched ? matched.grade : 'F',
    points: matched ? Number(matched.points) : 0,
    defaultComment: matched ? matched.commentTemplate : 'Needs remedial study',
  };
}

/**
 * Get automatic headteacher comment based on overall percentage average
 */
export function getAutomaticHeadTeacherComment(
  average: number,
  programme: 'O_LEVEL' | 'A_LEVEL',
  rules: HeadTeacherCommentRule[]
): string {
  const filtered = rules.filter((r) => r.programme === programme);
  const matched = filtered.find(
    (r) => average >= r.minAverage && average <= r.maxAverage
  );
  if (matched) return matched.comment;
  return programme === 'A_LEVEL'
    ? 'Promising academic effort. Work steadily towards maximum university points.'
    : 'Good effort demonstrated. Keep striving for distinction in all subjects.';
}

/**
 * Determine O-Level Division from total aggregate of best 8 subjects
 */
export function calculateOLevelDivision(aggregates: number[], hasPassedEngMath: boolean): string {
  if (aggregates.length < 8) {
    return 'Pending Full Assessment';
  }
  const sorted = [...aggregates].sort((a, b) => a - b);
  const best8Sum = sorted.slice(0, 8).reduce((acc, curr) => acc + curr, 0);

  if (best8Sum <= 32 && hasPassedEngMath) return 'Division 1 (Distinction)';
  if (best8Sum <= 45) return 'Division 2 (Credit)';
  if (best8Sum <= 58) return 'Division 3 (Pass)';
  if (best8Sum <= 72) return 'Division 4';
  return 'Division 9 / Ungraded';
}

/**
 * Parse CSV string into array of objects with header keys
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());

  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Regex to handle comma separation while respecting quotes
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    const line = lines[i];

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] ? values[index].replace(/^["']|["']$/g, '').trim() : '';
    });
    results.push(rowObj);
  }
  return results;
}

/**
 * Convert array of objects to CSV download string
 */
export function exportToCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((r) =>
    r.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Trigger file download in browser
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
