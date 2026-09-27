import "server-only"

export const fetchApi = (request: Request): Promise<Response> => fetch(request)
