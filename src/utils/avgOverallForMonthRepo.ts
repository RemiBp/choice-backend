import { ObjectLiteral, Repository } from "typeorm";

/**
 * Compute the monthly average of `overall` for a producer from a given repository.
 * Falls back to the current `overall` (useful when there’s only one row per producer).
 */
export async function avgOverallForMonthRepo<T extends ObjectLiteral>(
    repo: Repository<T>,
    alias: string,
    producerId: number,
    from: Date,
    to: Date
): Promise<number> {
    // 1) Monthly average (created OR updated in window)
    const monthly = await repo
        .createQueryBuilder(alias)
        .select(`AVG(CAST(${alias}.overall AS numeric))`, "avg")
        .where(`${alias}."producerId" = :producerId`, { producerId })
        .andWhere(
            `((${alias}."createdAt" BETWEEN :from AND :to) OR (${alias}."updatedAt" BETWEEN :from AND :to))`,
            { from, to }
        )
        .getRawOne<{ avg: string | number | null }>();

    const parseNum = (v: unknown) =>
        v == null ? NaN : typeof v === "string" ? parseFloat(v) : Number(v);

    const monthlyVal = parseNum(monthly?.avg);
    if (Number.isFinite(monthlyVal)) return monthlyVal;

    // 2) Fallback: current overall (any row for that producer)
    const current = await repo
        .createQueryBuilder(alias)
        .select(`CAST(${alias}.overall AS numeric)`, "val")
        .where(`${alias}."producerId" = :producerId`, { producerId })
        .limit(1)
        .getRawOne<{ val: string | number | null }>();

    const currentVal = parseNum(current?.val);
    if (Number.isFinite(currentVal)) return currentVal;

    return 0;
}
