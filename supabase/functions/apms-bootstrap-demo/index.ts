// Retired legacy endpoint. Kept as a non-mutating tombstone because the
// connected management integration cannot delete an already deployed function.
Deno.serve(() => new Response(JSON.stringify({ error: 'The demo bootstrap workflow is retired.' }), {
  status: 410,
  headers: { 'Content-Type': 'application/json' },
}));
