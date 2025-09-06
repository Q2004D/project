import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ProviderServicePageProps {
  providerId: Id<"providers">;
  onBack: () => void;
}

export function ProviderServicePage({ providerId, onBack }: ProviderServicePageProps) {
  const [activeTab, setActiveTab] = useState<"info" | "services" | "bookings" | "settings">("info");
  
  const provider = useQuery(api.providers.getProvider, { providerId });
  const services = useQuery(api.services.getServicesByProvider, { providerId });
  const bookings = useQuery(api.bookings.getProviderBookings, { providerId });
  const pendingBookings = useQuery(api.bookings.getPendingBookings, { providerId });

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "info", label: "المعلومات", icon: "ℹ️" },
    { key: "services", label: "الخدمات", icon: "🛠️" },
    { key: "bookings", label: "الحجوزات", icon: "📅" },
    { key: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2 space-x-reverse"
              >
                <span>←</span>
                <span>العودة</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="text-lg font-medium text-gray-700 mr-2">
                    {provider.rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-gray-500 mr-2">
                    ({provider.reviewCount || 0} تقييم)
                  </span>
                  {pendingBookings && pendingBookings.length > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mr-4">
                      {pendingBookings.length} حجز في الانتظار
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-gray-600 mb-2">
                <span className="ml-2">📍</span>
                <span>{provider.address}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="ml-2">📞</span>
                <span>{provider.phone}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === "bookings" && pendingBookings && pendingBookings.length > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {pendingBookings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "info" && (
          <ProviderInfoTab provider={provider} />
        )}
        
        {activeTab === "services" && (
          <ProviderServicesTab providerId={providerId} services={services} />
        )}
        
        {activeTab === "bookings" && (
          <ProviderBookingsTab 
            providerId={providerId} 
            bookings={bookings} 
            pendingBookings={pendingBookings}
          />
        )}
        
        {activeTab === "settings" && (
          <ProviderSettingsTab provider={provider} />
        )}
      </div>
    </div>
  );
}

function ProviderInfoTab({ provider }: { provider: any }) {
  const categories = {
    mens_salon: "صالون رجالي",
    womens_salon: "صالون نسائي", 
    beauty_clinic: "عيادة تجميل",
    laser_clinic: "عيادة ليزر",
    skincare: "العناية بالبشرة",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">معلومات أساسية</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">الوصف</label>
            <p className="text-gray-900 mt-1">{provider.description}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">الفئة</label>
            <p className="text-gray-900 mt-1">
              {categories[provider.category as keyof typeof categories] || provider.category}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
            <p className="text-gray-900 mt-1">{provider.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">الحالة</label>
            <div className="flex items-center space-x-4 space-x-reverse mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                provider.isActive !== false 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {provider.isActive !== false ? 'نشط' : 'معطل'}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                provider.isVisible !== false 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {provider.isVisible !== false ? 'ظاهر' : 'مخفي'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">ساعات العمل</h3>
        <div className="space-y-3">
          {provider.workingHours && Object.entries(provider.workingHours).map(([day, hours]: [string, any]) => {
            const dayNames = {
              monday: "الاثنين",
              tuesday: "الثلاثاء", 
              wednesday: "الأربعاء",
              thursday: "الخميس",
              friday: "الجمعة",
              saturday: "السبت",
              sunday: "الأحد",
            };
            
            return (
              <div key={day} className="flex justify-between items-center">
                <span className="font-medium">
                  {dayNames[day as keyof typeof dayNames]}
                </span>
                <span className={hours.isOpen ? "text-green-600" : "text-red-600"}>
                  {hours.isOpen ? `${hours.open} - ${hours.close}` : "مغلق"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">الإحصائيات</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{provider.reviewCount || 0}</div>
            <div className="text-sm text-gray-600">تقييم</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{provider.rating?.toFixed(1) || '0.0'}</div>
            <div className="text-sm text-gray-600">متوسط التقييم</div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">الموقع</h3>
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <span className="ml-2">📍</span>
            <span>{provider.address}</span>
          </div>
          {provider.latitude && provider.longitude && (
            <div className="text-sm text-gray-500">
              الإحداثيات: {provider.latitude.toFixed(4)}, {provider.longitude.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderServicesTab({ providerId, services }: { providerId: Id<"providers">; services: any[] | undefined }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">إدارة الخدمات</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + إضافة خدمة جديدة
          </button>
        </div>
      </div>

      {/* Add/Edit Service Form */}
      {(showAddForm || editingService) && (
        <AddEditServiceForm
          providerId={providerId}
          service={editingService}
          onClose={() => {
            setShowAddForm(false);
            setEditingService(null);
          }}
        />
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <div key={service._id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-gray-900">{service.name}</h4>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setEditingService(service)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  تعديل
                </button>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  (service.isActive ?? false)
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(service.isActive ?? false) ? 'نشط' : 'معطل'}
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">السعر:</span>
                <span className="font-medium text-blue-600">{service.price} د.أ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">المدة:</span>
                <span className="font-medium">{service.duration} دقيقة</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🛠️</span>
          </div>
          <p className="text-gray-500 mb-4">لا توجد خدمات مضافة بعد</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            إضافة أول خدمة
          </button>
        </div>
      )}
    </div>
  );
}

function AddEditServiceForm({ providerId, service, onClose }: {
  providerId: Id<"providers">;
  service?: any;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    duration: service?.duration || 30,
    isActive: service?.isActive ?? true,
  });

  const createService = useMutation(api.services.createService);
  const updateService = useMutation(api.services.updateService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (service) {
        await updateService({
          serviceId: service._id,
          ...formData,
        });
        toast.success("تم تحديث الخدمة بنجاح");
      } else {
        await createService({
          providerId,
          ...formData,
        });
        toast.success("تم إضافة الخدمة بنجاح");
      }
      onClose();
    } catch (error) {
      toast.error("حدث خطأ في حفظ الخدمة");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">
          {service ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم الخدمة
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              السعر (د.أ)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الوصف
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدة (دقيقة)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="15"
              step="15"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4 space-x-reverse pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {service ? "تحديث" : "إضافة"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProviderBookingsTab({ 
  providerId, 
  bookings, 
  pendingBookings 
}: { 
  providerId: Id<"providers">; 
  bookings: any[] | undefined; 
  pendingBookings: any[] | undefined;
}) {
  const [activeBookingTab, setActiveBookingTab] = useState<"pending" | "all">("pending");
  
  const updateBookingStatus = useMutation(api.bookings.updateBookingStatus);

  const handleBookingAction = async (bookingId: Id<"bookings">, status: string, customPrice?: number, notes?: string) => {
    try {
      await updateBookingStatus({
        bookingId,
        status: status as any,
        customPrice,
        providerNotes: notes,
      });
      toast.success(`تم ${status === 'confirmed' ? 'تأكيد' : status === 'rejected' ? 'رفض' : 'تحديث'} الحجز بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في تحديث الحجز");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "في الانتظار";
      case "confirmed": return "مؤكد";
      case "rejected": return "مرفوض";
      case "completed": return "مكتمل";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 space-x-reverse px-6">
            <button
              onClick={() => setActiveBookingTab("pending")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
                activeBookingTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>⏳</span>
              <span>في الانتظار</span>
              {pendingBookings && pendingBookings.length > 0 && (
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {pendingBookings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveBookingTab("all")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
                activeBookingTab === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>📅</span>
              <span>جميع الحجوزات</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeBookingTab === "pending" && (
            <div className="space-y-4">
              {pendingBookings && pendingBookings.length > 0 ? (
                pendingBookings.map((booking) => (
                  <PendingBookingCard
                    key={booking._id}
                    booking={booking}
                    onAction={handleBookingAction}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <p className="text-gray-500">لا توجد حجوزات في الانتظار</p>
                </div>
              )}
            </div>
          )}

          {activeBookingTab === "all" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الخدمة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ والوقت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings?.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.user?.name || booking.user?.email || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.service?.name || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.date} - {booking.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.totalPrice} د.أ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingBookingCard({ booking, onAction }: {
  booking: any;
  onAction: (bookingId: Id<"bookings">, status: string, customPrice?: number, notes?: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [customPrice, setCustomPrice] = useState(booking.totalPrice);
  const [notes, setNotes] = useState("");

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-4 space-x-reverse mb-2">
            <h4 className="font-medium text-gray-900">
              {booking.user?.name || booking.user?.email || 'عميل'}
            </h4>
            <span className="text-sm text-gray-500">
              {booking.service?.name}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>📅 {booking.date} - {booking.time}</div>
            <div>💰 {booking.totalPrice} د.أ</div>
            <div>⏱️ {booking.service?.duration} دقيقة</div>
            {booking.notes && (
              <div>📝 {booking.notes}</div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetails ? 'إخفاء' : 'تفاصيل'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر المخصص (اختياري)
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ملاحظات للعميل..."
              />
            </div>
          </div>

          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={() => onAction(booking._id, "confirmed", customPrice !== booking.totalPrice ? customPrice : undefined, notes || undefined)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              تأكيد الحجز
            </button>
            <button
              onClick={() => onAction(booking._id, "rejected", undefined, notes || undefined)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              رفض الحجز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderSettingsTab({ provider }: { provider: any }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: provider.name,
    description: provider.description,
    address: provider.address,
    phone: provider.phone,
    email: provider.email,
  });

  const updateProvider = useMutation(api.providers.updateProvider);

  const handleSave = async () => {
    try {
      await updateProvider({
        providerId: provider._id,
        ...formData,
      });
      toast.success("تم تحديث المعلومات بنجاح");
      setEditMode(false);
    } catch (error) {
      toast.error("حدث خطأ في تحديث المعلومات");
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editMode ? 'حفظ' : 'تعديل'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المقدم
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الوصف
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={!editMode}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        {editMode && (
          <div className="flex justify-end space-x-4 space-x-reverse mt-6">
            <button
              onClick={() => {
                setEditMode(false);
                setFormData({
                  name: provider.name,
                  description: provider.description,
                  address: provider.address,
                  phone: provider.phone,
                  email: provider.email,
                });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              حفظ التغييرات
            </button>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">حالة الحساب</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">حالة النشاط</h4>
              <p className="text-sm text-gray-600">تحكم في ظهور مقدم الخدمة للعملاء</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              provider.isActive !== false 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {provider.isActive !== false ? 'نشط' : 'معطل'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">الظهور في البحث</h4>
              <p className="text-sm text-gray-600">تحكم في ظهور مقدم الخدمة في نتائج البحث</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              provider.isVisible !== false 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {provider.isVisible !== false ? 'ظاهر' : 'مخفي'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
