// POST /api/generate-token
// Proxies the token request to Report Zero, injecting the callbackUrl

export async function POST(request) {
  try {
    const { clientId, clientSecret, tokenEndpoint, callbackUrl } = await request.json();

    if (!clientId || !clientSecret || !tokenEndpoint) {
      return Response.json({ error: 'clientId, clientSecret, and tokenEndpoint are required' }, { status: 400 });
    }

    const body = { clientId, clientSecret };
    if (callbackUrl) body.callbackUrl = callbackUrl;

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json({
      status: response.status,
      ok: response.ok,
      data,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}