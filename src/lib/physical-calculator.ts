/**
 * InstituteOps — Physical Fitness Scoring Engine
 * 
 * Implements official Gujarat Police Recruitment Board (PSI & Constable)
 * physical efficiency criteria for running and physical tasks.
 */

export interface PhysicalScoreResult {
  runningTimeFormatted: string; // e.g. "19:35"
  runningMarks: number; // 0 - 25
  isQualified: boolean;
  performanceGrade: "OUTSTANDING" | "GOOD" | "AVERAGE" | "DISQUALIFIED";
}

/**
 * Calculate marks for Male 5000m running test.
 * Time limit: 25 minutes. Maximum Marks: 25.
 */
export function calculateMale5000mMarks(totalSeconds: number): PhysicalScoreResult {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const runningTimeFormatted = `${minutes}:${secs.toString().padStart(2, "0")}`;

  let runningMarks = 0;
  let isQualified = true;
  let performanceGrade: "OUTSTANDING" | "GOOD" | "AVERAGE" | "DISQUALIFIED" = "GOOD";

  if (totalSeconds <= 1200) {
    // 20 minutes or less
    runningMarks = 25.0;
    performanceGrade = "OUTSTANDING";
  } else if (totalSeconds <= 1260) {
    // 20:01 - 21:00 min
    runningMarks = 23.0;
    performanceGrade = "OUTSTANDING";
  } else if (totalSeconds <= 1320) {
    // 21:01 - 22:00 min
    runningMarks = 21.0;
    performanceGrade = "GOOD";
  } else if (totalSeconds <= 1380) {
    // 22:01 - 23:00 min
    runningMarks = 19.0;
    performanceGrade = "GOOD";
  } else if (totalSeconds <= 1440) {
    // 23:01 - 24:00 min
    runningMarks = 17.0;
    performanceGrade = "AVERAGE";
  } else if (totalSeconds <= 1500) {
    // 24:01 - 25:00 min
    runningMarks = 15.0;
    performanceGrade = "AVERAGE";
  } else {
    // > 25:00 min - Disqualified
    runningMarks = 0.0;
    isQualified = false;
    performanceGrade = "DISQUALIFIED";
  }

  return {
    runningTimeFormatted,
    runningMarks,
    isQualified,
    performanceGrade,
  };
}

/**
 * Calculate marks for Female 1600m running test.
 * Time limit: 9.5 minutes. Maximum Marks: 25.
 */
export function calculateFemale1600mMarks(totalSeconds: number): PhysicalScoreResult {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const runningTimeFormatted = `${minutes}:${secs.toString().padStart(2, "0")}`;

  let runningMarks = 0;
  let isQualified = true;
  let performanceGrade: "OUTSTANDING" | "GOOD" | "AVERAGE" | "DISQUALIFIED" = "GOOD";

  if (totalSeconds <= 420) {
    // 7:00 min or less
    runningMarks = 25.0;
    performanceGrade = "OUTSTANDING";
  } else if (totalSeconds <= 450) {
    // 7:01 - 7:30 min
    runningMarks = 23.0;
    performanceGrade = "OUTSTANDING";
  } else if (totalSeconds <= 480) {
    // 7:31 - 8:00 min
    runningMarks = 21.0;
    performanceGrade = "GOOD";
  } else if (totalSeconds <= 510) {
    // 8:01 - 8:30 min
    runningMarks = 19.0;
    performanceGrade = "GOOD";
  } else if (totalSeconds <= 540) {
    // 8:31 - 9:00 min
    runningMarks = 17.0;
    performanceGrade = "AVERAGE";
  } else if (totalSeconds <= 570) {
    // 9:01 - 9:30 min
    runningMarks = 15.0;
    performanceGrade = "AVERAGE";
  } else {
    // > 9:30 min - Disqualified
    runningMarks = 0.0;
    isQualified = false;
    performanceGrade = "DISQUALIFIED";
  }

  return {
    runningTimeFormatted,
    runningMarks,
    isQualified,
    performanceGrade,
  };
}
