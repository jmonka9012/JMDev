import { parseFragment } from "parse5";

import { sanitizeProjectHtml } from "./projectContent.js";

const LEGACY_WORK_END = "10.2026";

const textWithBreaks = (node) => {
  if (node.nodeName === "#text") return node.value;
  if (node.tagName === "br") return "\n";

  return (node.childNodes || []).map(textWithBreaks).join("");
};

const contentParagraphs = (html) =>
  parseFragment(sanitizeProjectHtml(html))
    .childNodes.filter((node) => node.tagName === "p")
    .map(textWithBreaks)
    .map((text) => text.trim())
    .filter(Boolean);

const identityLines = (text) =>
  (text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const monthLabel = (value, lang) => {
  const date = String(value || "").trim();
  const match = date.match(/^(?:\d{2}[./])?(\d{2})[./](\d{4})$/);
  if (!match) return date;

  return `${match[1]}${lang === "en" ? "/" : "."}${match[2]}`;
};

const workPeriod = (period, data, lang) => {
  const parts = period.split(/\s*[–—]\s*|\s+-\s+/);
  const start = parts[0]?.trim() || monthLabel(data.start_of_work, lang);
  const end = parts.slice(1).join(" — ").trim();
  const openEnded = /^(teraz|obecnie|currently|present|now)$/i.test(end);

  if (end && !openEnded) return period;

  // Use the known end date while the legacy description still says "present".
  const resolvedEnd = monthLabel(data.end_of_work || LEGACY_WORK_END, lang);
  return [start, resolvedEnd].filter(Boolean).join(" — ");
};

export const experienceEntries = (data, lang = "pl") => {
  const work = contentParagraphs(data?.work_description);
  const education = contentParagraphs(data?.education_description);
  const workIdentity = identityLines(work[0]);
  const educationIdentity = identityLines(education[0]);
  const educationTitle = (educationIdentity[0] || "").split(/\s+[–—]\s+/);

  const role = workIdentity
    .slice(1)
    .join(" ")
    .replace(/^(Stanowisko|Position)\s*[–—-]\s*/i, "");
  const degree = educationIdentity
    .slice(1)
    .join(" ")
    .replace(/^(Stopień|Degree)\s*[–—-]\s*/i, "");
  const study = educationTitle
    .slice(1)
    .join(" – ")
    .replace(/^Kierunek\s+/i, "");

  const workPoints = work
    .slice(2)
    .flatMap((paragraph) => paragraph.split(/\s*•\s*/))
    .map((point) => point.trim())
    .filter(Boolean);

  const educationPoints = education
    .slice(2)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/u))
    .map((point) => point.trim())
    .filter(Boolean);

  const workDates = workIdentity.length
    ? workPeriod(work[1] || "", data, lang)
    : "";
  const educationDates =
    education[1] ||
    [
      monthLabel(data?.start_of_education, lang),
      monthLabel(data?.end_of_education, lang),
    ]
      .filter(Boolean)
      .join(" — ");

  return [
    {
      id: "work",
      category: data?.work_heading || "",
      organization: workIdentity[0] || "",
      role,
      period: workDates,
      year: workDates.match(/\d{4}/)?.[0] || "",
      points: workPoints,
    },
    {
      id: "education",
      category: data?.education_heading || "",
      organization: educationTitle[0] || "",
      role: [study, degree].filter(Boolean).join(" · "),
      period: educationDates,
      year: educationDates.match(/\d{4}/)?.[0] || "",
      points: educationPoints,
    },
  ].filter((entry) => entry.organization || entry.points.length);
};
