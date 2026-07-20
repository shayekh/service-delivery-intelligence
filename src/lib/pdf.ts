import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { RGB } from "pdf-lib";
import fs from "fs";
import path from "path";
import {
  getAnalysisResult,
  getCustomerLogoByName,
  getProjectById,
  updateProjectPdfUrl,
} from "@/lib/db";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { AnalysisJson, CrossAnalysisRelationship, StatusColor } from "@/types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_RESERVE = 55;
const BOTTOM_LIMIT = MARGIN + FOOTER_RESERVE;

const NAVY = rgb(0.1, 0.15, 0.3);
const SECTION_COLOR = rgb(0.455, 0.106, 0.278); // #741B47
const GREY_BODY = rgb(0.2, 0.2, 0.2);
const GREY_LIGHT_ROW = rgb(0.97, 0.97, 0.98);
const GREY_FOOTER = rgb(0.5, 0.5, 0.5);
const WHITE = rgb(1, 1, 1);

const STATUS_COLORS: Record<StatusColor, RGB> = {
  Green: rgb(0.2, 0.7, 0.3),
  Amber: rgb(0.9, 0.6, 0.1),
  Red: rgb(0.85, 0.2, 0.2),
};

const CROSS_ANALYSIS_COLORS: Record<CrossAnalysisRelationship, RGB> = {
  AGREE: rgb(0.2, 0.4, 0.85),
  DISAGREE: rgb(0.85, 0.2, 0.2),
  COMPLEMENT: rgb(0.2, 0.7, 0.3),
  BLIND_SPOT: rgb(0.9, 0.6, 0.1),
};

const URGENCY_COLORS: Record<string, RGB> = {
  High: rgb(0.85, 0.2, 0.2),
  Medium: rgb(0.9, 0.6, 0.1),
  Low: rgb(0.2, 0.7, 0.3),
};

function readPublicAsset(relativePath: string): Uint8Array | null {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  try {
    return fs.readFileSync(fullPath);
  } catch (err) {
    console.error(`[PDF] readPublicAsset failed for "${fullPath}":`, err);
    return null;
  }
}

// pdf-lib's StandardFonts use WinAnsi (Windows-1252) encoding, which can't
// encode arbitrary unicode (arrows, smart quotes, bullets, emoji, etc.).
// Every piece of text drawn into the PDF — including AI-generated content,
// which can contain any of these — must pass through here first.
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .replace(/→/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[”]/g, '"')
    .replace(/•/g, "-")
    .replace(/–/g, "-")
    .replace(/—/g, " - ")
    .replace(/[^\x00-\xFF]/g, "");
}

function safeDrawText(
  page: PDFPage,
  text: string,
  options: Parameters<PDFPage["drawText"]>[1]
): void {
  page.drawText(sanitizeText(text), options);
}

const HEADER_LOGO_H = 36;
const HEADER_LOGO_TOP = PAGE_HEIGHT - 14;

class PdfBuilder {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  page!: PDFPage;
  y = 0;
  pageNumber = 0;
  projectName: string;
  period: string;
  seliseLogo: PDFImage | null = null;

  private constructor(
    doc: PDFDocument,
    regular: PDFFont,
    bold: PDFFont,
    italic: PDFFont,
    projectName: string,
    period: string
  ) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.italic = italic;
    this.projectName = projectName;
    this.period = period;
  }

  static async create(projectName: string, period: string): Promise<PdfBuilder> {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
    const builder = new PdfBuilder(doc, regular, bold, italic, projectName, period);
    const logoBytes = readPublicAsset("assets/selise_logo.png");
    if (logoBytes) {
      try {
        builder.seliseLogo = await doc.embedPng(logoBytes);
      } catch {
        // logo embed failed — skip silently
      }
    }
    return builder;
  }

  addContentPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber += 1;
    // Start content below header logo with generous gap
    this.y = HEADER_LOGO_TOP - HEADER_LOGO_H - 24;
    this.drawPageHeader();
    this.drawFooter();
  }

  private drawPageHeader(): void {
    if (this.seliseLogo) {
      const aspect = this.seliseLogo.width / this.seliseLogo.height;
      const logoW = HEADER_LOGO_H * aspect;
      this.page.drawImage(this.seliseLogo, {
        x: MARGIN,
        y: HEADER_LOGO_TOP - HEADER_LOGO_H,
        width: logoW,
        height: HEADER_LOGO_H,
      });
    }

  }

  private drawFooter(): void {
    const year = new Date().getFullYear();
    const copyrightText = `© SELISE Group AG, ${year}`;
    const confidentialText = "This document is confidential. It contains trade secrets and is protected from disclosure, legally or otherwise.";

    const copyrightWidth = this.regular.widthOfTextAtSize(copyrightText, 7);
    safeDrawText(this.page, copyrightText, {
      x: (PAGE_WIDTH - copyrightWidth) / 2,
      y: 33,
      size: 7,
      font: this.regular,
      color: GREY_FOOTER,
    });

    const confidentialWidth = this.regular.widthOfTextAtSize(confidentialText, 7);
    safeDrawText(this.page, confidentialText, {
      x: Math.max(MARGIN, (PAGE_WIDTH - confidentialWidth) / 2),
      y: 22,
      size: 7,
      font: this.regular,
      color: GREY_FOOTER,
    });

    const pageLabel = `${this.pageNumber}`;
    const pageLabelWidth = this.regular.widthOfTextAtSize(pageLabel, 8);
    safeDrawText(this.page, pageLabel, {
      x: PAGE_WIDTH - MARGIN - pageLabelWidth,
      y: 33,
      size: 8,
      font: this.regular,
      color: GREY_FOOTER,
    });
  }

  ensureSpace(height: number): void {
    if (this.y - height < BOTTOM_LIMIT) {
      this.addContentPage();
    }
  }

  wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = sanitizeText(text).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  drawSectionHeader(number: string, title: string): void {
    this.ensureSpace(100);
    this.y -= 10;
    const numText = `${number}.0`;
    const numWidth = this.bold.widthOfTextAtSize(numText, 14);
    safeDrawText(this.page, numText, {
      x: MARGIN,
      y: this.y,
      size: 14,
      font: this.bold,
      color: SECTION_COLOR,
    });
    safeDrawText(this.page, title, {
      x: MARGIN + numWidth + 8,
      y: this.y,
      size: 14,
      font: this.bold,
      color: SECTION_COLOR,
    });
    this.y -= 22;
  }

  drawParagraph(
    text: string | null | undefined,
    options: { size?: number; bold?: boolean; italic?: boolean; color?: RGB; indent?: number } = {}
  ): void {
    const size = options.size ?? 10;
    const font = options.bold ? this.bold : options.italic ? this.italic : this.regular;
    const color = options.color ?? GREY_BODY;
    const indent = options.indent ?? 0;
    const maxWidth = CONTENT_WIDTH - indent;
    const lines = this.wrapText(text || "Not provided", font, size, maxWidth);
    const lineHeight = size * 1.6;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      safeDrawText(this.page, line, { x: MARGIN + indent, y: this.y, size, font, color });
      this.y -= lineHeight;
    }
  }

  spacer(height: number): void {
    this.y -= height;
  }

  drawStatusBadge(status: string, x: number, y: number): number {
    const color = STATUS_COLORS[status as StatusColor] ?? rgb(0.6, 0.6, 0.6);
    const size = 8;
    const paddingX = 6;
    const textWidth = this.bold.widthOfTextAtSize(status, size);
    const width = textWidth + paddingX * 2;
    const height = 14;
    this.page.drawRectangle({ x, y: y - 3, width, height, color });
    safeDrawText(this.page, status, { x: x + paddingX, y, size, font: this.bold, color: WHITE });
    return width;
  }

  drawTable(
    headers: string[],
    rows: string[][],
    colWidths: number[],
    options?: { statusCol?: number }
  ): void {
    const headerHeight = 24;
    const cellPaddingY = 9;
    const fontSize = 9;
    const startX = MARGIN;

    const drawHeaderRow = () => {
      this.ensureSpace(headerHeight + 24);
      this.page.drawRectangle({
        x: startX,
        y: this.y - headerHeight,
        width: CONTENT_WIDTH,
        height: headerHeight,
        color: NAVY,
      });
      let cx = startX;
      headers.forEach((h, i) => {
        safeDrawText(this.page, h, {
          x: cx + 6,
          y: this.y - headerHeight + 7,
          size: fontSize,
          font: this.bold,
          color: WHITE,
        });
        cx += colWidths[i];
      });
      this.y -= headerHeight;
    };

    if (rows.length === 0) {
      this.drawParagraph("Not provided", { italic: true, color: rgb(0.6, 0.6, 0.6) });
      return;
    }

    drawHeaderRow();

    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, i) =>
        this.wrapText(cell, this.regular, fontSize, colWidths[i] - 12)
      );
      const isStatusRow = (i: number) =>
        options?.statusCol === i && ["Green", "Amber", "Red"].includes(row[i]);
      const maxLines = Math.max(
        ...cellLines.map((lines, i) => (isStatusRow(i) ? 1 : lines.length)),
        1
      );
      const rowHeight = maxLines * (fontSize * 1.4) + cellPaddingY * 2;

      if (this.y - rowHeight < BOTTOM_LIMIT) {
        this.addContentPage();
        drawHeaderRow();
      }

      const bg = rowIndex % 2 === 0 ? WHITE : GREY_LIGHT_ROW;
      this.page.drawRectangle({
        x: startX,
        y: this.y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: bg,
      });

      let cx = startX;
      row.forEach((cell, i) => {
        if (isStatusRow(i)) {
          this.drawStatusBadge(cell, cx + 6, this.y - cellPaddingY - 9);
        } else {
          cellLines[i].forEach((line, li) => {
            safeDrawText(this.page, line, {
              x: cx + 6,
              y: this.y - cellPaddingY - (li + 1) * (fontSize * 1.4) + fontSize * 0.3,
              size: fontSize,
              font: this.regular,
              color: GREY_BODY,
            });
          });
        }
        cx += colWidths[i];
      });

      this.y -= rowHeight;
    });

    this.y -= 14;
  }

  drawNumberedList(
    items: { title: string; body?: string | null; action?: string | null }[]
  ): void {
    if (items.length === 0) {
      this.drawParagraph("Not provided", { italic: true, color: rgb(0.6, 0.6, 0.6) });
      return;
    }
    items.forEach((item, i) => {
      this.ensureSpace(20);
      const numberLabel = `${i + 1}.`;
      safeDrawText(this.page, numberLabel, {
        x: MARGIN,
        y: this.y,
        size: 10,
        font: this.bold,
        color: NAVY,
      });
      const titleLines = this.wrapText(item.title, this.bold, 10, CONTENT_WIDTH - 20);
      titleLines.forEach((line, li) => {
        this.ensureSpace(15);
        safeDrawText(this.page, line, {
          x: MARGIN + 18,
          y: this.y,
          size: 10,
          font: this.bold,
          color: GREY_BODY,
        });
        this.y -= 14;
        if (li === 0) return;
      });
      if (item.body) {
        this.drawParagraph(item.body, { size: 9, indent: 18, color: rgb(0.4, 0.4, 0.4) });
      }
      if (item.action) {
        this.drawParagraph(`-> ${item.action}`, {
          size: 9,
          indent: 18,
          color: rgb(0.15, 0.4, 0.75),
        });
      }
      this.spacer(12);
    });
  }

  drawCrossAnalysisList(
    items: AnalysisJson["ai_generated"]["s10_cross_analysis"]
  ): void {
    if (items.length === 0) {
      this.drawParagraph("Not provided", { italic: true, color: rgb(0.6, 0.6, 0.6) });
      return;
    }
    items.forEach((entry) => {
      const color = CROSS_ANALYSIS_COLORS[entry.relationship] ?? rgb(0.5, 0.5, 0.5);
      const tagLabel = entry.relationship.replace(/_/g, " ");
      const tagSize = 7;
      const tagPaddingX = 5;
      const tagWidth = this.bold.widthOfTextAtSize(tagLabel, tagSize) + tagPaddingX * 2;
      const tagHeight = 12;

      const lines = this.wrapText(entry.finding, this.regular, 9, CONTENT_WIDTH - 4);
      const blockHeight = Math.max(tagHeight, 0) + 4 + lines.length * 13 + 10;
      this.ensureSpace(blockHeight);

      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - tagHeight + 2,
        width: tagWidth,
        height: tagHeight,
        color,
      });
      safeDrawText(this.page, tagLabel, {
        x: MARGIN + tagPaddingX,
        y: this.y - tagHeight + 5,
        size: tagSize,
        font: this.bold,
        color: WHITE,
      });
      safeDrawText(this.page, entry.topic, {
        x: MARGIN + tagWidth + 8,
        y: this.y - tagHeight + 5,
        size: 8,
        font: this.bold,
        color: rgb(0.4, 0.4, 0.4),
      });
      this.y -= tagHeight + 12;

      lines.forEach((line) => {
        this.ensureSpace(13);
        safeDrawText(this.page, line, {
          x: MARGIN,
          y: this.y,
          size: 9,
          font: this.regular,
          color: GREY_BODY,
        });
        this.y -= 13;
      });
      this.spacer(12);
    });
  }

  drawManagementAttentionCards(
    items: AnalysisJson["ai_generated"]["s13_management_attention"]
  ): void {
    if (items.length === 0) {
      this.drawParagraph("Not provided", { italic: true, color: rgb(0.6, 0.6, 0.6) });
      return;
    }
    items.forEach((item) => {
      const titleLines = this.wrapText(item.item, this.bold, 10, CONTENT_WIDTH - 20);
      const descLines = this.wrapText(item.explanation, this.regular, 9, CONTENT_WIDTH - 20);
      const sourceLine = `${item.type} · Source: ${item.source}`;
      const cardHeight =
        12 + titleLines.length * 13 + descLines.length * 12 + 16 + 12;

      this.ensureSpace(cardHeight + 10);

      const cardTop = this.y;
      this.page.drawRectangle({
        x: MARGIN,
        y: cardTop - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: WHITE,
        borderColor: rgb(0.85, 0.85, 0.87),
        borderWidth: 1,
      });
      this.page.drawRectangle({
        x: MARGIN,
        y: cardTop - cardHeight,
        width: 4,
        height: cardHeight,
        color: URGENCY_COLORS[item.urgency] ?? rgb(0.6, 0.6, 0.6),
      });

      let cy = cardTop - 14;
      titleLines.forEach((line) => {
        safeDrawText(this.page, line, { x: MARGIN + 14, y: cy, size: 10, font: this.bold, color: GREY_BODY });
        cy -= 13;
      });
      descLines.forEach((line) => {
        safeDrawText(this.page, line, { x: MARGIN + 14, y: cy, size: 9, font: this.regular, color: rgb(0.4, 0.4, 0.4) });
        cy -= 12;
      });
      cy -= 4;
      safeDrawText(this.page, sourceLine, {
        x: MARGIN + 14,
        y: cy,
        size: 8,
        font: this.regular,
        color: rgb(0.6, 0.6, 0.6),
      });

      this.y = cardTop - cardHeight - 10;
    });
  }

  drawClosingNoteBox(text: string | null | undefined): void {
    const lines = this.wrapText(text || "Not provided", this.italic, 10, CONTENT_WIDTH - 32);
    const boxHeight = lines.length * 15 + 32;
    this.ensureSpace(boxHeight);

    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: rgb(0.85, 0.85, 0.87),
      borderWidth: 1,
    });

    let cy = this.y - 20;
    lines.forEach((line) => {
      safeDrawText(this.page, line, { x: MARGIN + 16, y: cy, size: 10, font: this.italic, color: GREY_BODY });
      cy -= 15;
    });

    this.y -= boxHeight + 14;
  }
}

function ticketRows(ticketCounts: AnalysisJson["section_synthesis"]["s6_support_summary"]["ticket_counts"]) {
  const labels: { key: keyof typeof ticketCounts; label: string }[] = [
    { key: "total", label: "Total Raised" },
    { key: "resolved", label: "Resolved" },
    { key: "open", label: "Open" },
    { key: "critical", label: "Critical Incidents" },
    { key: "major", label: "Major Incidents" },
    { key: "recurring", label: "Recurring Issues" },
  ];
  return labels.map(({ key, label }) => [
    label,
    ticketCounts[key]?.count || "—",
    ticketCounts[key]?.summary || "—",
  ]);
}

async function drawCoverPage(
  builder: PdfBuilder,
  projectName: string,
  cadence: string,
  customerName: string,
  period: string,
  dateGenerated: string,
  customerLogoUrl: string | null
): Promise<void> {
  const page = builder.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const bgBytes = readPublicAsset("assets/cover_bg.png");
  console.log("[PDF cover] cover_bg.png read result:", bgBytes ? `${bgBytes.length} bytes` : "null (file not found)");
  if (bgBytes) {
    try {
      const bgImage = await builder.doc.embedPng(bgBytes);
      // Scale to cover the page without stretching (object-fit: cover)
      const imgAspect = bgImage.width / bgImage.height;
      const pageAspect = PAGE_WIDTH / PAGE_HEIGHT;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgAspect > pageAspect) {
        // Image is wider — fit height, crop sides
        drawH = PAGE_HEIGHT;
        drawW = drawH * imgAspect;
        drawX = (PAGE_WIDTH - drawW) / 2;
        drawY = 0;
      } else {
        // Image is taller — fit width, crop top/bottom
        drawW = PAGE_WIDTH;
        drawH = drawW / imgAspect;
        drawX = 0;
        drawY = (PAGE_HEIGHT - drawH) / 2;
      }
      page.drawImage(bgImage, { x: drawX, y: drawY, width: drawW, height: drawH });
      console.log("[PDF cover] cover_bg.png embedded and drawn successfully");
    } catch (err) {
      console.error("[PDF cover] embedPng failed, falling back to solid navy:", err);
      page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: NAVY });
    }
  } else {
    console.log("[PDF cover] cover_bg.png not found, using solid navy fallback");
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: NAVY });
  }

  const logoBytes = readPublicAsset("assets/selise_logo.png");
  if (logoBytes) {
    try {
      const logoImage = await builder.doc.embedPng(logoBytes);
      const logoWidth = 120;
      const scale = logoWidth / logoImage.width;
      const logoHeight = logoImage.height * scale;
      page.drawImage(logoImage, {
        x: PAGE_WIDTH - 120 - 30,
        y: PAGE_HEIGHT - 60,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {
      safeDrawText(page, "SELISE", {
        x: PAGE_WIDTH - 120 - 30,
        y: PAGE_HEIGHT - 60,
        size: 16,
        font: builder.bold,
        color: WHITE,
      });
    }
  } else {
    safeDrawText(page, "SELISE", {
      x: PAGE_WIDTH - 120 - 30,
      y: PAGE_HEIGHT - 60,
      size: 16,
      font: builder.bold,
      color: WHITE,
    });
  }

  const bannerHeight = PAGE_HEIGHT * 0.20;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: bannerHeight,
    color: rgb(0.05, 0.07, 0.15),
    opacity: 0.78,
  });

  // Vertical center the 3-line text block within the banner.
  // Block: title (20pt) + 8pt gap + quarter (12pt) + 8pt gap + date (12pt) ≈ 60pt total
  const totalBlockHeight = 60;
  const textBlockTop = (bannerHeight / 2) + (totalBlockHeight / 2);

  // White vertical accent bar — contained within the banner (y=0 to bannerHeight).
  page.drawRectangle({
    x: 40,
    y: 12,
    width: 4,
    height: bannerHeight - 24,
    color: WHITE,
  });

  const cadenceLabel = cadence.charAt(0).toUpperCase() + cadence.slice(1).toLowerCase();
  const coverTitle = `${projectName} — ${cadenceLabel} Service Delivery Report`;
  safeDrawText(page, coverTitle, {
    x: MARGIN,
    y: textBlockTop - 20,
    size: 20,
    font: builder.bold,
    color: WHITE,
  });
  safeDrawText(page, period, {
    x: MARGIN,
    y: textBlockTop - 20 - 20 - 8,
    size: 12,
    font: builder.regular,
    color: rgb(0.85, 0.85, 0.9),
  });
  safeDrawText(page, dateGenerated, {
    x: MARGIN,
    y: textBlockTop - 20 - 20 - 8 - 12 - 8,
    size: 12,
    font: builder.regular,
    color: rgb(0.7, 0.7, 0.78),
  });

  if (customerLogoUrl) {
    try {
      const response = await fetch(customerLogoUrl);
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") ?? "";
        const isPng = contentType.includes("png") || customerLogoUrl.toLowerCase().endsWith(".png");
        const image = isPng
          ? await builder.doc.embedPng(bytes)
          : await builder.doc.embedJpg(bytes);
        const logoWidth = 80;
        const scale = logoWidth / image.width;
        const logoHeight = image.height * scale;
        page.drawImage(image, {
          x: PAGE_WIDTH - MARGIN - logoWidth,
          y: bannerHeight / 2 - logoHeight / 2,
          width: logoWidth,
          height: logoHeight,
        });
      }
    } catch {
      // Customer logo is optional — skip silently if it can't be fetched/embedded.
    }
  }
}

export async function generateReportPdf(projectId: string): Promise<string> {
  const project = await getProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  console.log(`=== GENERATING NEW PDF for project: ${project.project_name} ===`);

  const analysisResult = await getAnalysisResult(projectId);
  if (!analysisResult) throw new Error(`No analysis_results found for project ${projectId}`);
  const analysis = analysisResult.analysis;

  const customerLogo = await getCustomerLogoByName(project.customer_name);

  const builder = await PdfBuilder.create(project.project_name, project.quarter);

  await drawCoverPage(
    builder,
    project.project_name,
    project.review_cadence,
    project.customer_name,
    project.quarter,
    analysis.report_meta.date_generated,
    customerLogo?.logo_url ?? null
  );

  builder.addContentPage();

  const ss = analysis.section_synthesis;
  const ai = analysis.ai_generated;

  // S1 Executive Summary
  builder.drawSectionHeader("1", "Executive Summary");
  const s1 = ss.s1_executive_summary;
  if (s1) {
    builder.drawStatusBadge(s1.overall_status, MARGIN, builder.y);
    builder.spacer(20);
    const s1Parts = [s1.delivery_focus, s1.highlights, s1.areas_requiring_attention, s1.next_quarter_preview].filter(Boolean);
    for (const part of s1Parts) {
      builder.drawParagraph(part);
      builder.spacer(8);
    }
  } else {
    builder.drawParagraph(null);
  }
  builder.spacer(20);

  // S2 Service Overview
  builder.drawSectionHeader("2", "Service Overview");
  const s2 = ss.s2_service_overview;
  builder.drawTable(
    ["Area", "Summary"],
    s2
      ? [
          ["Active Services", s2.active_services || "—"],
          ["Delivery Model", s2.delivery_model || "—"],
          ["Key Stakeholders", s2.key_stakeholders || "—"],
          ["Team Composition", s2.team_composition || "—"],
          ["Reporting Cadence", s2.reporting_cadence || "—"],
        ]
      : [],
    [140, CONTENT_WIDTH - 140]
  );
  builder.spacer(8);

  // S3 Key Achievements
  builder.drawSectionHeader("3", "Key Achievements");
  builder.drawNumberedList(
    (ss.s3_achievements ?? []).map((a) => ({ title: a.achievement, body: a.impact }))
  );
  builder.spacer(8);

  // S4 Delivery Summary
  builder.drawSectionHeader("4", "Delivery Summary");
  builder.drawTable(
    ["Workstream", "Status", "Summary", "Notes"],
    (ss.s4_delivery_summary ?? []).map((r) => [r.workstream, r.status, r.summary, r.notes]),
    [110, 60, 165, CONTENT_WIDTH - 110 - 60 - 165],
    { statusCol: 1 }
  );
  builder.spacer(8);

  // S5 Service Performance Metrics
  builder.drawSectionHeader("5", "Service Performance Metrics");
  builder.drawTable(
    ["Metric", "Target", "Actual", "Status", "Comment"],
    (ss.s5_metrics ?? []).map((r) => [r.metric, r.target, r.actual, r.status, r.comment]),
    [110, 60, 60, 55, CONTENT_WIDTH - 110 - 60 - 60 - 55],
    { statusCol: 3 }
  );
  builder.spacer(8);

  // S6 Support & Incident Summary
  builder.drawSectionHeader("6", "Support & Incident Summary");
  const s6 = ss.s6_support_summary;
  builder.drawTable(
    ["Category", "Count", "Summary"],
    s6 ? ticketRows(s6.ticket_counts) : [],
    [140, 60, CONTENT_WIDTH - 140 - 60]
  );
  builder.spacer(6);
  if (s6?.major_incidents?.length) {
    builder.drawParagraph("Major Incidents / Escalations", { bold: true, size: 10 });
    builder.spacer(4);
    builder.drawTable(
      ["Date", "Issue", "Impact", "Root Cause", "Action", "Status"],
      s6.major_incidents.map((inc) => [
        inc.date || "—",
        inc.issue,
        inc.impact,
        inc.root_cause,
        inc.action,
        inc.status,
      ]),
      [55, 85, 70, 85, 85, CONTENT_WIDTH - 55 - 85 - 70 - 85 - 85]
    );
  }
  builder.spacer(8);

  // S7 Quality & Delivery Health
  builder.drawSectionHeader("7", "Quality & Delivery Health");
  builder.drawTable(
    ["Area", "Observation", "Status", "Improvement Action"],
    (ss.s7_quality_health ?? []).map((r) => [r.area, r.observation, r.status, r.improvement_action]),
    [90, 165, 55, CONTENT_WIDTH - 90 - 165 - 55],
    { statusCol: 2 }
  );
  builder.spacer(8);

  // S8 Risks, Issues & Dependencies
  builder.drawSectionHeader("8", "Risks, Issues & Dependencies");
  builder.drawTable(
    ["Type", "Description", "Impact", "Owner", "Mitigation"],
    (ss.s8_risks ?? []).map((r) => [r.type, r.description, r.impact, r.owner, r.mitigation]),
    [55, 140, 50, 80, CONTENT_WIDTH - 55 - 140 - 50 - 80]
  );
  builder.spacer(8);

  // S9 Customer Feedback
  builder.drawSectionHeader("9", "Customer Feedback");
  const s9 = ss.s9_customer_feedback;
  builder.drawTable(
    ["Area", "Feedback"],
    s9
      ? [
          ["Satisfaction", s9.satisfaction || "—"],
          ["Communication", s9.communication || "—"],
          ["Responsiveness", s9.responsiveness || "—"],
          ["Business Alignment", s9.business_alignment || "—"],
          ["Areas of Concern", s9.areas_of_concern || "—"],
        ]
      : [],
    [140, CONTENT_WIDTH - 140]
  );
  if (s9?.relationship_health) {
    builder.spacer(10);
    builder.drawParagraph("Overall Relationship Health:", { bold: true, size: 9, indent: 0 });
    builder.spacer(6);
    builder.drawStatusBadge(s9.relationship_health, MARGIN + 8, builder.y);
    builder.spacer(22);
  }
  builder.spacer(8);

  // S10 Value Delivered
  builder.drawSectionHeader("10", "Value Delivered");
  const vd = ai.s10_value_delivered;
  const valueItems: { label: string; text: string | undefined }[] = [
    { label: "Business Value", text: vd?.business_value },
    { label: "Operational Value", text: vd?.operational_value },
    { label: "Technical Value", text: vd?.technical_value },
    { label: "Strategic Value", text: vd?.strategic_value },
  ];
  for (const item of valueItems) {
    builder.drawParagraph(item.label, { bold: true, size: 10, color: NAVY });
    builder.spacer(2);
    builder.drawParagraph(item.text ?? "Not provided");
    builder.spacer(12);
  }
  builder.spacer(4);

  // S11 Cross-Analysis Summary
  builder.drawSectionHeader("11", "Cross-Analysis Summary");
  builder.drawCrossAnalysisList(ai.s10_cross_analysis ?? []);
  builder.spacer(8);

  // S12 Lessons Learned
  builder.drawSectionHeader("12", "Lessons Learned");
  builder.drawNumberedList(
    (ai.s11_lessons_learned ?? []).map((l) => ({ title: l.lesson, body: l.context, action: l.action }))
  );
  builder.spacer(8);

  // S13 Next Quarter Focus
  builder.drawSectionHeader("13", "Next Quarter Focus");
  builder.drawTable(
    ["Focus Area", "Expected Outcome", "Owner"],
    (ai.s12_next_quarter_focus ?? []).map((r) => [r.focus_area, r.expected_outcome, r.owner]),
    [130, CONTENT_WIDTH - 130 - 130, 130]
  );
  builder.spacer(8);

  // S14 ITSM Maturity Summary
  builder.drawSectionHeader("14", "ITSM Maturity Summary");
  const itsmItems = ai.s15_itsm_maturity ?? [];
  if (itsmItems.length === 0) {
    builder.drawParagraph("Not provided", { italic: true, color: rgb(0.6, 0.6, 0.6) });
  } else {
    builder.drawCrossAnalysisList(
      itsmItems.map((item) => ({ topic: item.topic, relationship: item.relationship, finding: item.finding }))
    );
  }
  builder.spacer(8);

  // S15 Management Attention
  builder.drawSectionHeader("15", "Management Attention");
  builder.drawManagementAttentionCards(ai.s13_management_attention ?? []);
  builder.spacer(8);

  // S16 Closing Note
  builder.drawSectionHeader("16", "Closing Note");
  builder.drawClosingNoteBox(ai.s16_closing_note);

  const pdfBytes = await builder.doc.save();

  const admin = createAdminSupabaseClient();
  const storagePath = `${projectId}/report.pdf`;
  const { error: uploadError } = await admin.storage
    .from("reports")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("generateReportPdf: Supabase Storage upload failed:", uploadError);
    throw new Error(`PDF upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = admin.storage.from("reports").getPublicUrl(storagePath);
  const pdfUrl = publicUrlData.publicUrl;

  await updateProjectPdfUrl(projectId, pdfUrl);

  return pdfUrl;
}
