import { execSync } from "child_process";
import path from "path";

console.log("=== NXTQR MASTER BRAND ASSET GENERATOR ===");

try {
  console.log("\n[1/2] Executing Icon Generator...");
  execSync(`tsx ${path.join(__dirname, "generate-icons.ts")}`, { stdio: "inherit" });

  console.log("\n[2/2] Executing Social Asset Generator...");
  execSync(`tsx ${path.join(__dirname, "generate-social.ts")}`, { stdio: "inherit" });

  console.log("\n=== ALL BRAND ASSETS GENERATED CLEANLY ===");
} catch (error) {
  console.error("Asset generation pipeline encountered an error:", error);
  process.exit(1);
}
