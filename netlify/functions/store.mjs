import { getStore } from "@netlify/blobs";

// Token compartido para una validación mínima (no es seguridad real).
const TOKEN = "aumovio";
const STORE_NAME = "aumovio-padel-data";
const KEY = "state";           // torneo activo + historial (NO se toca su estructura)
const SESSIONS_KEY = "sessions"; // convocatorias de sesión (datos nuevos, aislados)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aumovio-Token",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors },
  });

export default async (request) => {
  console.log("[Aumovio API]", request.method, new URL(request.url).pathname);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(request.url);
  // La ruta pública de sesiones NO exige token: la gente confirma desde un enlace.
  const isPublicSessions = url.searchParams.get("scope") === "sessions";

  if (!isPublicSessions) {
    const token = request.headers.get("x-aumovio-token");
    if (token !== TOKEN) return json({ error: "Unauthorized" }, 401);
  }

  let store;
  try {
    store = getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (e) {
    return json({ error: "Blobs unavailable: " + e.message }, 500);
  }

  const readState = async () => {
    const data = await store.get(KEY, { type: "json" });
    return data || { active: null, history: [], updatedAt: 0 };
  };
  const writeState = async (state) => {
    state.updatedAt = Date.now();
    await store.setJSON(KEY, state);
    return state;
  };
  const readSessions = async () => {
    const data = await store.get(SESSIONS_KEY, { type: "json" });
    return data || { sessions: [], updatedAt: 0 };
  };
  const writeSessions = async (s) => {
    s.updatedAt = Date.now();
    await store.setJSON(SESSIONS_KEY, s);
    return s;
  };

  try {
    // ============ RUTA PÚBLICA DE SESIONES (sin token) ============
    if (isPublicSessions) {
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        const data = await readSessions();
        if (id) {
          const session = data.sessions.find((s) => s.id === id) || null;
          return json({ session });
        }
        return json(data);
      }
      if (request.method === "POST") {
        const body = await request.json();
        const data = await readSessions();

        if (body.action === "rsvp") {
          // Confirmación sin cuenta: identificamos por rsvpId generado en cliente.
          const idx = data.sessions.findIndex((s) => s.id === body.sessionId);
          if (idx < 0) return json({ error: "Session not found" }, 404);
          const session = data.sessions[idx];
          if (session.closed) return json({ error: "Session closed" }, 403);
          const rsvps = session.rsvps || [];
          const name = (body.name || "").trim();
          if (!name) return json({ error: "Name required" }, 400);
          const existingByRsvpId = body.rsvpId ? rsvps.findIndex((r) => r.rsvpId === body.rsvpId) : -1;
          const entry = {
            rsvpId: body.rsvpId || Math.random().toString(36).slice(2, 10),
            name,
            status: body.status || "yes", // yes | no | maybe
            at: Date.now(),
          };
          if (existingByRsvpId >= 0) {
            rsvps[existingByRsvpId] = { ...rsvps[existingByRsvpId], ...entry };
          } else {
            rsvps.push(entry);
          }
          session.rsvps = rsvps;
          data.sessions[idx] = session;
          await writeSessions(data);
          return json({ session });
        }

        if (body.action === "remove-rsvp") {
          const idx = data.sessions.findIndex((s) => s.id === body.sessionId);
          if (idx < 0) return json({ error: "Session not found" }, 404);
          const session = data.sessions[idx];
          session.rsvps = (session.rsvps || []).filter((r) => r.rsvpId !== body.rsvpId);
          data.sessions[idx] = session;
          await writeSessions(data);
          return json({ session });
        }

        return json({ error: "Unknown public action: " + body.action }, 400);
      }
      return json({ error: "Method not allowed" }, 405);
    }

    // ============ RUTA PRIVADA (torneo + gestión de sesiones) ============
    if (request.method === "GET") {
      const state = await readState();
      const sessions = await readSessions();
      return json({ ...state, sessions: sessions.sessions || [] });
    }

    if (request.method === "POST") {
      const body = await request.json();

      // --- Acciones de gestión de sesiones (requieren token) ---
      if (body.action === "create-session" || body.action === "update-session" ||
          body.action === "delete-session" || body.action === "close-session") {
        const data = await readSessions();
        switch (body.action) {
          case "create-session":
            data.sessions = [body.session, ...(data.sessions || [])];
            break;
          case "update-session":
            data.sessions = (data.sessions || []).map((s) => s.id === body.session.id ? { ...s, ...body.session } : s);
            break;
          case "close-session":
            data.sessions = (data.sessions || []).map((s) => s.id === body.id ? { ...s, closed: !!body.closed } : s);
            break;
          case "delete-session":
            data.sessions = (data.sessions || []).filter((s) => s.id !== body.id);
            break;
        }
        const saved = await writeSessions(data);
        return json({ sessions: saved.sessions });
      }

      // --- Acciones de torneo (las de siempre) ---
      const state = await readState();
      switch (body.action) {
        case "set-active":
          state.active = body.active || null;
          break;
        case "archive":
          if (body.archived) {
            state.history = [body.archived, ...state.history.filter((t) => t.id !== body.archived.id)];
            state.active = null;
          }
          break;
        case "delete-history":
          state.history = state.history.filter((t) => t.id !== body.id);
          break;
        case "update-history":
          if (body.tournament) {
            state.history = state.history.map((t) => t.id === body.tournament.id ? body.tournament : t);
          }
          break;
        case "reset":
          state.active = null;
          state.history = [];
          break;
        default:
          return json({ error: "Unknown action: " + body.action }, 400);
      }
      const updated = await writeState(state);
      const sessions = await readSessions();
      return json({ ...updated, sessions: sessions.sessions || [] });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[Aumovio API] Error:", e);
    return json({ error: e.message }, 500);
  }
};
// El routing /api/store -> /.netlify/functions/store está en netlify.toml
