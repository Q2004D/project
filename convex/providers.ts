import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// البحث المحسن عن مقدمي الخدمة
export const searchProviders = query({
  args: {
    searchQuery: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("mens_salon"),
      v.literal("womens_salon"),
      v.literal("beauty_clinic"),
      v.literal("laser_clinic"),
      v.literal("skincare")
    )),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    maxDistance: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("distance"),
      v.literal("rating"),
      v.literal("newest"),
      v.literal("name")
    )),
    minRating: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let providers: any[] = [];
    
    // استخدام البحث النصي المحسن إذا توفر
    if (args.searchQuery && args.searchQuery.trim()) {
      providers = await ctx.db
        .query("providers")
        .withSearchIndex("search_providers", (q) => 
          q.search("name", args.searchQuery!)
           .eq("isActive", true)
           .eq("isVisible", true)
        )
        .collect();
      
      // البحث أيضاً في الوصف والعنوان إذا لم نجد نتائج كافية
      if (providers.length < 5) {
        const allProviders = await ctx.db.query("providers").collect();
        const searchTerm = args.searchQuery.toLowerCase();
        const additionalProviders = allProviders.filter((provider: any) =>
          provider.isActive !== false && 
          provider.isVisible !== false &&
          !providers.some((p: any) => p._id === provider._id) &&
          (provider.description.toLowerCase().includes(searchTerm) ||
           provider.address.toLowerCase().includes(searchTerm))
        );
        providers = [...providers, ...additionalProviders];
      }
    } else {
      // تصفية حسب الفئة أو جلب الكل
      if (args.category) {
        providers = await ctx.db
          .query("providers")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect();
      } else {
        providers = await ctx.db.query("providers").collect();
      }
      
      // تصفية المقدمين النشطين والمرئيين فقط
      providers = providers.filter(provider => 
        provider.isActive !== false && provider.isVisible !== false
      );
    }

    // تصفية حسب التقييم الأدنى
    if (args.minRating) {
      providers = providers.filter(provider => 
        (provider.rating || 0) >= args.minRating!
      );
    }

    // حساب المسافة وتصفية حسب المسافة القصوى
    let providersWithDistance = providers.map(provider => {
      let distance = null;
      if (args.latitude && args.longitude) {
        distance = calculateDistance(
          args.latitude,
          args.longitude,
          provider.latitude,
          provider.longitude
        );
      }
      return { ...provider, distance };
    });

    // تصفية حسب المسافة القصوى
    if (args.maxDistance && args.latitude && args.longitude) {
      providersWithDistance = providersWithDistance.filter(provider => 
        provider.distance !== null && provider.distance <= args.maxDistance!
      );
    }

    // إضافة الخدمات والتصفية حسب السعر الأقصى
    const providersWithServices = await Promise.all(
      providersWithDistance.map(async (provider) => {
        const services = await ctx.db
          .query("services")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();
        
        // تصفية حسب السعر الأقصى
        let filteredServices = services;
        if (args.maxPrice) {
          filteredServices = services.filter(service => service.price <= args.maxPrice!);
        }
        
        return {
          ...provider,
          services: filteredServices,
          minPrice: services.length > 0 ? Math.min(...services.map(s => s.price)) : 0,
          maxPrice: services.length > 0 ? Math.max(...services.map(s => s.price)) : 0,
        };
      })
    );

    // إزالة المقدمين الذين لا يحتوون على خدمات تطابق السعر المطلوب
    let finalProviders = providersWithServices;
    if (args.maxPrice) {
      finalProviders = providersWithServices.filter(provider => 
        provider.services.length > 0
      );
    }

    // ترتيب النتائج
    if (args.sortBy) {
      finalProviders.sort((a, b) => {
        switch (args.sortBy) {
          case "distance":
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "newest":
            return b._creationTime - a._creationTime;
          case "name":
            return a.name.localeCompare(b.name, 'ar');
          default:
            return 0;
        }
      });
    } else if (args.latitude && args.longitude) {
      // ترتيب افتراضي حسب المسافة إذا توفر الموقع
      finalProviders.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return finalProviders;
  },
});

// حساب المسافة بين نقطتين
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// الحصول على مقدمي الخدمة الخاصين بالمستخدم
export const getMyProviders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const providers = await ctx.db
      .query("providers")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // إضافة الخدمات والإحصائيات لكل مقدم
    const providersWithDetails = await Promise.all(
      providers.map(async (provider) => {
        const services = await ctx.db
          .query("services")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .collect();
        
        // حساب إحصائيات الحجوزات
        const allBookings = await ctx.db
          .query("bookings")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .collect();
        
        const pendingBookings = allBookings.filter(b => b.status === "pending");
        const confirmedBookings = allBookings.filter(b => b.status === "confirmed");
        const completedBookings = allBookings.filter(b => b.status === "completed");
        
        return {
          ...provider,
          services,
          stats: {
            totalBookings: allBookings.length,
            pendingBookings: pendingBookings.length,
            confirmedBookings: confirmedBookings.length,
            completedBookings: completedBookings.length,
            totalRevenue: completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
          }
        };
      })
    );

    return providersWithDetails;
  },
});

// إنشاء مقدم خدمة جديد محسن
export const createProvider = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    category: v.union(
      v.literal("mens_salon"),
      v.literal("womens_salon"),
      v.literal("beauty_clinic"),
      v.literal("laser_clinic"),
      v.literal("skincare")
    ),
    workingHours: v.object({
      monday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      tuesday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      wednesday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      thursday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      friday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      saturday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      sunday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
    }),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من عدم وجود مقدم خدمة بنفس الاسم والعنوان
    const existingProvider = await ctx.db
      .query("providers")
      .filter((q) => 
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("address"), args.address)
        )
      )
      .first();

    if (existingProvider) {
      throw new Error("يوجد مقدم خدمة بنفس الاسم والعنوان بالفعل");
    }

    return await ctx.db.insert("providers", {
      ...args,
      ownerId: userId,
      isActive: true,
      isVisible: true,
      rating: 0,
      reviewCount: 0,
      totalBookings: 0,
    });
  },
});

// تحديث مقدم خدمة محسن
export const updateProvider = mutation({
  args: {
    providerId: v.id("providers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    workingHours: v.optional(v.object({
      monday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      tuesday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      wednesday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      thursday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      friday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      saturday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
      sunday: v.object({ open: v.string(), close: v.string(), isOpen: v.boolean() }),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بتحديث هذا المقدم");
    }

    const { providerId, ...updateData } = args;
    await ctx.db.patch(providerId, updateData);
    return providerId;
  },
});

// حذف مقدم خدمة
export const deleteProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بحذف هذا المقدم");
    }

    // التحقق من عدم وجود حجوزات نشطة
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .collect();

    if (activeBookings.length > 0) {
      throw new Error("لا يمكن حذف المقدم لوجود حجوزات نشطة");
    }

    // حذف الخدمات المرتبطة
    const services = await ctx.db
      .query("services")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    for (const service of services) {
      await ctx.db.delete(service._id);
    }

    // حذف التقييمات المرتبطة
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    // حذف العروض الترويجية المرتبطة
    const promotions = await ctx.db
      .query("promotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    for (const promotion of promotions) {
      await ctx.db.delete(promotion._id);
    }

    // حذف المقدم نهائياً
    await ctx.db.delete(args.providerId);
    
    return args.providerId;
  },
});

// الحصول على مقدم خدمة واحد مع تفاصيله المحسنة
export const getProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.isActive === false) {
      return null;
    }

    // الحصول على الخدمات
    const services = await ctx.db
      .query("services")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // الحصول على التقييمات مع تفاصيل المستخدمين
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(20);

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          user: user ? { 
            name: user.name || "مستخدم", 
            email: user.email?.substring(0, 3) + "***" // إخفاء جزء من البريد للخصوصية
          } : null,
        };
      })
    );

    // حساب إحصائيات الحجوزات
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    const completedBookings = allBookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // الحصول على العروض النشطة
    const activePromotions = await ctx.db
      .query("promotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...provider,
      services,
      reviews: reviewsWithUsers,
      stats: {
        totalBookings: allBookings.length,
        completedBookings: completedBookings.length,
        totalRevenue,
        averageRating: provider.rating || 0,
        reviewCount: provider.reviewCount || 0,
      },
      promotions: activePromotions,
    };
  },
});

// الحصول على أفضل مقدمي الخدمة
export const getTopProviders = query({
  args: {
    category: v.optional(v.union(
      v.literal("mens_salon"),
      v.literal("womens_salon"),
      v.literal("beauty_clinic"),
      v.literal("laser_clinic"),
      v.literal("skincare")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    let providers;
    if (args.category) {
      providers = await ctx.db
        .query("providers")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      providers = await ctx.db.query("providers").collect();
    }

    // تصفية المقدمين النشطين والمرئيين فقط
    providers = providers.filter(provider => 
      provider.isActive !== false && 
      provider.isVisible !== false &&
      (provider.rating || 0) > 0
    );

    // ترتيب حسب التقييم والعدد الكلي للحجوزات
    providers.sort((a, b) => {
      const aScore = (a.rating || 0) * Math.log(1 + (a.totalBookings || 0));
      const bScore = (b.rating || 0) * Math.log(1 + (b.totalBookings || 0));
      return bScore - aScore;
    });

    // أخذ أفضل المقدمين
    const topProviders = providers.slice(0, limit);

    // إضافة الخدمات
    const providersWithServices = await Promise.all(
      topProviders.map(async (provider) => {
        const services = await ctx.db
          .query("services")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(3); // أول 3 خدمات فقط للعرض
        
        return {
          ...provider,
          services,
        };
      })
    );

    return providersWithServices;
  },
});

// البحث في الخدمات
export const searchServices = query({
  args: {
    searchQuery: v.string(),
    providerId: v.optional(v.id("providers")),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let services;
    
    if (args.providerId) {
      services = await ctx.db
        .query("services")
        .withSearchIndex("search_services", (q) => 
          q.search("name", args.searchQuery)
           .eq("providerId", args.providerId!)
           .eq("isActive", true)
        )
        .collect();
    } else {
      services = await ctx.db
        .query("services")
        .withSearchIndex("search_services", (q) => 
          q.search("name", args.searchQuery)
           .eq("isActive", true)
        )
        .collect();
    }

    // تصفية حسب السعر الأقصى
    if (args.maxPrice) {
      services = services.filter(service => service.price <= args.maxPrice!);
    }

    // إضافة تفاصيل مقدم الخدمة
    const servicesWithProviders = await Promise.all(
      services.map(async (service) => {
        const provider = await ctx.db.get(service.providerId);
        return {
          ...service,
          provider,
        };
      })
    );

    return servicesWithProviders;
  },
});

// تحديث إحصائيات مقدم الخدمة
export const updateProviderStats = mutation({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("مقدم الخدمة غير موجود");
    }

    // حساب التقييم المتوسط
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // حساب العدد الكلي للحجوزات
    const totalBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    await ctx.db.patch(args.providerId, {
      rating: averageRating,
      reviewCount: reviews.length,
      totalBookings: totalBookings.length,
    });

    return args.providerId;
  },
});
