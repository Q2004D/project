import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get active promotions for a provider
export const getActivePromotions = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    return await ctx.db
      .query("promotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("validFrom"), today),
          q.gte(q.field("validUntil"), today)
        )
      )
      .collect();
  },
});

// Create promotion
export const createPromotion = mutation({
  args: {
    providerId: v.id("providers"),
    title: v.string(),
    description: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    minSpend: v.optional(v.number()),
    validFrom: v.string(),
    validUntil: v.string(),
    usageLimit: v.optional(v.number()),
    applicableServices: v.optional(v.array(v.id("services"))),
    targetTiers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db.insert("promotions", {
      ...args,
      usedCount: 0,
      isActive: true,
    });
  },
});

// Get provider promotions
export const getProviderPromotions = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db
      .query("promotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();
  },
});

// Update promotion
export const updatePromotion = mutation({
  args: {
    promotionId: v.id("promotions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    validUntil: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const promotion = await ctx.db.get(args.promotionId);
    if (!promotion) throw new Error("Promotion not found");

    const provider = await ctx.db.get(promotion.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    const { promotionId, ...updates } = args;
    await ctx.db.patch(promotionId, updates);
  },
});
