export async function GET() {
  return Response.json({ log: global.callbackLog || [] });
}

export async function DELETE() {
  global.callbackLog = [];
  return Response.json({ cleared: true });
}