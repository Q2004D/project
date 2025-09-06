import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// التحقق من صلاحيات الأدمن
async function checkAdminPermission(ctx: any, requiredRole: "super_admin" | "admin" | "moderator" = "admin") {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("يجب تسجيل الدخول أولاً");
  }

  const adminUser = await ctx.db
    .query("adminUsers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!adminUser || !adminUser.isActive) {
    throw new Error("غير مصرح لك بالوصول لهذه الصفحة");
  }

  const roleHierarchy = {
    "moderator": 1,
    "admin": 2,
    "super_admin": 3
  };

  if (roleHierarchy[adminUser.role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
    throw new Error("ليس لديك صلاحية كافية لهذا الإجراء");
  }

  return adminUser;
}

// إضافة مستخدم أدمن جديد
export const addAdminUser = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("moderator")),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx, "super_admin");

    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingAdmin) {
      throw new Error("هذا المستخدم أدمن بالفعل");
    }

    return await ctx.db.insert("adminUsers", {
      userId: args.userId,
      role: args.role,
      permissions: args.permissions,
      isActive: true,
    });
  },
});

// الحصول على إحصائيات النظام
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    await checkAdminPermission(ctx);

    const today = new Date().toISOString().split('T')[0];
    
    // إحصائيات عامة
    const totalUsers = await ctx.db.query("users").collect().then(users => users.length);
    const totalProviders = await ctx.db.query("providers").collect().then(providers => providers.length);
    const totalBookings = await ctx.db.query("bookings").collect().then(bookings => bookings.length);
    
    // إحصائيات اليوم
    const todayBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    // إحصائيات الحجوزات حسب الحالة
    const allBookings = await ctx.db.query("bookings").collect();
    const bookingsByStatus = allBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // إحصائيات الإيرادات
    const completedBookings = allBookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // مقدمي الخدمة الأكثر نشاطاً
    const providerBookingCounts = allBookings.reduce((acc, booking) => {
      acc[booking.providerId] = (acc[booking.providerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProviders = await Promise.all(
      Object.entries(providerBookingCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(async ([providerId, count]) => {
          const provider = await ctx.db.get(providerId as any);
          return { provider, bookingCount: count };
        })
    );

    // المستخدمين الجدد (آخر 30 يوم)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentUsers = await ctx.db
      .query("users")
      .filter((q) => q.gt(q.field("_creationTime"), thirtyDaysAgo))
      .collect();

    return {
      overview: {
        totalUsers,
        totalProviders,
        totalBookings,
        totalRevenue,
        todayBookings: todayBookings.length,
        newUsersThisMonth: recentUsers.length,
      },
      bookingsByStatus,
      topProviders,
      recentActivity: {
        recentBookings: allBookings.slice(-10).reverse(),
        recentUsers: recentUsers.slice(-10).reverse(),
      }
    };
  },
});

// الحصول على جميع المستخدمين
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx);

    let query = ctx.db.query("users").order("desc");
    
    if (args.offset) {
      // Note: Convex doesn't have built-in offset, so we'll use a simple approach
      const allUsers = await query.collect();
      const startIndex = args.offset;
      const endIndex = args.limit ? startIndex + args.limit : undefined;
      return allUsers.slice(startIndex, endIndex);
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// الحصول على جميع مقدمي الخدمة
export const getAllProviders = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx);

    let query = ctx.db.query("providers").order("desc");
    
    if (args.limit) {
      const providers = await query.take(args.limit);
      // إضافة معلومات المالك
      return await Promise.all(
        providers.map(async (provider) => {
          const owner = await ctx.db.get(provider.ownerId);
          return { ...provider, owner };
        })
      );
    }

    const providers = await query.collect();
    return await Promise.all(
      providers.map(async (provider) => {
        const owner = await ctx.db.get(provider.ownerId);
        return { ...provider, owner };
      })
    );
  },
});

// تعطيل/تفعيل مقدم خدمة
export const toggleProviderStatus = mutation({
  args: {
    providerId: v.id("providers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx);

    await ctx.db.patch(args.providerId, {
      isActive: args.isActive,
    });

    // إرسال إشعار لمالك مقدم الخدمة
    const provider = await ctx.db.get(args.providerId);
    if (provider) {
      await ctx.db.insert("notifications", {
        userId: provider.ownerId,
        title: args.isActive ? "تم تفعيل حسابك" : "تم تعطيل حسابك",
        message: args.isActive 
          ? "تم تفعيل حساب مقدم الخدمة الخاص بك"
          : "تم تعطيل حساب مقدم الخدمة الخاص بك مؤقتاً",
        type: "system",
        isRead: false,
      });
    }

    return args.providerId;
  },
});

// إظهار/إخفاء مقدم خدمة من الواجهة العامة
export const toggleProviderVisibility = mutation({
  args: {
    providerId: v.id("providers"),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx);

    await ctx.db.patch(args.providerId, {
      isVisible: args.isVisible,
    });

    const provider = await ctx.db.get(args.providerId);
    if (provider) {
      await ctx.db.insert("notifications", {
        userId: provider.ownerId,
        title: args.isVisible ? "تم إظهار حسابك" : "تم إخفاء حسابك",
        message: args.isVisible 
          ? "أصبح حسابك مرئياً للعملاء في التطبيق"
          : "تم إخفاء حسابك مؤقتاً من الواجهة العامة",
        type: "system",
        isRead: false,
      });
    }

    return args.providerId;
  },
});

// الحصول على جميع الحجوزات
export const getAllBookings = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx);

    let query = ctx.db.query("bookings").order("desc");

    if (args.status) {
      query = ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc");
    }

    const bookings = args.limit 
      ? await query.take(args.limit)
      : await query.collect();

    // إضافة تفاصيل المستخدم ومقدم الخدمة والخدمة
    return await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        const provider = await ctx.db.get(booking.providerId);
        const service = await ctx.db.get(booking.serviceId);
        return {
          ...booking,
          user,
          provider,
          service,
        };
      })
    );
  },
});

// حفظ إحصائيات يومية
export const saveSystemStats = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    // التحقق من وجود إحصائيات لهذا اليوم
    const existingStats = await ctx.db
      .query("systemStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existingStats) {
      return; // الإحصائيات موجودة بالفعل
    }

    const totalUsers = await ctx.db.query("users").collect().then(users => users.length);
    const totalProviders = await ctx.db.query("providers").collect().then(providers => providers.length);
    const totalBookings = await ctx.db.query("bookings").collect().then(bookings => bookings.length);
    
    const completedBookings = await ctx.db
      .query("bookings")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // المستخدمين النشطين (الذين لديهم حجوزات في آخر 30 يوم)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentBookings = await ctx.db
      .query("bookings")
      .filter((q) => q.gt(q.field("_creationTime"), thirtyDaysAgo))
      .collect();
    
    const activeUsers = new Set(recentBookings.map(b => b.userId)).size;

    // المستخدمين الجدد اليوم
    const todayStart = new Date(today).getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);
    const newSignups = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), todayStart),
          q.lt(q.field("_creationTime"), todayEnd)
        )
      )
      .collect()
      .then(users => users.length);

    await ctx.db.insert("systemStats", {
      date: today,
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue,
      activeUsers,
      newSignups,
    });
  },
});

// حذف مقدم خدمة
export const deleteProvider = mutation({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx, "admin");

    // حذف جميع الخدمات المرتبطة
    const services = await ctx.db
      .query("services")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    for (const service of services) {
      await ctx.db.delete(service._id);
    }

    // حذف جميع الحجوزات المرتبطة
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    for (const booking of bookings) {
      await ctx.db.delete(booking._id);
    }

    // حذف مقدم الخدمة
    await ctx.db.delete(args.providerId);
    return args.providerId;
  },
});

// حذف جميع مقدمي الخدمة
export const deleteAllProviders = mutation({
  args: {},
  handler: async (ctx) => {
    await checkAdminPermission(ctx, "super_admin");

    // حذف جميع الخدمات
    const services = await ctx.db.query("services").collect();
    for (const service of services) {
      await ctx.db.delete(service._id);
    }

    // حذف جميع الحجوزات
    const bookings = await ctx.db.query("bookings").collect();
    for (const booking of bookings) {
      await ctx.db.delete(booking._id);
    }

    // حذف جميع مقدمي الخدمة
    const providers = await ctx.db.query("providers").collect();
    for (const provider of providers) {
      await ctx.db.delete(provider._id);
    }

    return { deletedCount: providers.length };
  },
});

// التحقق من صلاحيات المستخدم الحالي
export const checkCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return adminUser && adminUser.isActive ? adminUser : null;
  },
});

// حذف جميع البيانات من النظام
export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    await checkAdminPermission(ctx, "super_admin");

    let totalDeleted = 0;
    const details: Record<string, number> = {};

    // قائمة الجداول للحذف بالترتيب الصحيح
    const tablesToDelete = [
      "reviews", "promotions", "bookings", "services", 
      "providers", "notifications", "systemStats", 
      "loyaltyPoints", "userProfiles"
    ];

    for (const tableName of tablesToDelete) {
      const docs = await ctx.db.query(tableName as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      details[tableName] = docs.length;
      totalDeleted += docs.length;
    }

    return { 
      message: "تم حذف جميع البيانات بنجاح", 
      deletedCount: totalDeleted,
      details
    };
  },
});
