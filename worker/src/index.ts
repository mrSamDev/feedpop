import { handleRequest } from "./handler";

export interface Env {
  SUMMARY_KV: KVNamespace;
  OPENAI_API_KEY: string;
  AUTH_TOKEN: string;
}

export default {
  fetch(request: Request, env: Env) {
    return handleRequest(request, env);
  },
};