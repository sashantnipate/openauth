import { auth } from "@/lib/openauth";
import { createAuthRoutes } from "@openauth/nextjs";
import mongoose from "mongoose";

// Ensure database connection lazy loads on inbound HTTP traffic
const checkDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is completely missing.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

const routeHandlers = createAuthRoutes(auth);

export const GET = async (req: any, ctx: any) => {
  await checkDatabaseConnection();
  return routeHandlers.GET(req, ctx);
};

export const POST = async (req: any, ctx: any) => {
  await checkDatabaseConnection();
  return routeHandlers.POST(req, ctx);
};