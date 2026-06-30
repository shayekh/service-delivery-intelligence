import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail(_projectId: string) {
  if (process.env.SEND_EMAIL !== "True") {
    return;
  }
  throw new Error("Not implemented");
}
