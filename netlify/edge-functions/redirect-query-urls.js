export default function redirectQueryUrls(request) {
  const url = new URL(request.url);

  if (["GET", "HEAD"].includes(request.method) && url.search) {
    url.search = "";
    return Response.redirect(url, 301);
  }
}

export const config = {
  path: "/*",
};
