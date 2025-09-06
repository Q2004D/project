import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface EnhancedProviderDetailsProps {
  provider: any;
  onBack: () => void;
}

export function EnhancedProviderDetails({ provider, onBack }: EnhancedProviderDetailsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "services" | "reviews" | "gallery">("info");
  const [selectedService, setSelectedService] = useState<Id<"services"> | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const createBooking = useMutation(api.bookings.createBooking);
  
  // Static time slots - will be enhanced with dynamic slots later
  const staticTimeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error("يرجى اختيار الخدمة والتاريخ والوقت");
      return;
    }

    try {
      await createBooking({
        providerId: provider._id,
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime,
        notes: notes || undefined,
      });
      
      toast.success("تم إنشاء الحجز بنجاح!");
      onBack();
    } catch (error) {
      toast.error("حدث خطأ في إنشاء الحجز");
    }
  };

  const selectedServiceDetails = provider.services?.find((s: any) => s._id === selectedService);

  const tabs = [
    { key: "info", label: "المعلومات", icon: "ℹ️" },
    { key: "services", label: "الخدمات", icon: "🛠️" },
    { key: "reviews", label: "التقييمات", icon: "⭐" },
    { key: "gallery", label: "المعرض", icon: "🖼️" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
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
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <InfoTab provider={provider} />
      )}
      
      {activeTab === "services" && (
        <ServicesTab 
          provider={provider}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          notes={notes}
          setNotes={setNotes}
          staticTimeSlots={staticTimeSlots}
          selectedServiceDetails={selectedServiceDetails}
          handleBooking={handleBooking}
        />
      )}
      
      {activeTab === "reviews" && (
        <ReviewsTab provider={provider} />
      )}
      
      {activeTab === "gallery" && (
        <GalleryTab provider={provider} />
      )}
    </div>
  );
}

function InfoTab({ provider }: { provider: any }) {
  const categories = {
    mens_salon: "صالون رجالي",
    womens_salon: "صالون نسائي", 
    beauty_clinic: "عيادة تجميل",
    laser_clinic: "عيادة ليزر",
    skincare: "العناية بالبشرة",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}

function ServicesTab({ 
  provider, 
  selectedService, 
  setSelectedService, 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime, 
  notes, 
  setNotes, 
  staticTimeSlots, 
  selectedServiceDetails, 
  handleBooking 
}: {
  provider: any;
  selectedService: Id<"services"> | null;
  setSelectedService: (id: Id<"services"> | null) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  staticTimeSlots: string[];
  selectedServiceDetails: any;
  handleBooking: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">الخدمات المتاحة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {provider.services?.map((service: any) => (
            <div
              key={service._id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedService === service._id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() => setSelectedService(service._id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                <span className="text-blue-600 font-bold text-lg">{service.price} د.أ</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{service.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="ml-1">⏱️</span>
                <span>{service.duration} دقيقة</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form */}
      {selectedService && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">حجز موعد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوقت</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر الوقت</option>
                {staticTimeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أي ملاحظات خاصة..."
            />
          </div>

          {selectedServiceDetails && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">ملخص الحجز</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>الخدمة:</span>
                  <span>{selectedServiceDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>المدة:</span>
                  <span>{selectedServiceDetails.duration} دقيقة</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>السعر:</span>
                  <span>{selectedServiceDetails.price} د.أ</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleBooking}
            disabled={!selectedService || !selectedDate || !selectedTime}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            تأكيد الحجز
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewsTab({ provider }: { provider: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">التقييمات والمراجعات</h3>
      
      {provider.reviews && provider.reviews.length > 0 ? (
        <div className="space-y-4">
          {provider.reviews.map((review: any) => (
            <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">
                      {review.user?.name?.charAt(0) || 'م'}
                    </span>
                  </div>
                  <span className="font-medium">{review.user?.name || 'مستخدم'}</span>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                    >
                      ★
                    </span>
                  ))}
                  <span className="mr-2 text-sm text-gray-500">
                    {new Date(review._creationTime).toLocaleDateString('ar-JO')}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-gray-500">لا توجد تقييمات بعد</p>
          <p className="text-sm text-gray-400 mt-2">كن أول من يقيم هذا المقدم</p>
        </div>
      )}
    </div>
  );
}

function GalleryTab({ provider }: { provider: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">معرض الصور</h3>
      
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🖼️</span>
        </div>
        <p className="text-gray-500 mb-2">لا توجد صور متاحة حالياً</p>
        <p className="text-sm text-gray-400">سيتم إضافة معرض الصور قريباً</p>
      </div>
    </div>
  );
}
