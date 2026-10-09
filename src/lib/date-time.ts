export const EVENT_TIME_ZONE = "Asia/Jakarta";
const displayFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: EVENT_TIME_ZONE });
const inputFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function formatEventDate(value: Date | string | null | undefined) {
  return value ? displayFormatter.format(new Date(value)) + " WIB" : "Not scheduled";
}
export function eventDateInput(value?: Date | null) {
  if (!value) return "";
  const parts = inputFormatter.formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function jakartaInput(value: string) { return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+07:00` : value; }
