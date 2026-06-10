// Server-only Groq client. Groq exposes an OpenAI-compatible API, so we use
// the OpenAI SDK pointed at Groq's base URL. NEVER import this from client code
// — `server-only` makes that a build error and keeps GROQ_API_KEY off the client.
import "server-only";
import OpenAI from "openai";

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
