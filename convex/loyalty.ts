import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// الحصول على برنامج الولاء للمستخدم
export const getUserLoyalty = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const loyalty = await ctx.db
      .query("userLoyaltyPoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!loyalty) {
      return null;
    }

    // حساب المستوى الحالي
    const currentTier = calculateTier(loyalty.points);
    
    return {
      ...loyalty,
      currentTier,
      totalPoints: loyalty.points,
      totalBookings: loyalty.totalVisits,
      totalSpent: loyalty.points * 10, // تقدير تقريبي
      pointsHistory: [], // سيتم تطويرها لاحقاً
    };
  },
});

// تهيئة برنامج الولاء للمستخدم
export const initializeLoyalty = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من عدم وجود برنامج ولاء مسبق
    const existingLoyalty = await ctx.db
      .query("userLoyaltyPoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingLoyalty) {
      throw new Error("برنامج الولاء مفعل بالفعل");
    }

    // إنشاء برنامج ولاء جديد
    return await ctx.db.insert("userLoyaltyPoints", {
      userId,
      providerId: "general" as any, // برنامج ولاء عام
      points: 100, // نقاط ترحيبية
      totalVisits: 0,
    });
  },
});

// إضافة نقاط ولاء
export const addLoyaltyPoints = mutation({
  args: {
    userId: v.id("users"),
    providerId: v.id("providers"),
    points: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // البحث عن سجل الولاء
    let loyalty = await ctx.db
      .query("userLoyaltyPoints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("providerId"), args.providerId))
      .first();

    if (!loyalty) {
      // إنشاء سجل جديد
      const loyaltyId = await ctx.db.insert("userLoyaltyPoints", {
        userId: args.userId,
        providerId: args.providerId,
        points: args.points,
        totalVisits: 1,
      });
      loyalty = await ctx.db.get(loyaltyId);
    } else {
      // تحديث النقاط
      await ctx.db.patch(loyalty._id, {
        points: loyalty.points + args.points,
        totalVisits: loyalty.totalVisits + 1,
      });
    }

    // إرسال إشعار
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "تم إضافة نقاط ولاء",
      message: `تم إضافة ${args.points} نقطة إلى رصيدك. السبب: ${args.reason}`,
      type: "system",
      isRead: false,
    });

    return loyalty;
  },
});

// استبدال النقاط
export const redeemPoints = mutation({
  args: {
    points: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const loyalty = await ctx.db
      .query("userLoyaltyPoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!loyalty || loyalty.points < args.points) {
      throw new Error("نقاط غير كافية");
    }

    // خصم النقاط
    await ctx.db.patch(loyalty._id, {
      points: loyalty.points - args.points,
    });

    // إرسال إشعار
    await ctx.db.insert("notifications", {
      userId,
      title: "تم استبدال النقاط",
      message: `تم استبدال ${args.points} نقطة. ${args.reason}`,
      type: "system",
      isRead: false,
    });

    return loyalty._id;
  },
});

// حساب المستوى
function calculateTier(points: number): string {
  if (points >= 1000) return "ذهبي";
  if (points >= 500) return "فضي";
  return "برونزي";
}
