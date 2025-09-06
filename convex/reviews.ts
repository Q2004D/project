import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// إضافة تقييم جديد
export const createReview = mutation({
  args: {
    providerId: v.id("providers"),
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من أن الحجز مكتمل ويخص المستخدم
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== userId || booking.status !== "completed") {
      throw new Error("لا يمكن تقييم هذا الحجز");
    }

    // التحقق من عدم وجود تقييم سابق لنفس الحجز
    const existingReview = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("bookingId"), args.bookingId))
      .first();

    if (existingReview) {
      throw new Error("تم تقييم هذا الحجز مسبقاً");
    }

    // إنشاء التقييم
    const reviewId = await ctx.db.insert("reviews", {
      providerId: args.providerId,
      userId,
      bookingId: args.bookingId,
      rating: args.rating,
      comment: args.comment,
    });

    // تحديث تقييم مقدم الخدمة
    await updateProviderRating(ctx, args.providerId);

    return reviewId;
  },
});

// تحديث متوسط تقييم مقدم الخدمة
async function updateProviderRating(ctx: any, providerId: string) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_provider", (q: any) => q.eq("providerId", providerId))
    .collect();

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await ctx.db.patch(providerId, {
    rating: Math.round(averageRating * 10) / 10, // تقريب لرقم عشري واحد
    reviewCount: reviews.length,
  });
}

// الحصول على تقييمات مقدم خدمة
export const getProviderReviews = query({
  args: { 
    providerId: v.id("providers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);

    // إضافة تفاصيل المستخدمين
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const booking = await ctx.db.get(review.bookingId);
        const service = booking ? await ctx.db.get(booking.serviceId) : null;
        
        return {
          ...review,
          user: user ? { 
            name: user.name || 'مستخدم', 
            email: user.email 
          } : null,
          service: service ? { name: service.name } : null,
        };
      })
    );

    return reviewsWithUsers;
  },
});

// الحصول على تقييمات المستخدم
export const getUserReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // إضافة تفاصيل مقدم الخدمة والحجز
    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review) => {
        const provider = await ctx.db.get(review.providerId);
        const booking = await ctx.db.get(review.bookingId);
        const service = booking ? await ctx.db.get(booking.serviceId) : null;
        
        return {
          ...review,
          provider: provider ? { 
            name: provider.name,
            category: provider.category 
          } : null,
          service: service ? { name: service.name } : null,
          booking: booking ? {
            date: booking.date,
            time: booking.time
          } : null,
        };
      })
    );

    return reviewsWithDetails;
  },
});
