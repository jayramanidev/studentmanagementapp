"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, LineChart as ChartIcon } from "lucide-react";
import { type StudentTestPerformanceItem } from "@/actions/performance";

interface ScoreProgressionChartProps {
  testHistory: StudentTestPerformanceItem[];
  title?: string;
  description?: string;
}

export function ScoreProgressionChart({
  testHistory,
  title = "Score Progression Over Time",
  description = "Your score percentage compared against the class average across all tests",
}: ScoreProgressionChartProps) {
  // Sort chronological for chart display
  const chartData = React.useMemo(() => {
    return [...testHistory]
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .filter((t) => !t.isAbsent && t.percentage !== null)
      .map((t) => {
        const batchAvgPct =
          t.batchAverage !== null && t.totalMarks > 0
            ? Number(((t.batchAverage / t.totalMarks) * 100).toFixed(1))
            : null;

        const dateFormatted = new Date(t.testDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });

        return {
          name: t.testTitle.length > 18 ? t.testTitle.slice(0, 15) + "..." : t.testTitle,
          fullTitle: t.testTitle,
          date: dateFormatted,
          subject: t.subjectName,
          scorePct: t.percentage,
          batchAvgPct: batchAvgPct,
          rawScore: `${t.marksObtained} / ${t.totalMarks}`,
          rank: t.calculatedRank ? `#${t.calculatedRank}` : "N/A",
        };
      });
  }, [testHistory]);

  if (chartData.length === 0) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ChartIcon className="h-4 w-4 text-indigo-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <span>No published test scores available yet.</span>
            <span className="text-xs text-muted-foreground">
              Once teachers publish test scores, your progression graph will appear here.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/50"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-md text-xs space-y-1.5 min-w-[160px]">
                        <div className="font-bold text-foreground text-sm">
                          {data.fullTitle}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {data.subject} • {data.date}
                        </div>
                        <div className="pt-1.5 border-t space-y-1">
                          <div className="flex items-center justify-between font-semibold text-indigo-600 dark:text-indigo-400">
                            <span>Your Score:</span>
                            <span>
                              {data.scorePct}% ({data.rawScore})
                            </span>
                          </div>
                          {data.batchAvgPct !== null && (
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Class Average:</span>
                              <span>{data.batchAvgPct}%</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Class Rank:</span>
                            <span className="font-mono font-bold text-foreground">
                              {data.rank}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Line
                type="monotone"
                name="Your Score %"
                dataKey="scorePct"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#4f46e5" }}
              />
              <Line
                type="monotone"
                name="Class Average %"
                dataKey="batchAvgPct"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#94a3b8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
