import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ProviderBookingManagementProps {
  providerId: Id<"providers">;
}

export function ProviderBookingManagement({ providerId }: ProviderBookingManagementProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [providerNotes, setProviderNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingBookings = useQuery(api.bookings.getPendingBookings, { providerId });
  const allBookings = useQuery(api.bookings.getProviderBookings, { providerId });
  const updateBookingStatus = useMutation(api.bookings.updateBookingStatus);

  const handleBookingAction = async (
    bookingId: string,
    status: "confirmed" | "rejected",
    booking: any
  ) => {
    try {
      const updateData: any = {
        bookingId: bookingId as any,
        status,
      };

      if (status === "confirmed" && customPrice > 0) {
        updateData.customPrice = customPrice;
      }

      if (providerNotes) {
        updateData.providerNotes = providerNotes;
      }

      if (status === "rejected") {
        updateData.rejectionReason = rejectionReason || "لم يتم تحديد سبب";
      }

      await updateBookingStatus(updateData);
      
      toast.success(
        status === "confirmed" ? "تم تأكيد الحجز بنجاح" : "تم رفض الحجز"
      );
      
      // إعادة تعيين النموذج
      setSelectedBooking(null);
      setCustomPrice(0);
      setProviderNotes("");
      setRejectionReason("");
    } catch (error) {
      toast.error("حدث خطأ في تحديث الحجز");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "في الانتظار";
      case "confirmed":
        return "مؤكد";
      case "rejected":
        return "مرفوض";
      case "completed":
        return "مكتمل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const bookingsToShow = activeTab === "pending" ? pendingBookings : allBookings;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col space-y-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold">إدارة الحجوزات</h2>
          
          <div className="flex space-x-2 space-x-reverse w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              في الانتظار ({pendingBookings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              جميع الحجوزات
            </button>
          </div>
        </div>

        {!bookingsToShow || bookingsToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === "pending" ? "لا توجد حجوزات في الانتظار" : "لا توجد حجوزات"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingsToShow.map((booking) => (
              <div
                key={booking._id}
                className="border border-gray-200 rounded-lg p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {booking.service?.name}
                    </h3>
                    <p className="text-gray-600">
                      العميل: {booking.user?.name || booking.user?.email}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">التاريخ:</span>
                    <p className="font-medium">{booking.date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">الوقت:</span>
                    <p className="font-medium">{booking.time}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">السعر الأصلي:</span>
                    <p className="font-medium">{booking.service?.price} د.أ</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">السعر النهائي:</span>
                    <p className="font-medium text-green-600">
                      {booking.customPrice || booking.totalPrice} د.أ
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">ملاحظات العميل:</span>
                    <p className="text-gray-700">{booking.notes}</p>
                  </div>
                )}

                {booking.providerNotes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">ملاحظاتك:</span>
                    <p className="text-gray-700">{booking.providerNotes}</p>
                  </div>
                )}

                {booking.rejectionReason && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">سبب الرفض:</span>
                    <p className="text-red-600">{booking.rejectionReason}</p>
                  </div>
                )}

                {booking.status === "pending" && (
                  <div className="border-t border-gray-200 pt-4">
                    {selectedBooking === booking._id ? (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">📋 إدارة الحجز</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              💰 السعر المخصص (اختياري)
                            </label>
                            <input
                              type="number"
                              value={customPrice || ""}
                              onChange={(e) => setCustomPrice(Number(e.target.value))}
                              placeholder={`السعر الأصلي: ${booking.service?.price} د.أ`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📝 ملاحظات (اختياري)
                            </label>
                            <input
                              type="text"
                              value={providerNotes}
                              onChange={(e) => setProviderNotes(e.target.value)}
                              placeholder="ملاحظات إضافية..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ❌ سبب الرفض (في حالة الرفض)
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={2}
                            placeholder="اكتب سبب الرفض إذا كنت ستقوم برفض الحجز..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                          <button
                            onClick={() => handleBookingAction(booking._id, "confirmed", booking)}
                            className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
                          >
                            ✅ تأكيد الحجز
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking._id, "rejected", booking)}
                            className="bg-red-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
                          >
                            ❌ رفض الحجز
                          </button>
                          <button
                            onClick={() => setSelectedBooking(null)}
                            className="bg-gray-300 text-gray-700 px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm sm:text-base"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking._id);
                          setCustomPrice(booking.service?.price || 0);
                        }}
                        className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                      >
                        📝 قبول أو رفض
                      </button>
                    )}
                  </div>
                )}

                {booking.status === "confirmed" && (
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => handleBookingAction(booking._id, "completed" as any, booking)}
                      className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      ✅ تم إكمال الخدمة
                    </button>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-4">
                  تم الحجز في: {new Date(booking._creationTime).toLocaleDateString('ar-JO')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
