// The shop runs on US Eastern time: sale end times and announcement times
// are typed, saved and shown in Eastern, whatever time zone the device uses.
export const SHOP_TIME_ZONE = "America/New_York";

function parts(date: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
}

// Minutes Eastern time is ahead of UTC at that moment (e.g. -240 in summer).
function offsetMinutes(date: Date) {
  const t = parts(date);
  return (Date.UTC(t.y, t.m - 1, t.d, t.h, t.min, t.s) - date.getTime()) / 60000;
}

// "2026-10-12T18:00" typed in a date-time field, read as Eastern → ISO time.
export function shopInputToISO(value: string): string | null {
  if (!value) return null;
  const [date, time = "00:00"] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  let ts = wall - offsetMinutes(new Date(wall)) * 60000;
  ts = wall - offsetMinutes(new Date(ts)) * 60000; // settle around clock changes
  return new Date(ts).toISOString();
}

// ISO time → "2026-10-12T18:00" in Eastern, for a date-time field.
export function isoToShopInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = parts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.y}-${pad(t.m)}-${pad(t.d)}T${pad(t.h)}:${pad(t.min)}`;
}
