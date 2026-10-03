/* global Deno */
import { createClient } from "npm:@supabase/supabase-js@2.116.0"
import { deleteAccount } from "./handler.js"
Deno.serve((request) => deleteAccount(request, { createClient, env: (key) => Deno.env.get(key) }))
