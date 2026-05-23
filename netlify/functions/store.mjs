import { getStore } from "@netlify/blobs";

// Token compartido para una validación mínima.
// No es seguridad real (cualquiera con el código fuente lo ve), pero filtra escaneos automáticos.
const TOKEN = "aumovio";
const STORE_NAME = "aumovio-padel-data";
const KEY = "state";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aumovio-Token",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...cors,
    },
  });

export default async (request) => {
  console.log("[Aumovio API]", request.method, new URL(request.url).pathname);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // Token check
  const token = request.headers.get("x-aumovio-token");
  if (token !== TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Get blob store
  let store;
  try {
    store = getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (e) {
    return json({ error: "Blobs unavailable: " + e.message }, 500);
  }

  const read = async () => {
    const data = await store.get(KEY, { type: "json" });
    return data || { active: null, history: [], updatedAt: 0 };
  };

  const write = async (state) => {
    state.updatedAt = Date.now();
    await store.setJSON(KEY, state);
    return state;
  };

  try {
    if (request.method === "GET") {
      const state = await read();
      return json(state);
    }

    if (request.method === "POST") {
      const body = await request.json();
      const state = await read();

      switch (body.action) {
        case "set-active":
          state.active = body.active || null;
          break;
        case "archive":
          if (body.archived) {
            state.history = [
              body.archived,
              ...state.history.filter((t) => t.id !== body.archived.id),
            ];
            state.active = null;
          }
          break;
        case "delete-history":
          state.history = state.history.filter((t) => t.id !== body.id);
          break;
        case "reset":
          state.active = null;
          state.history = [];
          break;
        default:
          return json({ error: "Unknown action: " + body.action }, 400);
      }

      const updated = await write(state);
      return json(updated);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[Aumovio API] Error:", e);
    return json({ error: e.message }, 500);
  }
};
// El routing /api/store -> /.netlify/functions/store está en netlify.toml
