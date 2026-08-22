/**
 * InstituteOps — Deterministic Ranking Engine
 * 
 * Standard Competition Ranking (1224 scheme):
 * - Students with equal marks get equal ranks.
 * - The subsequent rank skips accordingly (e.g. 1, 2, 2, 4).
 * - Absent students receive null rank.
 */

export interface ScoreInputItem {
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
}

export interface RankedScoreItem extends ScoreInputItem {
  calculatedRank: number | null;
  isPass: boolean;
}

export interface BatchTestStats {
  totalStudents: number;
  totalAppeared: number;
  totalAbsent: number;
  highestScore: number | null;
  lowestScore: number | null;
  batchAverage: number | null;
  passCount: number;
  failCount: number;
  passPercentage: number;
}

export interface RankEngineResult {
  rankedItems: RankedScoreItem[];
  stats: BatchTestStats;
}

/**
 * Computes standard competition ranks and batch performance statistics.
 * 
 * @param items List of student mark entries
 * @param passingMarks Passing threshold for the test
 * @param totalMarks Maximum possible marks for the test
 */
export function computeCompetitionRanks(
  items: ScoreInputItem[],
  passingMarks: number,
  totalMarks: number
): RankEngineResult {
  const totalStudents = items.length;
  let totalAbsent = 0;
  let totalAppeared = 0;
  let passCount = 0;
  let failCount = 0;
  let scoreSum = 0;
  let highestScore: number | null = null;
  let lowestScore: number | null = null;

  // Separate present students with valid scores from absent/unmarked
  const presentStudents: Array<ScoreInputItem & { score: number }> = [];
  const absentOrUnmarked: ScoreInputItem[] = [];

  for (const item of items) {
    if (item.isAbsent || item.marksObtained === null || item.marksObtained === undefined) {
      totalAbsent++;
      absentOrUnmarked.push(item);
    } else {
      // Clamp or ensure valid number
      const score = Number(item.marksObtained);
      totalAppeared++;
      scoreSum += score;

      if (highestScore === null || score > highestScore) {
        highestScore = score;
      }
      if (lowestScore === null || score < lowestScore) {
        lowestScore = score;
      }

      if (score >= passingMarks) {
        passCount++;
      } else {
        failCount++;
      }

      presentStudents.push({
        ...item,
        score,
      });
    }
  }

  // Sort present students descending by score
  presentStudents.sort((a, b) => b.score - a.score);

  // Standard Competition Ranking (1224)
  const rankedItems: RankedScoreItem[] = [];
  let currentRank = 1;

  for (let i = 0; i < presentStudents.length; i++) {
    const student = presentStudents[i];

    // If score is equal to previous student's score, use the same rank
    if (i > 0 && student.score === presentStudents[i - 1].score) {
      rankedItems.push({
        studentId: student.studentId,
        marksObtained: student.score,
        isAbsent: false,
        calculatedRank: rankedItems[i - 1].calculatedRank,
        isPass: student.score >= passingMarks,
      });
    } else {
      currentRank = i + 1; // 1-indexed rank with skip
      rankedItems.push({
        studentId: student.studentId,
        marksObtained: student.score,
        isAbsent: false,
        calculatedRank: currentRank,
        isPass: student.score >= passingMarks,
      });
    }
  }

  // Append absent students with null rank
  for (const student of absentOrUnmarked) {
    rankedItems.push({
      studentId: student.studentId,
      marksObtained: null,
      isAbsent: true,
      calculatedRank: null,
      isPass: false,
    });
  }

  const batchAverage =
    totalAppeared > 0 ? Number((scoreSum / totalAppeared).toFixed(2)) : null;

  const passPercentage =
    totalAppeared > 0 ? Number(((passCount / totalAppeared) * 100).toFixed(1)) : 0;

  const stats: BatchTestStats = {
    totalStudents,
    totalAppeared,
    totalAbsent,
    highestScore,
    lowestScore,
    batchAverage,
    passCount,
    failCount,
    passPercentage,
  };

  return {
    rankedItems,
    stats,
  };
}
