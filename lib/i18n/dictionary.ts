// ============================================================
// AURION MAINTENANCE — i18n dictionary + domain data
// Strings ported verbatim from design:prototype.html (`T`).
// Default language is Arabic (RTL); English is the alternate.
// ============================================================

export type Lang = "en" | "ar";

/** A translation entry: either a static string per-lang, or a formatter. */
type StaticEntry = { en: string; ar: string };
type FnEntry = { en: (arg: number) => string; ar: (arg: number) => string };
type Entry = StaticEntry | FnEntry;

export const MON_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MON_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export function relEn(m: number): string {
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  if (m < 1440) return Math.floor(m / 60) + "h ago";
  return Math.floor(m / 1440) + "d ago";
}
export function relAr(m: number): string {
  if (m < 1) return "الآن";
  if (m < 60) return "قبل " + m + " د";
  if (m < 1440) return "قبل " + Math.floor(m / 60) + " س";
  return "قبل " + Math.floor(m / 1440) + " ي";
}

export const T = {
  appName: { en: "Aurion Maintenance", ar: "صيانة أوريون" },
  signin: { en: "Sign in", ar: "تسجيل الدخول" },
  username: { en: "Username", ar: "اسم المستخدم" },
  password: { en: "Password", ar: "كلمة المرور" },
  loginError: {
    en: "Wrong username or password.",
    ar: "اسم المستخدم أو كلمة المرور غير صحيحة.",
  },
  staff: { en: "Staff", ar: "موظف" },
  admin: { en: "Admin", ar: "مشرف" },
  navReports: { en: "Reports", ar: "البلاغات" },
  navAdd: { en: "Add", ar: "إضافة" },
  navMine: { en: "My reports", ar: "بلاغاتي" },
  navSummary: { en: "Summary", ar: "الملخص" },
  navSettings: { en: "Settings", ar: "الإعدادات" },
  newReport: { en: "New report", ar: "بلاغ جديد" },
  reportsTitle: { en: "Reports", ar: "البلاغات" },
  reportTitle: { en: "Report a problem", ar: "الإبلاغ عن مشكلة" },
  reportSub: {
    en: "Speak it or tap it — we'll handle the rest.",
    ar: "تحدّث أو اضغط — وسنتكفّل بالباقي.",
  },
  tapSpeak: { en: "Tap and speak the problem", ar: "اضغط وتحدّث عن المشكلة" },
  listening: { en: "Listening…", ar: "يستمع…" },
  transcribing: { en: "Writing it down…", ar: "يكتب ما قلته…" },
  or: { en: "or fill it in", ar: "أو املأها يدويًا" },
  addPhoto: { en: "Add a photo", ar: "أضف صورة" },
  photoAdded: { en: "Photo added", ar: "تمت إضافة صورة" },
  descLabel: { en: "What's the problem?", ar: "ما المشكلة؟" },
  descPh: { en: "e.g. The AC isn't cooling", ar: "مثال: المكيّف لا يبرّد" },
  roomLabel: { en: "Which room?", ar: "أي غرفة؟" },
  pickRoom: { en: "Choose a room", ar: "اختر الغرفة" },
  propertyWord: { en: "Property", ar: "المبنى" },
  roomWord: { en: "Room", ar: "الغرفة" },
  chooseWord: { en: "Choose", ar: "اختيار" },
  typeLabel: { en: "Type of problem", ar: "نوع المشكلة" },
  otherLabel: { en: "Describe the problem", ar: "صف المشكلة" },
  otherPh: { en: "What needs fixing?", ar: "ما الذي يحتاج إصلاحًا؟" },
  urgencyLabel: { en: "How urgent?", ar: "ما مدى الإلحاح؟" },
  tagsLabel: { en: "Tags (optional)", ar: "وسوم (اختياري)" },
  send: { en: "Send report", ar: "إرسال البلاغ" },
  aiFilled: { en: "AI", ar: "ذكاء" },
  urgent: { en: "Urgent", ar: "عاجل" },
  soon: { en: "Soon", ar: "قريبًا" },
  wait: { en: "Can wait", ar: "يمكن الانتظار" },
  done: { en: "Sent!", ar: "تم الإرسال!" },
  doneSub: { en: "Your report is now in the list.", ar: "بلاغك الآن في القائمة." },
  ticket: { en: "Report", ar: "بلاغ رقم" },
  viewReports: { en: "View reports", ar: "عرض البلاغات" },
  goToMine: { en: "Go to my reports", ar: "الذهاب إلى بلاغاتي" },
  min2photos: { en: "Add at least 2 photos", ar: "أضف صورتين على الأقل" },
  refresh: { en: "Refresh", ar: "تحديث" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  tAC: { en: "AC / Cooling", ar: "تكييف" },
  tPlumb: { en: "Plumbing", ar: "سباكة" },
  tElec: { en: "Electrical", ar: "كهرباء" },
  tFurn: { en: "Furniture", ar: "أثاث" },
  tAppl: { en: "Appliances", ar: "أجهزة" },
  tNet: { en: "Internet / TV", ar: "إنترنت / تلفاز" },
  tClean: { en: "Cleaning", ar: "نظافة" },
  tSafe: { en: "Safety", ar: "السلامة" },
  tOther: { en: "Other", ar: "أخرى" },
  gVendor: { en: "Needs vendor", ar: "يحتاج مورّد" },
  gRecur: { en: "Recurring", ar: "متكرّر" },
  gParts: { en: "Waiting for parts", ar: "بانتظار قطع" },
  gSafety: { en: "Safety", ar: "سلامة" },
  gVIP: { en: "VIP guest", ar: "نزيل مهم" },
  addTag: { en: "+ Add", ar: "+ إضافة" },
  fAll: { en: "All", ar: "الكل" },
  fUrgent: { en: "Urgent", ar: "عاجل" },
  fNew: { en: "New", ar: "جديد" },
  fProgress: { en: "In progress", ar: "قيد المعالجة" },
  fDone: { en: "Done", ar: "تم" },
  sNew: { en: "New", ar: "جديد" },
  sProgress: { en: "In progress", ar: "قيد المعالجة" },
  sDone: { en: "Done", ar: "تم" },
  take: { en: "Take it", ar: "أتولّاه" },
  takenBy: { en: "Taken by", ar: "يتولّاه" },
  markDone: { en: "Mark as done", ar: "وضع كمكتمِل" },
  reopen: { en: "Reopen", ar: "إعادة فتح" },
  deadline: { en: "Deadline", ar: "الموعد النهائي" },
  ddToday: { en: "Today", ar: "اليوم" },
  ddTomorrow: { en: "Tomorrow", ar: "غدًا" },
  ddDays3: { en: "In 3 days", ar: "خلال 3 أيام" },
  ddWeek: { en: "This week", ar: "هذا الأسبوع" },
  clearDl: { en: "Clear", ar: "إزالة" },
  dueToday: { en: "Due today", ar: "يستحق اليوم" },
  dueTomorrow: { en: "Due tomorrow", ar: "يستحق غدًا" },
  dueDays3: { en: "Due in 3 days", ar: "يستحق خلال 3 أيام" },
  dueWeek: { en: "Due this week", ar: "يستحق هذا الأسبوع" },
  overdue: { en: "Overdue", ar: "متأخّر" },
  reportedBy: { en: "Reported by", ar: "أبلغ عنه" },
  noIssues: { en: "Nothing here yet.", ar: "لا شيء هنا بعد." },
  mineSub: {
    en: "Tap the circle to check a job off.",
    ar: "اضغط الدائرة لإنهاء المهمة.",
  },
  mineMade: { en: "Reported by me", ar: "أبلغت عنها" },
  mineTook: { en: "Assigned to me", ar: "تولّيتها" },
  mineMadeSub: { en: "Reports you've submitted.", ar: "البلاغات التي أنشأتها." },
  noPhoto: { en: "No photo attached", ar: "لا توجد صورة مرفقة" },
  sumTitle: { en: "Summary", ar: "الملخص" },
  stOpen: { en: "Open", ar: "مفتوحة" },
  stUrgent: { en: "Urgent", ar: "عاجلة" },
  stDone: { en: "Done today", ar: "أُنجزت اليوم" },
  byType: { en: "By type", ar: "حسب النوع" },
  aiSummary: { en: "AI summary", ar: "ملخص ذكي" },
  export: { en: "Export", ar: "تصدير" },
  prepExport: {
    en: "Export runs in the live app",
    ar: "التصدير يعمل في النسخة المنشورة",
  },
  analyticsTitle: { en: "Repair speed", ar: "سرعة الإصلاح" },
  avgTime: { en: "Avg. time", ar: "متوسط الوقت" },
  fastest: { en: "Fastest", ar: "الأسرع" },
  completed: { en: "Completed", ar: "مكتملة" },
  language: { en: "Language", ar: "اللغة" },
  appearance: { en: "Appearance", ar: "المظهر" },
  system: { en: "System", ar: "النظام" },
  light: { en: "Light", ar: "فاتح" },
  dark: { en: "Dark", ar: "داكن" },
  account: { en: "Account", ar: "الحساب" },
  signout: { en: "Sign out", ar: "تسجيل الخروج" },
  team: { en: "Team", ar: "الفريق" },
  audit: { en: "Audit log", ar: "سجل النشاط" },
  addEmployee: { en: "Add employee", ar: "إضافة موظف" },
  name: { en: "Name", ar: "الاسم" },
  role: { en: "Role", ar: "الدور" },
  you: { en: "You", ar: "أنت" },
  added: { en: "Added", ar: "تمت إضافة" },
  removed: { en: "Removed", ar: "تمت إزالة" },
  vReport: { en: "reported", ar: "أبلغ عن" },
  vTook: { en: "took", ar: "تولّى" },
  vDone: { en: "completed", ar: "أكمل" },
  vDeadline: { en: "set a deadline on", ar: "حدّد موعدًا لـ" },
  vAdded: { en: "added", ar: "أضاف" },
  vRemoved: { en: "removed", ar: "أزال" },
  vLogin: { en: "signed in", ar: "سجّل الدخول" },
  ago: { en: (m: number) => relEn(m), ar: (m: number) => relAr(m) },
} satisfies Record<string, Entry>;

export type Key = keyof typeof T;

// ============================================================
// Domain data — PROPS, TYPES, URGENCY, TAGS
// ============================================================

export type Property = {
  code: string;
  en: string;
  ar: string;
  rooms: string[];
};

/**
 * Five properties (the dashboard confirms 5, not the prototype's 3).
 * `al_shaqqa` (The Apartment) and `al_villa` (The Villa) are whole-property
 * units with no room subdivision (rooms: []) — the room picker should treat
 * an empty list as "no room selection needed".
 */
export const PROPS: Property[] = [
  {
    code: "as_salaam",
    en: "Al-Salam",
    ar: "السلام",
    rooms: [
      "102",
      "103",
      "104",
      "105",
      "106",
      "201",
      "202",
      "203",
      "204",
      "205",
      "206",
      "207",
      "301",
      "302",
      "303",
      "304",
      "305",
      "306",
      "307",
    ],
  },
  {
    code: "al_aqeeq",
    en: "Al-Aqeeq",
    ar: "العقيق",
    rooms: [
      "101",
      "102",
      "103",
      "201",
      "202",
      "203",
      "204",
      "205",
      "206",
      "207",
      "208",
      "301",
      "302",
      "303",
      "304",
      "305",
      "306",
      "307",
      "308",
    ],
  },
  {
    code: "quba",
    en: "Quba",
    ar: "قُبا",
    rooms: Array.from({ length: 20 }, (_, i) => String(i + 1)),
  },
  { code: "al_shaqqa", en: "The Apartment", ar: "الشقة", rooms: [] },
  { code: "al_villa", en: "The Villa", ar: "الفيلا", rooms: [] },
];

export const TYPES = [
  { id: "ac", k: "tAC", ic: "ac" },
  { id: "plumbing", k: "tPlumb", ic: "plumbing" },
  { id: "electrical", k: "tElec", ic: "electrical" },
  { id: "furniture", k: "tFurn", ic: "furniture" },
  { id: "appliances", k: "tAppl", ic: "appliances" },
  { id: "internet", k: "tNet", ic: "internet" },
  { id: "cleaning", k: "tClean", ic: "cleaning" },
  { id: "safety", k: "tSafe", ic: "safety" },
  { id: "other", k: "tOther", ic: "other" },
] as const;

export const URG = [
  { id: "urgent", k: "urgent" },
  { id: "soon", k: "soon" },
  { id: "wait", k: "wait" },
] as const;

export const TAGS = [
  { id: "vendor", k: "gVendor" },
  { id: "recur", k: "gRecur" },
  { id: "parts", k: "gParts" },
  { id: "safety", k: "gSafety" },
  { id: "vip", k: "gVIP" },
] as const;

export const propMeta = (code: string): Property | undefined => PROPS.find((p) => p.code === code);
