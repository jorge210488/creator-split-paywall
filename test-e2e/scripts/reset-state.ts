#!/usr/bin/env ts-node
/**
 * Reset State Script - Clear Redis watermarks and dedupe keys for testing
 * Usage: npm run reset
 */
import { createClient } from "redis";
import { getConfig } from "./utils";

async function main() {
  const config = getConfig();

  console.log(`\n🔄 Resetting Analytics State`);
  console.log(`   Redis: ${config.redisUrl}`);

  const client = createClient({ url: config.redisUrl });

  try {
    await client.connect();
    console.log(`   ✅ Connected to Redis`);

    // Clear watermarks
    const watermarkKeys = await client.keys("an:wm:*");
    console.log(`\n🧹 Clearing ${watermarkKeys.length} watermark key(s)...`);
    for (const key of watermarkKeys) {
      await client.del(key);
      console.log(`   - ${key}`);
    }

    // Clear dedupe keys
    const dedupeKeys = await client.keys("an:dedupe:*");
    console.log(`\n🧹 Clearing ${dedupeKeys.length} dedupe key(s)...`);
    for (const key of dedupeKeys) {
      await client.del(key);
      console.log(`   - ${key}`);
    }

    // Clear alert keys
    const alertKeys = await client.keys("an:alert:*");
    console.log(`\n🧹 Clearing ${alertKeys.length} alert key(s)...`);
    for (const key of alertKeys) {
      await client.del(key);
      console.log(`   - ${key}`);
    }

    console.log(`\n✅ State reset complete - analytics will start fresh`);
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  } finally {
    await client.quit();
  }
}

if (require.main === module) {
  main();
}

export { main as resetState };
