import { auth } from "@/lib/openauth";
import { createAuthRoutes } from "@openauth/nextjs";
import { getLiveDatabaseConfig } from "@openauth/sdk";
import mongoose from "mongoose";

/**
 * Ensures the database connection pool is healthy and loads the latest 
 * dashboard layout configuration parameters dynamically into the SDK memory instance.
 */
const ensureDatabaseHandshakeAndHydration = async (): Promise<void> => {
  const state = mongoose.connection.readyState;
  
  // 1. If disconnected or disconnecting, initialize a fresh socket connection pool
  if (state !== 1 && state !== 2) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is completely missing from your environmental configuration profile.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // 2. If the connection state is currently connecting (2), wait cleanly for completion
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(check);
          resolve(true);
        }
      }, 50);
    });
  }

  // 3. Fetch the real configuration rules out of your auth_configs ledger collection
  const liveConfig = await getLiveDatabaseConfig(auth);

  // 4. Overwrite in-memory rules dynamically right before route actions take place
  auth.config.auth.allowUserSignups = liveConfig.auth.allowUserSignups;
  auth.config.auth.session.duration = liveConfig.auth.session.duration;
  auth.config.auth.organizations.enabled = liveConfig.auth.organizations.enabled;
  
  auth.config.providers.github.enabled = liveConfig.providers.github.enabled;
  auth.config.providers.google.enabled = liveConfig.providers.google.enabled;
};

// 5. Initialize the Next.js API Router handler suite using your headless SDK core
const routeHandlers = createAuthRoutes(auth);

export const GET = async (
  req: Request, 
  ctx: { params: Promise<{ openauth: string[] }> }
) => {
  await ensureDatabaseHandshakeAndHydration();
  return routeHandlers.GET(req as any, ctx);
};

export const POST = async (
  req: Request, 
  ctx: { params: Promise<{ openauth: string[] }> }
) => {
  await ensureDatabaseHandshakeAndHydration();
  return routeHandlers.POST(req as any, ctx);
};