// services/producer/dashboard.service.ts
import { Between } from "typeorm";
import { ProducerRepository, PostRepository, BookingRepository, PostRatingRepository, FollowRepository } from "../../repositories";
import { NotFoundError } from "../../errors/notFound.error";

export const getOverview = async ({ userId, roleName }: { userId: number; roleName: string }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    const [postCount, bookingCount, followerCount, avgRating] = await Promise.all([
        PostRepository.count({ where: { producerId: producer.id } }),
        BookingRepository.count({ where: { restaurant: { id: producer.userId } } }),
        FollowRepository.count({ where: { producerId: producer.id } }),
        PostRatingRepository.createQueryBuilder("r")
            .innerJoin("r.post", "p")
            .select("AVG(r.rating)", "avg")
            .where("p.producerId = :id", { id: producer.id })
            .getRawOne(),
    ]);

    return {
        totalPosts: postCount,
        totalBookings: bookingCount,
        totalFollowers: followerCount,
        averageRating: Number(avgRating?.avg ?? 0).toFixed(2),
    };
};

export const getUserInsights = async ({ userId }: { userId: number }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    // Fetch recent followers
    const followers = await FollowRepository
        .createQueryBuilder("f")
        .leftJoinAndSelect("f.follower", "follower")
        .where("f.producerId = :id", { id: producer.id })
        .andWhere("f.status = :status", { status: "Approved" })
        .orderBy("f.createdAt", "DESC")
        .limit(10)
        .getMany();

    return {
        totalFollowers: followers.length,
        recentFollowers: followers.map((f: any) => ({
            id: f.follower?.id,
            fullName: f.follower?.fullName,
            email: f.follower?.email,
            followedAt: f.createdAt,
        })),
    };
};


export const getTrends = async ({ userId, metric, from, to }: { userId: number; metric: string; from?: string; to?: string }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    const start = from ? new Date(from) : undefined;
    const end = to ? new Date(to) : undefined;

    let data: any[] = [];

    if (metric === "bookings") {
        const query = BookingRepository.createQueryBuilder("b")
            .select(`DATE_TRUNC('day', b."createdAt")`, "date")
            .addSelect(`COUNT(*)`, "count")
            .where(`b."restaurantId" = :restaurantUserId`, { restaurantUserId: producer.userId });

        if (start && end) query.andWhere(`b."createdAt" BETWEEN :start AND :end`, { start, end });

        data = await query
            .groupBy(`DATE_TRUNC('day', b."createdAt")`)
            .orderBy(`DATE_TRUNC('day', b."createdAt")`, "ASC")
            .getRawMany();
    }

    else if (metric === "likes") {
        const query = PostRepository.createQueryBuilder("p")
            .select(`DATE_TRUNC('day', p."createdAt")`, "date")
            .addSelect(`COUNT(*)`, "count")
            .where(`p."producerId" = :id`, { id: producer.id });

        if (start && end) query.andWhere(`p."createdAt" BETWEEN :start AND :end`, { start, end });

        data = await query
            .groupBy(`DATE_TRUNC('day', p."createdAt")`)
            .orderBy(`DATE_TRUNC('day', p."createdAt")`, "ASC")
            .getRawMany();
    }

    else if (metric === "followers") {
        const query = FollowRepository.createQueryBuilder("f")
            .select(`DATE_TRUNC('day', f."createdAt")`, "date")
            .addSelect(`COUNT(*)`, "count")
            .where(`f."producerId" = :id`, { id: producer.id });

        if (start && end) query.andWhere(`f."createdAt" BETWEEN :start AND :end`, { start, end });

        data = await query
            .groupBy(`DATE_TRUNC('day', f."createdAt")`)
            .orderBy(`DATE_TRUNC('day', f."createdAt")`, "ASC")
            .getRawMany();
    }

    return {
        metric,
        series: data.map((d) => ({
            date: d.date,
            value: Number(d.count),
        })),
    };
};

export const getRatings = async ({ userId }: { userId: number }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    // Join PostRating → Post (via postId)
    const breakdown = await PostRatingRepository
        .createQueryBuilder("r")
        .innerJoin("r.post", "p")
        .select("r.criteria", "criteria")
        .addSelect("AVG(r.rating)", "avg")
        .where("p.producerId = :id", { id: producer.id })
        .groupBy("r.criteria")
        .getRawMany();

    return {
        ratings: breakdown.map((b: any) => ({
            criteria: b.criteria,
            average: Number(b.avg).toFixed(2),
        })),
    };
};

export const getFeedback = async ({ userId }: { userId: number }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    const comments = await PostRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.comments", "c")
        .leftJoinAndSelect("c.user", "u")
        .where("p.producerId = :id", { id: producer.id })
        .orderBy("c.createdAt", "DESC")
        .limit(20)
        .getMany();

    return { comments };
}

export const getBenchmark = async ({ userId }: { userId: number }) => {
    const producer = await ProducerRepository.findOneBy({ userId });
    if (!producer) throw new NotFoundError("Producer not found.");

    const avgRatings = await PostRatingRepository
        .createQueryBuilder("r")
        .select("r.producerType", "type")
        .addSelect("AVG(r.overall)", "avg")
        .groupBy("r.producerType")
        .getRawMany();

    return {
        myType: producer.type,
        benchmark: avgRatings,
    };
}

export * as DashboardService from './dashboard.service';