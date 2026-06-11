// ============================================================
// AURION MAINTENANCE — i18n dictionary + domain data
// Strings ported verbatim from design:prototype.html (`T`).
// Default language is Arabic (RTL); English is the alternate.
// ============================================================

export type Lang = "en" | "ar" | "bn" | "ur";
export const LANGS: { id: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { id: "ar", label: "العربية", dir: "rtl" },
  { id: "en", label: "English", dir: "ltr" },
  { id: "bn", label: "বাংলা", dir: "ltr" },
  { id: "ur", label: "اردو", dir: "rtl" },
];

/** A translation entry: either a static string per-lang, or a formatter. */
type StaticEntry = { en: string; ar: string; bn: string; ur: string };
type FnEntry = {
  en: (arg: number) => string;
  ar: (arg: number) => string;
  bn: (arg: number) => string;
  ur: (arg: number) => string;
};
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

// Bengali + Urdu month names (Western digits kept everywhere for day/year/time).
export const MON_BN = [
  "জানু",
  "ফেব",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্ট",
  "অক্টো",
  "নভে",
  "ডিসে",
] as const;
export const MON_UR = [
  "جنوری",
  "فروری",
  "مارچ",
  "اپریل",
  "مئی",
  "جون",
  "جولائی",
  "اگست",
  "ستمبر",
  "اکتوبر",
  "نومبر",
  "دسمبر",
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
export function relBn(m: number): string {
  if (m < 1) return "এইমাত্র";
  if (m < 60) return m + " মি আগে";
  if (m < 1440) return Math.floor(m / 60) + " ঘ আগে";
  return Math.floor(m / 1440) + " দি আগে";
}
export function relUr(m: number): string {
  if (m < 1) return "ابھی";
  if (m < 60) return m + " منٹ پہلے";
  if (m < 1440) return Math.floor(m / 60) + " گھنٹے پہلے";
  return Math.floor(m / 1440) + " دن پہلے";
}

export const T = {
  appName: {
    en: "Aurion Maintenance",
    ar: "صيانة أوريون",
    bn: "অরিয়ন মেইনটেন্যান্স",
    ur: "اوریون مینٹیننس",
  },
  signin: { en: "Sign in", ar: "تسجيل الدخول", bn: "সাইন ইন", ur: "سائن ان" },
  username: { en: "Username", ar: "اسم المستخدم", bn: "ইউজারনেম", ur: "یوزر نیم" },
  password: { en: "Password", ar: "كلمة المرور", bn: "পাসওয়ার্ড", ur: "پاس ورڈ" },
  loginError: {
    en: "Wrong username or password.",
    ar: "اسم المستخدم أو كلمة المرور غير صحيحة.",
    bn: "ইউজারনেম বা পাসওয়ার্ড ভুল।",
    ur: "یوزر نیم یا پاس ورڈ غلط ہے۔",
  },
  staff: { en: "Staff", ar: "موظف", bn: "কর্মী", ur: "عملہ" },
  admin: { en: "Admin", ar: "مشرف", bn: "অ্যাডমিন", ur: "ایڈمن" },
  navReports: { en: "Reports", ar: "البلاغات", bn: "রিপোর্ট", ur: "رپورٹس" },
  navAdd: { en: "Add", ar: "إضافة", bn: "যোগ করুন", ur: "شامل کریں" },
  navMine: { en: "My reports", ar: "بلاغاتي", bn: "আমার রিপোর্ট", ur: "میری رپورٹس" },
  navSummary: { en: "Summary", ar: "الملخص", bn: "সারসংক্ষেপ", ur: "خلاصہ" },
  navSettings: { en: "Settings", ar: "الإعدادات", bn: "সেটিংস", ur: "ترتیبات" },
  newReport: { en: "New report", ar: "بلاغ جديد", bn: "নতুন রিপোর্ট", ur: "نئی رپورٹ" },
  reportsTitle: { en: "Reports", ar: "البلاغات", bn: "রিপোর্ট", ur: "رپورٹس" },
  reportTitle: {
    en: "Report a problem",
    ar: "الإبلاغ عن مشكلة",
    bn: "সমস্যা জানান",
    ur: "مسئلہ رپورٹ کریں",
  },
  reportSub: {
    en: "Speak it or tap it — we'll handle the rest.",
    ar: "تحدّث أو اضغط — وسنتكفّل بالباقي.",
    bn: "বলুন বা ট্যাপ করুন — বাকিটা আমরা সামলাব।",
    ur: "بولیں یا ٹیپ کریں — باقی ہم سنبھال لیں گے۔",
  },
  tapSpeak: {
    en: "Tap and speak the problem",
    ar: "اضغط وتحدّث عن المشكلة",
    bn: "ট্যাপ করে সমস্যাটি বলুন",
    ur: "ٹیپ کریں اور مسئلہ بولیں",
  },
  listening: { en: "Listening…", ar: "يستمع…", bn: "শুনছি…", ur: "سن رہے ہیں…" },
  transcribing: {
    en: "Writing it down…",
    ar: "يكتب ما قلته…",
    bn: "লিখে নিচ্ছি…",
    ur: "لکھ رہے ہیں…",
  },
  understanding: { en: "Understanding…", ar: "يفهم ما قلته…", bn: "বুঝছি…", ur: "سمجھ رہے ہیں…" },
  stop: { en: "Stop", ar: "إيقاف", bn: "থামুন", ur: "روکیں" },
  voiceDenied: {
    en: "Microphone blocked — type the problem instead.",
    ar: "الميكروفون محظور — اكتب المشكلة بدلاً من ذلك.",
    bn: "মাইক্রোফোন বন্ধ — পরিবর্তে সমস্যাটি টাইপ করুন।",
    ur: "مائیکروفون بند ہے — اس کے بجائے مسئلہ ٹائپ کریں۔",
  },
  voiceFailed: {
    en: "Didn't catch that — type it in.",
    ar: "لم نسمع ذلك جيدًا — اكتبه يدويًا.",
    bn: "শোনা গেল না — টাইপ করে দিন।",
    ur: "سمجھ نہیں آیا — ٹائپ کر دیں۔",
  },
  youSaid: { en: "You said", ar: "قلت", bn: "আপনি বললেন", ur: "آپ نے کہا" },
  translatedFrom: {
    en: "Translated from",
    ar: "تُرجم من",
    bn: "অনুবাদ করা হয়েছে",
    ur: "ترجمہ کیا گیا از",
  },
  showTranslation: {
    en: "Show translation",
    ar: "عرض الترجمة",
    bn: "অনুবাদ দেখান",
    ur: "ترجمہ دکھائیں",
  },
  speaksLang: {
    en: "Language they speak",
    ar: "اللغة التي يتحدثها",
    bn: "তারা যে ভাষায় কথা বলে",
    ur: "وہ جو زبان بولتے ہیں",
  },
  notifications: { en: "Notifications", ar: "الإشعارات", bn: "নোটিফিকেশন", ur: "اطلاعات" },
  updateAvailable: {
    en: "Update available — refreshing…",
    ar: "يتوفّر تحديث — يتم التحديث…",
    bn: "আপডেট উপলব্ধ — রিফ্রেশ হচ্ছে…",
    ur: "اپ ڈیٹ دستیاب — ریفریش ہو رہا ہے…",
  },
  noNotifications: {
    en: "No notifications yet.",
    ar: "لا توجد إشعارات بعد.",
    bn: "এখনও কোনো নোটিফিকেশন নেই।",
    ur: "ابھی کوئی اطلاع نہیں۔",
  },
  pushOn: {
    en: "Notifications on",
    ar: "تم تفعيل الإشعارات",
    bn: "নোটিফিকেশন চালু",
    ur: "اطلاعات آن",
  },
  pushOff: {
    en: "Notifications off",
    ar: "تم إيقاف الإشعارات",
    bn: "নোটিফিকেশন বন্ধ",
    ur: "اطلاعات آف",
  },
  pushUnsupported: {
    en: "Notifications aren't supported on this device.",
    ar: "الإشعارات غير مدعومة على هذا الجهاز.",
    bn: "এই ডিভাইসে নোটিফিকেশন সমর্থিত নয়।",
    ur: "اس آلے پر اطلاعات معاون نہیں ہیں۔",
  },
  saved: { en: "Saved", ar: "تم الحفظ", bn: "সংরক্ষিত", ur: "محفوظ ہو گیا" },
  queuedOffline: {
    en: "Saved — will sync when online",
    ar: "محفوظ — سيُزامن عند الاتصال",
    bn: "সংরক্ষিত — অনলাইনে এলে সিঙ্ক হবে",
    ur: "محفوظ — آن لائن ہونے پر سنک ہوگا",
  },
  offline: { en: "Offline", ar: "غير متصل", bn: "অফলাইন", ur: "آف لائن" },
  backOnline: { en: "Back online", ar: "عاد الاتصال", bn: "আবার অনলাইন", ur: "دوبارہ آن لائن" },
  syncing: { en: "Syncing…", ar: "جارٍ المزامنة…", bn: "সিঙ্ক হচ্ছে…", ur: "سنک ہو رہا ہے…" },
  allSynced: { en: "All synced", ar: "تمت المزامنة", bn: "সব সিঙ্ক হয়েছে", ur: "سب سنک ہو گیا" },
  pendingSync: { en: "Pending sync", ar: "بانتظار المزامنة", bn: "সিঙ্ক বাকি", ur: "سنک باقی ہے" },
  showingSaved: {
    en: "Showing saved data",
    ar: "عرض البيانات المحفوظة",
    bn: "সংরক্ষিত ডেটা দেখানো হচ্ছে",
    ur: "محفوظ ڈیٹا دکھایا جا رہا ہے",
  },
  signoutQ: { en: "Sign out?", ar: "تسجيل الخروج؟", bn: "সাইন আউট করবেন?", ur: "سائن آؤٹ کریں؟" },
  signoutMsg: {
    en: "You'll need to sign in again to use the app.",
    ar: "ستحتاج إلى تسجيل الدخول مرة أخرى لاستخدام التطبيق.",
    bn: "অ্যাপ ব্যবহার করতে আবার সাইন ইন করতে হবে।",
    ur: "ایپ استعمال کرنے کے لیے دوبارہ سائن ان کرنا ہوگا۔",
  },
  or: {
    en: "or fill it in",
    ar: "أو املأها يدويًا",
    bn: "অথবা নিজে পূরণ করুন",
    ur: "یا خود بھریں",
  },
  addPhoto: { en: "Add a photo", ar: "أضف صورة", bn: "ছবি যোগ করুন", ur: "تصویر شامل کریں" },
  photoAdded: {
    en: "Photo added",
    ar: "تمت إضافة صورة",
    bn: "ছবি যোগ হয়েছে",
    ur: "تصویر شامل ہو گئی",
  },
  descLabel: {
    en: "What's the problem?",
    ar: "ما المشكلة؟",
    bn: "সমস্যাটি কী?",
    ur: "مسئلہ کیا ہے؟",
  },
  descPh: {
    en: "e.g. The AC isn't cooling",
    ar: "مثال: المكيّف لا يبرّد",
    bn: "যেমন: এসি ঠান্ডা করছে না",
    ur: "مثلاً: اے سی ٹھنڈا نہیں کر رہا",
  },
  roomLabel: { en: "Which room?", ar: "أي غرفة؟", bn: "কোন রুম?", ur: "کون سا کمرہ؟" },
  pickRoom: {
    en: "Choose a room",
    ar: "اختر الغرفة",
    bn: "রুম নির্বাচন করুন",
    ur: "کمرہ منتخب کریں",
  },
  propertyWord: { en: "Property", ar: "المبنى", bn: "প্রপার্টি", ur: "پراپرٹی" },
  roomWord: { en: "Room", ar: "الغرفة", bn: "রুম", ur: "کمرہ" },
  chooseWord: { en: "Choose", ar: "اختيار", bn: "নির্বাচন", ur: "منتخب کریں" },
  typeLabel: { en: "Type of problem", ar: "نوع المشكلة", bn: "সমস্যার ধরন", ur: "مسئلے کی قسم" },
  otherLabel: {
    en: "Describe the problem",
    ar: "صف المشكلة",
    bn: "সমস্যাটি বর্ণনা করুন",
    ur: "مسئلہ بیان کریں",
  },
  otherPh: {
    en: "What needs fixing?",
    ar: "ما الذي يحتاج إصلاحًا؟",
    bn: "কী মেরামত করতে হবে?",
    ur: "کیا ٹھیک کرنا ہے؟",
  },
  urgencyLabel: { en: "How urgent?", ar: "ما مدى الإلحاح؟", bn: "কতটা জরুরি?", ur: "کتنا فوری؟" },
  tagsLabel: {
    en: "Tags (optional)",
    ar: "وسوم (اختياري)",
    bn: "ট্যাগ (ঐচ্ছিক)",
    ur: "ٹیگز (اختیاری)",
  },
  send: { en: "Send report", ar: "إرسال البلاغ", bn: "রিপোর্ট পাঠান", ur: "رپورٹ بھیجیں" },
  aiFilled: { en: "AI", ar: "ذكاء", bn: "এআই", ur: "اے آئی" },
  urgent: { en: "Urgent", ar: "عاجل", bn: "জরুরি", ur: "فوری" },
  soon: { en: "Soon", ar: "قريبًا", bn: "শীঘ্রই", ur: "جلد" },
  wait: { en: "Can wait", ar: "يمكن الانتظار", bn: "অপেক্ষা করা যায়", ur: "انتظار ہو سکتا ہے" },
  done: { en: "Sent!", ar: "تم الإرسال!", bn: "পাঠানো হয়েছে!", ur: "بھیج دیا!" },
  doneSub: {
    en: "Your report is now in the list.",
    ar: "بلاغك الآن في القائمة.",
    bn: "আপনার রিপোর্ট এখন তালিকায় আছে।",
    ur: "آپ کی رپورٹ اب فہرست میں ہے۔",
  },
  ticket: { en: "Report", ar: "بلاغ رقم", bn: "রিপোর্ট নম্বর", ur: "رپورٹ نمبر" },
  viewReports: { en: "View reports", ar: "عرض البلاغات", bn: "রিপোর্ট দেখুন", ur: "رپورٹس دیکھیں" },
  goToMine: {
    en: "Go to my reports",
    ar: "الذهاب إلى بلاغاتي",
    bn: "আমার রিপোর্টে যান",
    ur: "میری رپورٹس پر جائیں",
  },
  min2photos: {
    en: "Add at least 2 photos",
    ar: "أضف صورتين على الأقل",
    bn: "অন্তত 2টি ছবি যোগ করুন",
    ur: "کم از کم 2 تصاویر شامل کریں",
  },
  refresh: { en: "Refresh", ar: "تحديث", bn: "রিফ্রেশ", ur: "ریفریش" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…", bn: "লোড হচ্ছে…", ur: "لوڈ ہو رہا ہے…" },
  loadError: {
    en: "Couldn't load this — try again.",
    ar: "تعذّر التحميل — حاول مجددًا.",
    bn: "লোড করা যায়নি — আবার চেষ্টা করুন।",
    ur: "لوڈ نہیں ہو سکا — دوبارہ کوشش کریں۔",
  },
  retry: { en: "Retry", ar: "إعادة المحاولة", bn: "আবার চেষ্টা করুন", ur: "دوبارہ کوشش" },
  search: { en: "Search", ar: "بحث", bn: "অনুসন্ধান", ur: "تلاش" },
  searchPh: {
    en: "Search room, description, or person…",
    ar: "ابحث عن غرفة أو وصف أو شخص…",
    bn: "রুম, বর্ণনা বা ব্যক্তি অনুসন্ধান করুন…",
    ur: "کمرہ، تفصیل یا فرد تلاش کریں…",
  },
  sortNewest: { en: "Newest", ar: "الأحدث", bn: "নতুন", ur: "تازہ ترین" },
  sortUrgent: { en: "Most urgent", ar: "الأكثر إلحاحًا", bn: "সবচেয়ে জরুরি", ur: "سب سے فوری" },
  sortDeadline: { en: "Deadline", ar: "الموعد النهائي", bn: "সময়সীমা", ur: "آخری تاریخ" },
  fAllProps: { en: "All", ar: "الكل", bn: "সব", ur: "سب" },
  noResults: {
    en: "No matching reports.",
    ar: "لا توجد بلاغات مطابقة.",
    bn: "কোনো মিল পাওয়া যায়নি।",
    ur: "کوئی مماثل رپورٹ نہیں۔",
  },
  loadMore: { en: "Load more", ar: "تحميل المزيد", bn: "আরও লোড করুন", ur: "مزید لوڈ کریں" },
  tAC: { en: "AC / Cooling", ar: "تكييف", bn: "এসি / শীতলীকরণ", ur: "اے سی / کولنگ" },
  tPlumb: { en: "Plumbing", ar: "سباكة", bn: "প্লাম্বিং", ur: "پلمبنگ" },
  tElec: { en: "Electrical", ar: "كهرباء", bn: "বৈদ্যুতিক", ur: "بجلی" },
  tFurn: { en: "Furniture", ar: "أثاث", bn: "আসবাবপত্র", ur: "فرنیچر" },
  tAppl: { en: "Appliances", ar: "أجهزة", bn: "যন্ত্রপাতি", ur: "آلات" },
  tNet: {
    en: "Internet / TV",
    ar: "إنترنت / تلفاز",
    bn: "ইন্টারনেট / টিভি",
    ur: "انٹرنیٹ / ٹی وی",
  },
  tClean: { en: "Cleaning", ar: "نظافة", bn: "পরিচ্ছন্নতা", ur: "صفائی" },
  tSafe: { en: "Safety", ar: "السلامة", bn: "নিরাপত্তা", ur: "حفاظت" },
  tOther: { en: "Other", ar: "أخرى", bn: "অন্যান্য", ur: "دیگر" },
  gVendor: { en: "Needs vendor", ar: "يحتاج مورّد", bn: "ভেন্ডর প্রয়োজন", ur: "وینڈر درکار" },
  gRecur: { en: "Recurring", ar: "متكرّر", bn: "পুনরাবৃত্ত", ur: "بار بار" },
  gParts: {
    en: "Waiting for parts",
    ar: "بانتظار قطع",
    bn: "যন্ত্রাংশের অপেক্ষায়",
    ur: "پرزوں کا انتظار",
  },
  gSafety: { en: "Safety", ar: "سلامة", bn: "নিরাপত্তা", ur: "حفاظت" },
  gVIP: { en: "VIP guest", ar: "نزيل مهم", bn: "ভিআইপি অতিথি", ur: "وی آئی پی مہمان" },
  addTag: { en: "+ Add", ar: "+ إضافة", bn: "+ যোগ করুন", ur: "+ شامل کریں" },
  fAll: { en: "All", ar: "الكل", bn: "সব", ur: "سب" },
  fUrgent: { en: "Urgent", ar: "عاجل", bn: "জরুরি", ur: "فوری" },
  fNew: { en: "New", ar: "جديد", bn: "নতুন", ur: "نیا" },
  fProgress: { en: "In progress", ar: "قيد المعالجة", bn: "চলমান", ur: "جاری" },
  fDone: { en: "Done", ar: "تم", bn: "সম্পন্ন", ur: "مکمل" },
  sNew: { en: "New", ar: "جديد", bn: "নতুন", ur: "نیا" },
  sProgress: { en: "In progress", ar: "قيد المعالجة", bn: "চলমান", ur: "جاری" },
  sDone: { en: "Done", ar: "تم", bn: "সম্পন্ন", ur: "مکمل" },
  take: { en: "Take it", ar: "أتولّاه", bn: "নিয়ে নিন", ur: "سنبھالیں" },
  takenBy: { en: "Taken by", ar: "يتولّاه", bn: "নিয়েছেন", ur: "سنبھالا" },
  youTook: {
    en: "You took this — mark as done?",
    ar: "أنت تولّيت هذا — وضعه كمكتمِل؟",
    bn: "আপনি এটি নিয়েছেন — সম্পন্ন চিহ্নিত করবেন?",
    ur: "آپ نے یہ سنبھالا — مکمل نشان زد کریں؟",
  },
  markDone: {
    en: "Mark as done",
    ar: "وضع كمكتمِل",
    bn: "সম্পন্ন চিহ্নিত করুন",
    ur: "مکمل نشان زد کریں",
  },
  reopen: { en: "Reopen", ar: "إعادة فتح", bn: "পুনরায় খুলুন", ur: "دوبارہ کھولیں" },
  deadline: { en: "Deadline", ar: "الموعد النهائي", bn: "সময়সীমা", ur: "آخری تاریخ" },
  ddToday: { en: "Today", ar: "اليوم", bn: "আজ", ur: "آج" },
  ddTomorrow: { en: "Tomorrow", ar: "غدًا", bn: "আগামীকাল", ur: "کل" },
  ddDays3: { en: "In 3 days", ar: "خلال 3 أيام", bn: "3 দিনের মধ্যে", ur: "3 دن میں" },
  ddWeek: { en: "This week", ar: "هذا الأسبوع", bn: "এই সপ্তাহে", ur: "اس ہفتے" },
  clearDl: { en: "Clear", ar: "إزالة", bn: "মুছুন", ur: "ہٹائیں" },
  dueToday: { en: "Due today", ar: "يستحق اليوم", bn: "আজ শেষ", ur: "آج تک" },
  dueTomorrow: { en: "Due tomorrow", ar: "يستحق غدًا", bn: "আগামীকাল শেষ", ur: "کل تک" },
  dueDays3: {
    en: "Due in 3 days",
    ar: "يستحق خلال 3 أيام",
    bn: "3 দিনের মধ্যে শেষ",
    ur: "3 دن میں",
  },
  dueWeek: { en: "Due this week", ar: "يستحق هذا الأسبوع", bn: "এই সপ্তাহে শেষ", ur: "اس ہفتے تک" },
  overdue: { en: "Overdue", ar: "متأخّر", bn: "সময় পেরিয়েছে", ur: "تاخیر" },
  reportedBy: { en: "Reported by", ar: "أبلغ عنه", bn: "রিপোর্ট করেছেন", ur: "رپورٹ کرنے والا" },
  noIssues: {
    en: "Nothing here yet.",
    ar: "لا شيء هنا بعد.",
    bn: "এখনও কিছু নেই।",
    ur: "ابھی یہاں کچھ نہیں۔",
  },
  mineSub: {
    en: "Tap the circle to check a job off.",
    ar: "اضغط الدائرة لإنهاء المهمة.",
    bn: "কাজ শেষ করতে বৃত্তে ট্যাপ করুন।",
    ur: "کام مکمل کرنے کے لیے دائرے پر ٹیپ کریں۔",
  },
  mineMade: {
    en: "Reported by me",
    ar: "أبلغت عنها",
    bn: "আমার করা রিপোর্ট",
    ur: "میری رپورٹ کردہ",
  },
  mineTook: { en: "Assigned to me", ar: "تولّيتها", bn: "আমাকে অর্পিত", ur: "میرے سپرد" },
  mineMadeSub: {
    en: "Reports you've submitted.",
    ar: "البلاغات التي أنشأتها.",
    bn: "আপনার জমা দেওয়া রিপোর্ট।",
    ur: "آپ کی جمع کردہ رپورٹس۔",
  },
  noPhoto: {
    en: "No photo attached",
    ar: "لا توجد صورة مرفقة",
    bn: "কোনো ছবি সংযুক্ত নেই",
    ur: "کوئی تصویر منسلک نہیں",
  },
  sumTitle: { en: "Summary", ar: "الملخص", bn: "সারসংক্ষেপ", ur: "خلاصہ" },
  stOpen: { en: "Open", ar: "مفتوحة", bn: "খোলা", ur: "کھلا" },
  stUrgent: { en: "Urgent", ar: "عاجلة", bn: "জরুরি", ur: "فوری" },
  stDone: { en: "Done today", ar: "أُنجزت اليوم", bn: "আজ সম্পন্ন", ur: "آج مکمل" },
  byType: { en: "By type", ar: "حسب النوع", bn: "ধরন অনুসারে", ur: "قسم کے لحاظ سے" },
  aiSummary: { en: "AI summary", ar: "ملخص ذكي", bn: "এআই সারসংক্ষেপ", ur: "اے آئی خلاصہ" },
  export: { en: "Export", ar: "تصدير", bn: "এক্সপোর্ট", ur: "ایکسپورٹ" },
  prepExport: {
    en: "Export runs in the live app",
    ar: "التصدير يعمل في النسخة المنشورة",
    bn: "এক্সপোর্ট লাইভ অ্যাপে কাজ করে",
    ur: "ایکسپورٹ لائیو ایپ میں چلتا ہے",
  },
  analyticsTitle: {
    en: "Repair speed",
    ar: "سرعة الإصلاح",
    bn: "মেরামতের গতি",
    ur: "مرمت کی رفتار",
  },
  avgTime: { en: "Avg. time", ar: "متوسط الوقت", bn: "গড় সময়", ur: "اوسط وقت" },
  fastest: { en: "Fastest", ar: "الأسرع", bn: "দ্রুততম", ur: "تیز ترین" },
  completed: { en: "Completed", ar: "مكتملة", bn: "সম্পন্ন", ur: "مکمل شدہ" },
  language: { en: "Language", ar: "اللغة", bn: "ভাষা", ur: "زبان" },
  appearance: { en: "Appearance", ar: "المظهر", bn: "চেহারা", ur: "ظاہری شکل" },
  system: { en: "System", ar: "النظام", bn: "সিস্টেম", ur: "سسٹم" },
  light: { en: "Light", ar: "فاتح", bn: "লাইট", ur: "روشن" },
  dark: { en: "Dark", ar: "داكن", bn: "ডার্ক", ur: "گہرا" },
  account: { en: "Account", ar: "الحساب", bn: "অ্যাকাউন্ট", ur: "اکاؤنٹ" },
  signout: { en: "Sign out", ar: "تسجيل الخروج", bn: "সাইন আউট", ur: "سائن آؤٹ" },
  team: { en: "Team", ar: "الفريق", bn: "দল", ur: "ٹیم" },
  audit: { en: "Audit log", ar: "سجل النشاط", bn: "অডিট লগ", ur: "آڈٹ لاگ" },
  addEmployee: {
    en: "Add employee",
    ar: "إضافة موظف",
    bn: "কর্মী যোগ করুন",
    ur: "ملازم شامل کریں",
  },
  name: { en: "Name", ar: "الاسم", bn: "নাম", ur: "نام" },
  role: { en: "Role", ar: "الدور", bn: "ভূমিকা", ur: "کردار" },
  you: { en: "You", ar: "أنت", bn: "আপনি", ur: "آپ" },
  added: { en: "Added", ar: "تمت إضافة", bn: "যোগ করেছেন", ur: "شامل کیا" },
  removed: { en: "Removed", ar: "تمت إزالة", bn: "অপসারণ করেছেন", ur: "ہٹایا" },
  vReport: { en: "reported", ar: "أبلغ عن", bn: "রিপোর্ট করেছেন", ur: "رپورٹ کیا" },
  vTook: { en: "took", ar: "تولّى", bn: "নিয়েছেন", ur: "سنبھالا" },
  vDone: { en: "completed", ar: "أكمل", bn: "সম্পন্ন করেছেন", ur: "مکمل کیا" },
  vDeadline: {
    en: "set a deadline on",
    ar: "حدّد موعدًا لـ",
    bn: "সময়সীমা নির্ধারণ করেছেন",
    ur: "آخری تاریخ مقرر کی",
  },
  vAdded: { en: "added", ar: "أضاف", bn: "যোগ করেছেন", ur: "شامل کیا" },
  vRemoved: { en: "removed", ar: "أزال", bn: "অপসারণ করেছেন", ur: "ہٹایا" },
  vLogin: { en: "signed in", ar: "سجّل الدخول", bn: "সাইন ইন করেছেন", ur: "سائن ان کیا" },
  vRole: {
    en: "changed the role of",
    ar: "غيّر دور",
    bn: "ভূমিকা পরিবর্তন করেছেন",
    ur: "کردار تبدیل کیا",
  },
  vPwreset: {
    en: "reset the password of",
    ar: "أعاد تعيين كلمة مرور",
    bn: "পাসওয়ার্ড রিসেট করেছেন",
    ur: "پاس ورڈ ری سیٹ کیا",
  },
  // ---- Manage area ----
  navManage: { en: "Manage", ar: "الإدارة", bn: "পরিচালনা", ur: "نظم کریں" },
  tabTeam: { en: "Team", ar: "الفريق", bn: "দল", ur: "ٹیم" },
  tabAudit: { en: "Audit", ar: "السجل", bn: "অডিট", ur: "آڈٹ" },
  tabAnalytics: { en: "Analytics", ar: "التحليلات", bn: "অ্যানালিটিক্স", ur: "اینالیٹکس" },
  resetPw: {
    en: "Reset password",
    ar: "إعادة تعيين كلمة المرور",
    bn: "পাসওয়ার্ড রিসেট",
    ur: "پاس ورڈ ری سیٹ",
  },
  newPassword: {
    en: "New password",
    ar: "كلمة مرور جديدة",
    bn: "নতুন পাসওয়ার্ড",
    ur: "نیا پاس ورڈ",
  },
  save: { en: "Save", ar: "حفظ", bn: "সংরক্ষণ", ur: "محفوظ کریں" },
  cancel: { en: "Cancel", ar: "إلغاء", bn: "বাতিল", ur: "منسوخ" },
  remove: { en: "Remove", ar: "إزالة", bn: "অপসারণ", ur: "ہٹائیں" },
  confirmRemove: {
    en: "Remove this employee?",
    ar: "إزالة هذا الموظف؟",
    bn: "এই কর্মীকে অপসারণ করবেন?",
    ur: "اس ملازم کو ہٹائیں؟",
  },
  roleChanged: {
    en: "Role updated",
    ar: "تم تحديث الدور",
    bn: "ভূমিকা আপডেট হয়েছে",
    ur: "کردار اپ ڈیٹ ہو گیا",
  },
  pwReset: {
    en: "Password reset",
    ar: "تمت إعادة تعيين كلمة المرور",
    bn: "পাসওয়ার্ড রিসেট হয়েছে",
    ur: "پاس ورڈ ری سیٹ ہو گیا",
  },
  removed2: {
    en: "Employee removed",
    ar: "تمت إزالة الموظف",
    bn: "কর্মী অপসারিত",
    ur: "ملازم ہٹا دیا گیا",
  },
  actionFailed: {
    en: "Something went wrong.",
    ar: "حدث خطأ ما.",
    bn: "কিছু একটা ভুল হয়েছে।",
    ur: "کچھ غلط ہو گیا۔",
  },
  exportCsv: { en: "Export CSV", ar: "تصدير CSV", bn: "CSV এক্সপোর্ট", ur: "CSV ایکسپورٹ" },
  downloadPdf: {
    en: "Download weekly PDF",
    ar: "تنزيل تقرير الأسبوع PDF",
    bn: "সাপ্তাহিক PDF ডাউনলোড",
    ur: "ہفتہ وار PDF ڈاؤن لوڈ",
  },
  timeToFix: { en: "Time to fix", ar: "زمن الإصلاح", bn: "মেরামতের সময়", ur: "مرمت کا وقت" },
  slaWithin: {
    en: "resolved within deadline",
    ar: "حُلّت ضمن الموعد النهائي",
    bn: "সময়সীমার মধ্যে সমাধান",
    ur: "آخری تاریخ کے اندر حل",
  },
  repeatOffenders: {
    en: "Repeat offenders",
    ar: "مشاكل متكرّرة",
    bn: "বারবার সমস্যা",
    ur: "بار بار کے مسائل",
  },
  needsPermfix: {
    en: "needs a permanent fix",
    ar: "يحتاج إصلاحًا دائمًا",
    bn: "স্থায়ী সমাধান প্রয়োজন",
    ur: "مستقل حل درکار",
  },
  trend: {
    en: "Trend (14 days)",
    ar: "الاتجاه (14 يومًا)",
    bn: "প্রবণতা (14 দিন)",
    ur: "رجحان (14 دن)",
  },
  trendCreated: { en: "Created", ar: "مُنشأة", bn: "তৈরি হয়েছে", ur: "بنائی گئی" },
  trendResolved: { en: "Resolved", ar: "محلولة", bn: "সমাধান হয়েছে", ur: "حل شدہ" },
  byProperty: {
    en: "By property",
    ar: "حسب المبنى",
    bn: "প্রপার্টি অনুসারে",
    ur: "پراپرٹی کے لحاظ سے",
  },
  byCategory: { en: "By category", ar: "حسب النوع", bn: "শ্রেণি অনুসারে", ur: "زمرے کے لحاظ سے" },
  leaderboard: { en: "Leaderboard", ar: "لوحة الإنجاز", bn: "লিডারবোর্ড", ur: "لیڈر بورڈ" },
  jobsResolved: { en: "resolved", ar: "محلولة", bn: "সমাধান হয়েছে", ur: "حل شدہ" },
  managerBrief: { en: "Manager brief", ar: "ملخص المدير", bn: "ম্যানেজার ব্রিফ", ur: "منیجر بریف" },
  noData: {
    en: "Not enough data yet.",
    ar: "لا توجد بيانات كافية بعد.",
    bn: "এখনও যথেষ্ট ডেটা নেই।",
    ur: "ابھی کافی ڈیٹا نہیں۔",
  },
  filterUser: { en: "User", ar: "المستخدم", bn: "ব্যবহারকারী", ur: "صارف" },
  filterAction: { en: "Action", ar: "النشاط", bn: "কার্যকলাপ", ur: "عمل" },
  allUsers: { en: "All users", ar: "كل المستخدمين", bn: "সব ব্যবহারকারী", ur: "تمام صارفین" },
  allActions: { en: "All actions", ar: "كل الأنشطة", bn: "সব কার্যকলাপ", ur: "تمام اعمال" },
  acReport: { en: "Reported", ar: "إبلاغ", bn: "রিপোর্ট", ur: "رپورٹ" },
  acTake: { en: "Took", ar: "تولّى", bn: "নিয়েছেন", ur: "سنبھالا" },
  acDone: { en: "Completed", ar: "إكمال", bn: "সম্পন্ন", ur: "مکمل" },
  acDeadline: { en: "Deadline", ar: "موعد نهائي", bn: "সময়সীমা", ur: "آخری تاریخ" },
  acAddemp: { en: "Added employee", ar: "إضافة موظف", bn: "কর্মী যোগ", ur: "ملازم شامل" },
  acRmemp: { en: "Removed employee", ar: "إزالة موظف", bn: "কর্মী অপসারণ", ur: "ملازم ہٹایا" },
  acLogin: { en: "Signed in", ar: "تسجيل دخول", bn: "সাইন ইন", ur: "سائن ان" },
  acRole: { en: "Role change", ar: "تغيير دور", bn: "ভূমিকা পরিবর্তন", ur: "کردار تبدیلی" },
  acPwreset: {
    en: "Password reset",
    ar: "إعادة تعيين كلمة المرور",
    bn: "পাসওয়ার্ড রিসেট",
    ur: "پاس ورڈ ری سیٹ",
  },
  xTimesIn60d: {
    en: (n: number) => `${n}× in 60 days`,
    ar: (n: number) => `${n}× خلال 60 يومًا`,
    bn: (n: number) => `60 দিনে ${n}×`,
    ur: (n: number) => `60 دن میں ${n}×`,
  },
  ago: {
    en: (m: number) => relEn(m),
    ar: (m: number) => relAr(m),
    bn: (m: number) => relBn(m),
    ur: (m: number) => relUr(m),
  },
} satisfies Record<string, Entry>;

export type Key = keyof typeof T;

// ============================================================
// Domain data — PROPS, TYPES, URGENCY, TAGS
// ============================================================

export type Property = {
  code: string;
  en: string;
  ar: string;
  bn: string;
  ur: string;
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
    bn: "আল-সালাম",
    ur: "السلام",
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
    bn: "আল-আকীক",
    ur: "العقیق",
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
    bn: "কুবা",
    ur: "قُبا",
    rooms: Array.from({ length: 20 }, (_, i) => String(i + 1)),
  },
  {
    code: "al_shaqqa",
    en: "The Apartment",
    ar: "الشقة",
    bn: "অ্যাপার্টমেন্ট",
    ur: "اپارٹمنٹ",
    rooms: [],
  },
  { code: "al_villa", en: "The Villa", ar: "الفيلا", bn: "ভিলা", ur: "ولا", rooms: [] },
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
