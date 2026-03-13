// POST /api/oauth/token-update
// This is the callback endpoint that Report Zero server will POST the new token to.
// It must respond with { "received": true }

export async function POST(request) {
  try {
    const body = await request.json();

    console.log('[Callback Received]', JSON.stringify(body, null, 2));

    // Validate expected fields per the docs
    const { accessToken, expiresIn, expiresAt } = body;

    if (!accessToken) {
      return Response.json(
        { received: false, error: 'Missing accessToken in payload' },
        { status: 400 }
      );
    }

    // Store in a global in-memory log (resets on cold start, fine for testing)
    if (!global.callbackLog) global.callbackLog = [];
    global.callbackLog.unshift({
      receivedAt: new Date().toISOString(),
      accessToken: accessToken.substring(0, 30) + '...', // truncate for display
      expiresIn,
      expiresAt,
    });
    // Keep only last 20 entries
    global.callbackLog = global.callbackLog.slice(0, 20);

    // Required response per Report Zero docs
    return Response.json({ received: true });
  } catch (err) {
    console.error('[Callback Error]', err);
    return Response.json({ received: false, error: 'Invalid JSON' }, { status: 400 });
  }
}