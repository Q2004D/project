import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  providers: defineTable({
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
    ownerId: v.id("users"),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()), // للتحكم في الظهور من قبل الأدمن
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    totalBookings: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"])
    .index("by_location", ["latitude", "longitude"])
    .index("by_rating", ["rating"])
    .searchIndex("search_providers", {
      searchField: "name",
      filterFields: ["category", "isActive", "isVisible"],
    }),

  services: defineTable({
    providerId: v.id("providers"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    duration: v.number(), // in minutes
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_provider", ["providerId"])
    .searchIndex("search_services", {
      searchField: "name",
      filterFields: ["providerId", "isActive"],
    }),

  bookings: defineTable({
    providerId: v.id("providers"),
    serviceId: v.id("services"),
    userId: v.id("users"),
    date: v.string(),
    time: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    totalPrice: v.number(),
    customPrice: v.optional(v.number()), // السعر المخصص من مقدم الخدمة
    notes: v.optional(v.string()),
    providerNotes: v.optional(v.string()), // ملاحظات مقدم الخدمة
    rejectionReason: v.optional(v.string()), // سبب الرفض
  })
    .index("by_provider", ["providerId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  reviews: defineTable({
    providerId: v.id("providers"),
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.string(),
  })
    .index("by_provider", ["providerId"])
    .index("by_user", ["userId"]),

  promotions: defineTable({
    providerId: v.id("providers"),
    title: v.string(),
    description: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    validFrom: v.string(),
    validUntil: v.string(),
    usageLimit: v.optional(v.number()),
    usedCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  }).index("by_provider", ["providerId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("booking_confirmed"),
      v.literal("booking_rejected"),
      v.literal("booking_reminder"),
      v.literal("promotion"),
      v.literal("system")
    ),
    isRead: v.optional(v.boolean()),
    relatedId: v.optional(v.string()), // ID of related booking, promotion, etc.
  }).index("by_user", ["userId"]),

  loyaltyPrograms: defineTable({
    providerId: v.id("providers"),
    name: v.string(),
    description: v.string(),
    pointsPerVisit: v.number(),
    rewardThreshold: v.number(),
    rewardValue: v.number(),
    isActive: v.optional(v.boolean()),
  }).index("by_provider", ["providerId"]),

  userLoyaltyPoints: defineTable({
    userId: v.id("users"),
    providerId: v.id("providers"),
    points: v.number(),
    totalVisits: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    preferences: v.optional(v.object({
      categories: v.array(v.string()),
      maxDistance: v.number(),
      priceRange: v.object({
        min: v.number(),
        max: v.number(),
      }),
    })),
  }).index("by_user", ["userId"]),

  // جدول الأدمن
  adminUsers: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("moderator")),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // إحصائيات النظام
  systemStats: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalUsers: v.number(),
    totalProviders: v.number(),
    totalBookings: v.number(),
    totalRevenue: v.number(),
    activeUsers: v.number(),
    newSignups: v.number(),
  }).index("by_date", ["date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
