import { createClient } from "@supabase/supabase-js"

// Helper: derive a readable name from an email local-part
function nameFromEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return null
  const local = email.split("@")[0]
  if (!local) return null
  const spaced = local.replace(/[._-]+/g, " ").trim()
  if (!spaced) return null
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)

  console.log("Fetching profiles missing full_name…")
  // Fetch profiles with NULL or empty full_name
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .or("full_name.is.null,full_name.eq.")

  if (error) {
    console.error("Failed to fetch profiles:", error)
    process.exit(1)
  }

  if (!profiles || profiles.length === 0) {
    console.log("Nothing to backfill. All profiles have full_name.")
    return
  }

  let updated = 0
  for (const p of profiles) {
    const derived = nameFromEmail(p.email)
    if (!derived) continue
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: derived })
      .eq("id", p.id)
    if (updateError) {
      console.warn(`Failed to update ${p.id}:`, updateError.message)
      continue
    }
    updated += 1
  }

  console.log(`Backfill complete. Updated ${updated} profile(s).`)
}

main().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(1)
})
