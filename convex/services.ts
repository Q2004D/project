import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get services by provider
export const getServicesByProvider = query({
  args: { 
    providerId: v.id("providers"),
    includeInactive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("services")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId));
    
    // إذا لم يتم تحديد includeInactive أو كان false، أظهر النشطة فقط
    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }
    
    return await query.collect();
  },
});

// Create a new service
export const createService = mutation({
  args: {
    providerId: v.id("providers"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    duration: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // Verify user owns the provider
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بإضافة خدمات لهذا المقدم");
    }

    return await ctx.db.insert("services", {
      providerId: args.providerId,
      name: args.name,
      description: args.description,
      price: args.price,
      duration: args.duration,
      isActive: args.isActive ?? true,
    });
  },
});

// Update service
export const updateService = mutation({
  args: {
    serviceId: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    duration: v.optional(v.number()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const service = await ctx.db.get(args.serviceId);
    if (!service) {
      throw new Error("الخدمة غير موجودة");
    }

    const provider = await ctx.db.get(service.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بتعديل هذه الخدمة");
    }

    const { serviceId, ...updates } = args;
    await ctx.db.patch(serviceId, updates);
    return serviceId;
  },
});

// Get single service
export const getService = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    return service;
  },
});

// Delete service
export const deleteService = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const service = await ctx.db.get(args.serviceId);
    if (!service) {
      throw new Error("الخدمة غير موجودة");
    }

    const provider = await ctx.db.get(service.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بحذف هذه الخدمة");
    }

    await ctx.db.delete(args.serviceId);
    return args.serviceId;
  },
});
