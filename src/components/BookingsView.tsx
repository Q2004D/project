import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function BookingsView() {
  const bookings = useQuery(api.bookings.getUserBookings);
  const cancelBooking = useMutation(api.bookings.cancelBooking);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking({ bookingId: bookingId as any });
      toast.success("تم إلغاء الحجز بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في إلغاء الحجز");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
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
      case "cancelled":
        return "ملغي";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  if (!bookings) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">حجوزاتي</h2>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">لا توجد حجوزات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {booking.provider?.name}
                    </h3>
                    <p className="text-gray-600">{booking.service?.name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">التاريخ:</span>
                    <p className="font-medium">{booking.date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">الوقت:</span>
                    <p className="font-medium">{booking.time}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">السعر:</span>
                    <p className="font-medium">{booking.totalPrice} د.أ</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">الملاحظات:</span>
                    <p className="text-gray-700">{booking.notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="text-sm text-gray-500">
                    تم الحجز في: {new Date(booking._creationTime).toLocaleDateString('ar-JO')}
                  </div>
                  
                  {booking.status === "pending" && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors w-full sm:w-auto"
                    >
                      إلغاء الحجز
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
