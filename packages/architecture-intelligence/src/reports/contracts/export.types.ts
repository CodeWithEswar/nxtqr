export type ReportExportFormat = "pdf" | "markdown" | "html" | "json" | "docx";

export type ReportPageSize = "a4" | "letter";

export type ReportPageOrientation = "portrait" | "landscape";

export type ReportTheme = "light" | "dark" | "print";

export interface ReportExportOptions {
  format: ReportExportFormat;
  pageSize?: ReportPageSize;
  orientation?: ReportPageOrientation;
  includeVectorDiagrams?: boolean;
  includeCoverPage?: boolean;
  includeTableOfContents?: boolean;
  redactSensitiveData?: boolean;
  theme?: ReportTheme;
  customWatermark?: string;
  metadata?: Record<string, string>;
}

export interface ReportExportResult {
  format: ReportExportFormat;
  content: string; // Base64 encoded or string representation
  mimeType: string;
  filename: string;
  byteSize: number;
  generatedAt: string;
}

export type ExportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface ExportJob {
  id: string;
  reportId: string;
  version: number;
  format: ReportExportFormat;
  status: ExportJobStatus;
  progressPercentage: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  artifactUrl?: string;
  byteSize?: number;
}
