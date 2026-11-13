export function groupTechnologies(technologies, lang = "pl") {
  const groups = new Map();
  for (const technology of technologies) {
    const category = technology.category;
    const key = category?.key || "uncategorized";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label:
          category?.labels?.[lang] ||
          category?.labels?.pl ||
          (lang === "pl" ? "Pozostałe" : "Other"),
        order: Number.isFinite(category?.order) ? category.order : Infinity,
        technologies: [],
      });
    }
    groups.get(key).technologies.push(technology);
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}

export function categoryKeyAt(categories, currentKey, key) {
  const current = Math.max(
    0,
    categories.findIndex((item) => item.key === currentKey),
  );
  const last = categories.length - 1;
  const index = {
    ArrowRight: (current + 1) % categories.length,
    ArrowLeft: (current + last) % categories.length,
    Home: 0,
    End: last,
  }[key];
  return categories[index]?.key;
}
