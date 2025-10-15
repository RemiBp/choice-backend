import { ReportStatus } from "../../enums/report.enum";
import { BadRequestError } from "../../errors/badRequest.error";
import { NotFoundError } from "../../errors/notFound.error";
import { PostCommentRepository, PostRepository, ReportRepository, UserRepository } from "../../repositories";
import { CreateReportInput } from "../../validators/producer/report.validation";

export const createReport = async (userId: number, input: CreateReportInput) => {
    if (!input.reportedUserId && !input.reportedPostId && !input.reportedCommentId) {
        throw new BadRequestError("You must report either a user, post, or comment");
    }

    if (input.reportedUserId) {
        const user = await UserRepository.findOneBy({ id: input.reportedUserId });
        if (!user) throw new NotFoundError("Reported user not found");

        const existing = await ReportRepository.findOne({
            where: { reporterId: userId, reportedUserId: input.reportedUserId },
        });
        if (existing) throw new BadRequestError("You have already reported this user");
    }

    if (input.reportedPostId) {
        const post = await PostRepository.findOneBy({ id: input.reportedPostId });
        if (!post) throw new NotFoundError("Reported post not found");

        const existing = await ReportRepository.findOne({
            where: { reporterId: userId, reportedPostId: input.reportedPostId },
        });
        if (existing) throw new BadRequestError("You have already reported this post");
    }

    if (input.reportedCommentId) {
        const comment = await PostCommentRepository.findOneBy({ id: input.reportedCommentId });
        if (!comment) throw new NotFoundError("Reported comment not found");

        const existing = await ReportRepository.findOne({
            where: { reporterId: userId, reportedCommentId: input.reportedCommentId },
        });
        if (existing) throw new BadRequestError("You have already reported this comment");
    }

    const Report = await ReportRepository.save({
        reporterId: userId,
        reportedUserId: input.reportedUserId,
        reportedPostId: input.reportedPostId,
        reportedCommentId: input.reportedCommentId,
        reason: input.reason,
        details: input.details,
        status: ReportStatus.PENDING,
    });

    return Report;
};

export const getMyReports = async (userId: number) => {
    return await ReportRepository.find({
        where: { reporterId: userId },
        relations: ["reportedUser", "reportedPost", "reportedComment"],
    });
};

export const updateReportStatus = async (reportId: number, status: ReportStatus) => {
    const report = await ReportRepository.findOneBy({ id: reportId });
    if (!report) throw new NotFoundError("Report not found");

    report.status = status;
    return await ReportRepository.save(report);
};

export * as ReportService from './report.service';