import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createBooking = mutation({
  args: {
    providerId: v.id("providers"),
    serviceId: v.id("services"),
    date: v.string(),
    time: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // التحقق من وجود الخدمة والحصول على السعر
    const service = await ctx.db.get(args.serviceId);
    if (!service) {
      throw new Error("الخدمة غير موجودة");
    }

    // التحقق من وجود مقدم الخدمة
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("مقدم الخدمة غير موجود");
    }

    // التحقق من تعارض الأوقات
    const conflictingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("date"), args.date),
          q.eq(q.field("time"), args.time),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed")
          )
        )
      )
      .collect();

    if (conflictingBookings.length > 0) {
      throw new Error("هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر");
    }

    // إنشاء الحجز بحالة "في الانتظار"
    const bookingId = await ctx.db.insert("bookings", {
      providerId: args.providerId,
      serviceId: args.serviceId,
      userId,
      date: args.date,
      time: args.time,
      status: "pending",
      totalPrice: service.price,
      notes: args.notes,
    });

    // إرسال إشعار لمقدم الخدمة
    await ctx.db.insert("notifications", {
      userId: provider.ownerId,
      title: "حجز جديد",
      message: `لديك حجز جديد في ${args.date} الساعة ${args.time}`,
      type: "booking_confirmed",
      isRead: false,
      relatedId: bookingId,
    });

    return bookingId;
  },
});

export const getUserBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // إضافة تفاصيل مقدم الخدمة والخدمة
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const provider = await ctx.db.get(booking.providerId);
        const service = await ctx.db.get(booking.serviceId);
        return {
          ...booking,
          provider,
          service,
        };
      })
    );

    return bookingsWithDetails;
  },
});

export const getProviderBookings = query({
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

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();

    // إضافة تفاصيل المستخدم والخدمة
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        const service = await ctx.db.get(booking.serviceId);
        return {
          ...booking,
          user,
          service,
        };
      })
    );

    return bookingsWithDetails;
  },
});

export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    customPrice: v.optional(v.number()),
    providerNotes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }

    // التحقق من أن المستخدم يملك مقدم الخدمة
    const provider = await ctx.db.get(booking.providerId);
    if (!provider || provider.ownerId !== userId) {
      throw new Error("غير مصرح لك بتحديث هذا الحجز");
    }

    // تحديث الحجز
    const updateData: any = {
      status: args.status,
    };

    if (args.customPrice !== undefined) {
      updateData.customPrice = args.customPrice;
      updateData.totalPrice = args.customPrice;
    }

    if (args.providerNotes) {
      updateData.providerNotes = args.providerNotes;
    }

    if (args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason;
    }

    await ctx.db.patch(args.bookingId, updateData);

    // إرسال إشعار للعميل
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType: "booking_confirmed" | "booking_rejected" = "booking_confirmed";

    switch (args.status) {
      case "confirmed":
        notificationTitle = "تم تأكيد حجزك";
        notificationMessage = `تم تأكيد حجزك في ${booking.date} الساعة ${booking.time}`;
        if (args.customPrice) {
          notificationMessage += ` بسعر ${args.customPrice} د.أ`;
        }
        break;
      case "rejected":
        notificationTitle = "تم رفض حجزك";
        notificationMessage = `تم رفض حجزك في ${booking.date} الساعة ${booking.time}`;
        if (args.rejectionReason) {
          notificationMessage += `. السبب: ${args.rejectionReason}`;
        }
        notificationType = "booking_rejected";
        break;
      case "completed":
        notificationTitle = "تم إكمال الخدمة";
        notificationMessage = "تم إكمال خدمتك بنجاح. يمكنك الآن تقييم التجربة";
        break;
    }

    if (notificationTitle) {
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        isRead: false,
        relatedId: args.bookingId,
      });
    }

    return args.bookingId;
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }

    // التحقق من أن المستخدم يملك الحجز
    if (booking.userId !== userId) {
      throw new Error("غير مصرح لك بإلغاء هذا الحجز");
    }

    // يمكن إلغاء الحجز فقط إذا كان في حالة "في الانتظار"
    if (booking.status !== "pending") {
      throw new Error("لا يمكن إلغاء هذا الحجز");
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled" });

    // إرسال إشعار لمقدم الخدمة
    const provider = await ctx.db.get(booking.providerId);
    if (provider) {
      await ctx.db.insert("notifications", {
        userId: provider.ownerId,
        title: "تم إلغاء حجز",
        message: `تم إلغاء الحجز المقرر في ${booking.date} الساعة ${booking.time}`,
        type: "system",
        isRead: false,
        relatedId: args.bookingId,
      });
    }

    return args.bookingId;
  },
});

export const getPendingBookings = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // التحقق من أن المستخدم يملك هذا المقدم
    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.ownerId !== userId) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();

    // إضافة تفاصيل المستخدم والخدمة
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        const service = await ctx.db.get(booking.serviceId);
        return {
          ...booking,
          user,
          service,
        };
      })
    );

    return bookingsWithDetails;
  },
});
