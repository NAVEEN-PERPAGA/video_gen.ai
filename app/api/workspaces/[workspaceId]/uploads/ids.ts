/** Route ids go into the API path, so only plain positive integers are passed on. */
export function validIds(...ids: string[]) {
  return ids.every((id) => /^[1-9]\d{0,15}$/.test(id));
}

export function notFound() {
  return Response.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
}
