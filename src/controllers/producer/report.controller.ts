import { Request, Response, NextFunction } from "express";
import { ReportService } from "../../services/producer/report.service";
import { ReportStatus } from "../../enums/report.enum";
import { CreateReportSchema } from "../../validators/producer/report.validation";
import { sendApiResponse } from "../../utils/sendApiResponse";

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const validated = CreateReportSchema.parse(req.body);
    const report = await ReportService.createReport(userId, validated);
    return sendApiResponse(res, 200, "Report submitted successfully", report);
  } catch (err) {
    next(err);
  }
};

export const getMyReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const reports = await ReportService.getMyReports(userId);
    return sendApiResponse(res, 200, "Reports fetch successfully", reports);
  } catch (err) {
    next(err);
  }
};

export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = Number(req.params.reportId);
    const { status } = req.body;

    const updated = await ReportService.updateReportStatus(reportId, status as ReportStatus);
    return sendApiResponse(res, 200, "Reports Status update successfully", updated);
  } catch (err) {
    next(err);
  }
};

export * as ReportController from './report.controller';