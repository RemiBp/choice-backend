export enum ReportStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

export enum ReportReason {
  SPAM_FAKE = "Spam or Fake Account",
  INAPPROPRIATE = "Inappropriate Content",
  HARASSMENT = "Harassment or Bullying",
  HATE_SPEECH = "Hate Speech",
  SCAM = "Scam or Fraud",
}
