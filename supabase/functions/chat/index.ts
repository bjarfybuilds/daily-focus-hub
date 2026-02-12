import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "create_tasks",
      description: "Create one or more new tasks in a project bucket. Use this when the user asks to add/create tasks.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Task title" },
                bucket_id: { type: "string", enum: ["finance", "admin", "content", "ads", "product", "website", "branding", "music"], description: "Which bucket to put the task in" },
                priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority, default medium" },
                description: { type: "string", description: "Optional task description" },
              },
              required: ["title", "bucket_id"],
              additionalProperties: false,
            },
          },
        },
        required: ["tasks"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_task",
      description: "Rename an existing task. Use when user asks to change a task's name/title.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The task ID to rename" },
          new_title: { type: "string", description: "The new title" },
        },
        required: ["task_id", "new_title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_tasks",
      description: "Delete one or more tasks. Use when user asks to remove/delete tasks.",
      parameters: {
        type: "object",
        properties: {
          task_ids: { type: "array", items: { type: "string" }, description: "Task IDs to delete" },
        },
        required: ["task_ids"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_task_to_slot",
      description: "Move a task from a bucket into the daily playbook. Use when user says to add a task to today's focus/playbook.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The task ID to move" },
          slot_number: { type: "number", description: "Playbook slot 1-8" },
        },
        required: ["task_id", "slot_number"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_priority",
      description: "Change a task's priority. Use when user asks to change priority.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["task_id", "priority"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_task_to_bucket",
      description: "Move a task to a different bucket. Use when user asks to move a task between buckets.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          new_bucket_id: { type: "string", enum: ["finance", "admin", "content", "ads", "product", "website", "branding", "music"] },
        },
        required: ["task_id", "new_bucket_id"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build system prompt with live context
    let systemContent = `You are the CHAT GSD AI assistant — a strategic productivity partner that can TAKE ACTIONS on the user's task board.

You have access to tools to create, rename, delete, move, and prioritize tasks. When the user asks you to do something actionable, USE THE TOOLS. Don't just tell them how to do it — do it for them.

Be direct, concise, and action-oriented. After taking actions, confirm what you did in a brief, friendly way.`;

    if (context) {
      systemContent += `\n\nHere is the current state of the user's task board:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    // Return the full response — client handles tool calls
    return new Response(JSON.stringify({
      message: choice?.message || {},
      tool_calls: choice?.message?.tool_calls || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
