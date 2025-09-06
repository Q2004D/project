import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// الحصول على إحصائيات مقدم الخدمة
export const getProviderAnalytics = query({
  args: {
    providerId: v.id("providers"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من أن المستخدم يملك هذا المقدم
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بالوصول لهذه البيانات");
    }

    // الحصول على الحجوزات
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    // تصفية البيانات حسب التاريخ إذا تم تحديده
    let filteredBookings = bookings;
    if (args.startDate || args.endDate) {
      filteredBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        const start = args.startDate ? new Date(args.startDate) : new Date(0);
        const end = args.endDate ? new Date(args.endDate) : new Date();
        return bookingDate >= start && bookingDate <= end;
      });
    }

    // حساب الإحصائيات
    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    // حساب التقييمات
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // توزيع الحالات
    const statusDistribution = filteredBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalDays: new Set(filteredBookings.map(b => b.date)).size,
      },
      statusDistribution,
      bookings: filteredBookings.slice(-20).reverse(), // آخر 20 حجز
    };
  },
});

// الحصول على ملخص لوحة التحكم
export const getDashboardSummary = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من أن المستخدم يملك هذا المقدم
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بالوصول لهذه البيانات");
    }

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // حجوزات اليوم
    const todayBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("date"), today))
      .collect();

    // الحجوزات المعلقة
    const pendingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // إيرادات الشهر
    const monthlyBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), thisMonth + "-01"),
          q.lt(q.field("date"), thisMonth + "-32"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // الحجوزات القادمة
    const upcomingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), today),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .order("asc")
      .take(5);

    // آخر التقييمات
    const recentReviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(5);

    return {
      todayBookings: todayBookings.length,
      pendingBookings: pendingBookings.length,
      monthlyRevenue,
      averageRating: provider.rating || 0,
      upcomingBookings,
      recentReviews,
    };
  },
});
