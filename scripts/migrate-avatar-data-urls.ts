/**
 * One-time migration: moves base64 data-URL avatars from users.avatar_url
 * into Supabase Storage and updates the column to the Storage public URL.
 *
 * Run with:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-avatar-data-urls.ts
 *
 * Review the dry-run output first, then set DRY_RUN=false to actually migrate.
 */

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.env.DRY_RUN !== "false";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function run() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}\n`);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, avatar_url")
    .like("avatar_url", "data:%");

  if (error) { console.error("Query failed:", error); process.exit(1); }
  if (!users || users.length === 0) { console.log("No data-URL avatars found — nothing to migrate."); return; }

  console.log(`Found ${users.length} user(s) with data-URL avatars.\n`);

  for (const user of users) {
    const dataUrl: string = user.avatar_url;
    console.log(`User ${user.id}: ${dataUrl.slice(0, 60)}…`);

    if (DRY_RUN) { console.log("  → (dry run, skipping upload)\n"); continue; }

    try {
      // Decode base64
      const [header, b64] = dataUrl.split(",");
      const mimeMatch = header.match(/data:([^;]+);/);
      const mime = mimeMatch?.[1] ?? "image/jpeg";
      const ext = mime.split("/")[1] ?? "jpg";
      const buffer = Buffer.from(b64, "base64");

      // Delete any existing avatar files for this user
      const { data: existing } = await supabase.storage.from("avatars").list(user.id);
      if (existing && existing.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(existing.map((f: { name: string }) => `${user.id}/${f.name}`));
      }

      // Upload to storage
      const path = `${user.id}/avatar-migrated.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, buffer, { contentType: mime, upsert: true });

      if (uploadErr) { console.error(`  ✗ Upload failed: ${uploadErr.message}`); continue; }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

      // Update the DB row
      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateErr) { console.error(`  ✗ DB update failed: ${updateErr.message}`); continue; }

      console.log(`  ✓ Migrated → ${urlData.publicUrl}\n`);
    } catch (err) {
      console.error(`  ✗ Unexpected error: ${err}`);
    }
  }

  console.log("Done.");
}

run();
