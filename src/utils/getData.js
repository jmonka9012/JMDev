export const getJsonUrl = (routePath) => {
  const cleanPath = routePath.replace(/^\/|\/$/g, "");

  if (cleanPath === "") return "/data/index.json";
  if (["en", "de"].includes(cleanPath)) return `/data/${cleanPath}/index.json`;

  // For a post (for example, /en/post/123), automatically return /data/en/post/123.json.
  return `/data/${cleanPath}.json`;
};

export const getPageData = async (routePath) => {
  const jsonUrl = getJsonUrl(routePath);
  const isServer = typeof window === "undefined";

  if (isServer) {
    // During the build, read directly from disk.
    const fs = await import("fs");
    const path = await import("path");

    const localRelativePath = jsonUrl.replace(/^\//, "");
    const filePath = path.resolve(process.cwd(), `public/${localRelativePath}`);

    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    return null; // Return null when the file does not exist (for example, to handle 404s).
  } else {
    // Fetch in the browser.
    const res = await fetch(jsonUrl);
    if (res.ok) {
      try {
        return await res.json();
      } catch (error) {
        console.error(
          `🚨 Błąd: Zamiast pliku JSON pobrano HTML. Brak pliku: ${jsonUrl}`,
        );
        return null;
      }
    }
    return null;
  }
};

export const getPostDataById = async (id, lang = "pl") => {
  const routePath = lang === "pl" ? `/post/${id}` : `/${lang}/post/${id}`;

  return await getPageData(routePath);
};
