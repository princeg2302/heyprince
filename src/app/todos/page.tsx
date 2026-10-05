import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <main style={{ padding: "4rem 2rem", maxWidth: "600px", margin: "0 auto", color: "#fff", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1.5rem" }}>Supabase Connection Test</h1>
      {error ? (
        <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "8px" }}>
          <strong>Notice:</strong> {error.message}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#9ca3af" }}>
            Create a `todos` table in your Supabase dashboard to populate this test list.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", lineHeight: "2" }}>
          {todos && todos.length > 0 ? (
            todos.map((todo: { id: string | number; name?: string; title?: string }) => (
              <li key={todo.id}>{todo.name || todo.title || JSON.stringify(todo)}</li>
            ))
          ) : (
            <li style={{ color: "#9ca3af" }}>No todos found. Add items to your Supabase `todos` table!</li>
          )}
        </ul>
      )}
    </main>
  );
}
