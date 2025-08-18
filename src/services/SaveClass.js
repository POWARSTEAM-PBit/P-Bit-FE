const STORAGE_KEY = "pbit_classes";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// مولّد كود الصف (6 أحرف/أرقام بدون لبس)
function generateClassCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function listClasses() {
  return load();
}

export function createClass({ name, description = "", tags = [] }) {
  const list = load();

  // تحقق اختياري لاسم فريد (كما في الـ AC "إذا كان ينطبق")
  if (list.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
    const err = new Error("Class name must be unique");
    err.code = "DUPLICATE_NAME";
    throw err;
  }

  const cls = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim(),
    tags,
    code: generateClassCode(6),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(cls);
  save(list);
  return cls; // نرجّع الكلاس عشان نعرض الكود برسالة نجاح
}
