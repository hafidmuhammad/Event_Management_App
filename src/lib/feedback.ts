export type ToastTone = "success" | "error" | "info";
export function routeFeedback(params: URLSearchParams): { message: string; tone: ToastTone }[] {
  const result: { message: string; tone: ToastTone }[] = [];
  const notice = params.get("notice")?.trim();
  const error = params.get("error")?.trim();
  if (notice) result.push({ message: notice, tone: "success" });
  if (error) result.push({ message: error, tone: "error" });
  return result;
}
