import { PraiseDetailsDto, QuantificationDto } from 'api/dist/praise/types';
import { selectorFamily } from 'recoil';
import { AllPeriodPraise } from './periods';

export const PeriodPraiseSortedByScore = selectorFamily({
  key: 'PeriodPraiseSortedByScore',
  get:
    (periodId: string | undefined) =>
    ({ get }): PraiseDetailsDto[] | undefined => {
      if (!periodId) return undefined;
      const praise = get(AllPeriodPraise(periodId));
      if (!praise) return undefined;
      return [...praise].sort((a, b) => b.scoreRealized - a.scoreRealized);
    },
});

export const PeriodTop10Praise = selectorFamily({
  key: 'PeriodTop10Praise',
  get:
    (periodId: string | undefined) =>
    ({ get }): PraiseDetailsDto[] | undefined => {
      if (!periodId) return undefined;
      const praise = get(PeriodPraiseSortedByScore(periodId));
      if (!praise) return undefined;
      return praise.slice(0, 10);
    },
});

export interface PraiseDetailsStats extends PraiseDetailsDto {
  maxScore: number;
  minScore: number;
  scoreSpread: number;
}

export const PeriodPraiseOutliers = selectorFamily({
  key: 'PeriodPraiseOutliers',
  get:
    (periodId: string | undefined) =>
    ({ get }): PraiseDetailsStats[] | undefined => {
      if (!periodId) return undefined;
      const praise = get(AllPeriodPraise(periodId));
      if (!praise) return undefined;
      return praise.map((p) => {
        let quantified = p.quantifications.map((q) => q.score);
        quantified = [...quantified].filter(Number);
        const maxScore = Math.max(...quantified);
        const minScore = Math.min(...quantified);
        return {
          ...p,
          maxScore,
          minScore,
          scoreSpread: maxScore - minScore,
        };
      });
    },
});

interface PeriodStats {
  totalPraise: number;
  totalPraiseScoreRealized: number;
}
export const PeriodStatsSelector = selectorFamily({
  key: 'PeriodStatsSelector',
  get:
    (periodId: string | undefined) =>
    ({ get }): PeriodStats | undefined => {
      if (!periodId) return undefined;
      const praise = get(AllPeriodPraise(periodId));
      if (!praise) return undefined;
      return {
        totalPraise: praise.length,
        totalPraiseScoreRealized: praise.reduce(
          (acc, curr) => acc + curr.scoreRealized,
          0
        ),
      };
    },
});

export const AllPeriodQuantifications = selectorFamily({
  key: 'AllPeriodQuantifications',
  get:
    (periodId: string | undefined) =>
    ({ get }): QuantificationDto[] | undefined => {
      if (!periodId) return undefined;
      const praise = get(AllPeriodPraise(periodId));
      if (!praise) return undefined;
      return praise.reduce((acc: QuantificationDto[], curr) => {
        for (const q of curr.quantifications) {
          acc.push(q);
        }
        return acc;
      }, []);
    },
});

export const AllPeriodQuantificationsGroupedByQuantifier = selectorFamily({
  key: 'AllPeriodQuantificationsGroupedByQuantifier',
  get:
    (periodId: string | undefined) =>
    ({ get }): Map<string, QuantificationDto[]> | undefined => {
      if (!periodId) return undefined;
      const quantifications = get(AllPeriodQuantifications(periodId));
      if (!quantifications) return undefined;
      return quantifications.reduce(
        (acc: Map<string, QuantificationDto[]>, curr) => {
          const quantifier = curr.quantifier;
          if (!acc.has(quantifier)) {
            acc.set(quantifier, []);
          }
          acc.get(quantifier)?.push(curr);
          return acc;
        },
        new Map<string, QuantificationDto[]>()
      );
    },
});

export interface QuantifierQuantStats {
  _id: string;
  totalQuantifications: number;
  minScore: number;
  maxScore: number;
  meanScore: number;
  medianScore: number;
  totalScore: number;
}

const median = (values: number[]): number => {
  const sorted = values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) {
    return sorted[half];
  } else {
    return (sorted[half - 1] + sorted[half]) / 2.0;
  }
};
export const PeriodQuantifierStats = selectorFamily({
  key: 'PeriodQuantifierStats',
  get:
    (periodId: string | undefined) =>
    ({ get }): QuantifierQuantStats[] | undefined => {
      if (!periodId) return undefined;
      const quantifierQuants = get(
        AllPeriodQuantificationsGroupedByQuantifier(periodId)
      );
      if (!quantifierQuants) return undefined;
      const quantifierQuantStats: QuantifierQuantStats[] = [];
      quantifierQuants.forEach((quantifications) => {
        const quantifier = quantifications[0].quantifier;
        const scores = quantifications.map((q) => q.score);
        const totalScore = scores.reduce((acc, curr) => acc + curr, 0);
        let minScore = Math.min(...scores.filter(Number));
        isFinite(minScore) || (minScore = 0);
        const maxScore = Math.max(...scores);
        const meanScore =
          quantifications.reduce((acc, curr) => acc + curr.score, 0) /
          quantifications.length;
        const medianScore = median(scores);
        quantifierQuantStats.push({
          _id: quantifier,
          totalQuantifications: quantifications.length,
          minScore,
          maxScore,
          meanScore,
          medianScore,
          totalScore,
        });
      });
      return quantifierQuantStats;
    },
});

export const PeriodQuantScoreDistribution = selectorFamily({
  key: 'PeriodQuantScoreDistribution',
  get:
    (periodId: string | undefined) =>
    ({ get }): Map<number, number> | undefined => {
      if (!periodId) return undefined;
      const quantifications = get(AllPeriodQuantifications(periodId));
      if (!quantifications) return undefined;
      return quantifications.reduce(
        (acc: Map<number, number>, curr) =>
          acc.set(curr.score, (acc.get(curr.score) || 0) + 1),
        new Map<number, number>()
      );
    },
});
