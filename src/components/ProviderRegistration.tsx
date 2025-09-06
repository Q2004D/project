import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ProviderRegistrationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProviderRegistration({ onSuccess, onCancel }: ProviderRegistrationProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    category: "mens_salon" as const,
    workingHours: {
      monday: { open: "09:00", close: "21:00", isOpen: true },
      tuesday: { open: "09:00", close: "21:00", isOpen: true },
      wednesday: { open: "09:00", close: "21:00", isOpen: true },
      thursday: { open: "09:00", close: "21:00", isOpen: true },
      friday: { open: "09:00", close: "21:00", isOpen: true },
      saturday: { open: "09:00", close: "21:00", isOpen: true },
      sunday: { open: "09:00", close: "21:00", isOpen: false },
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const createProvider = useMutation(api.providers.createProvider);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }));
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          setIsGettingLocation(false);
          toast.success("تم تحديد موقعك بنجاح!");
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
          toast.error("لا يمكن الوصول إلى موقعك. يرجى إدخال الإحداثيات يدوياً.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error("المتصفح لا يدعم تحديد الموقع");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // التحقق من صحة البيانات
      if (!formData.name || !formData.address || !formData.phone) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      // تحويل الإحداثيات إلى أرقام (default to Amman, Jordan)
      const latitude = parseFloat(formData.latitude) || 31.9539;
      const longitude = parseFloat(formData.longitude) || 35.9106;

      await createProvider({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        latitude,
        longitude,
        category: formData.category,
        workingHours: formData.workingHours,
      });

      toast.success("تم تسجيل مقدم الخدمة بنجاح!");
      onSuccess();
    } catch (error) {
      console.error("Error creating provider:", error);
      toast.error("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "mens_salon", label: "صالون رجالي" },
    { value: "womens_salon", label: "صالون نسائي" },
    { value: "beauty_clinic", label: "عيادة تجميل" },
    { value: "laser_clinic", label: "عيادة ليزر" },
    { value: "skincare", label: "مركز العناية بالبشرة" },
  ];

  const days = [
    { key: "monday", label: "الاثنين" },
    { key: "tuesday", label: "الثلاثاء" },
    { key: "wednesday", label: "الأربعاء" },
    { key: "thursday", label: "الخميس" },
    { key: "friday", label: "الجمعة" },
    { key: "saturday", label: "السبت" },
    { key: "sunday", label: "الأحد" },
  ];

  const jordanianCities = [
    "عمان - الدوار الأول",
    "عمان - الدوار الثاني", 
    "عمان - الدوار الثالث",
    "عمان - الدوار الرابع",
    "عمان - الدوار الخامس",
    "عمان - الدوار السادس",
    "عمان - الدوار السابع",
    "عمان - الدوار الثامن",
    "عمان - جبل الحسين",
    "عمان - جبل اللويبدة",
    "عمان - جبل عمان",
    "عمان - الصويفية",
    "عمان - العبدلي",
    "عمان - الشميساني",
    "إربد",
    "الزرقاء", 
    "العقبة",
    "السلط",
    "مادبا",
    "الكرك",
    "معان",
    "الطفيلة",
    "جرش",
    "عجلون",
    "المفرق",
    "الرمثا"
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8 border border-gray-100">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">تسجيل مقدم خدمة جديد</h2>
        <p className="text-gray-600 text-sm md:text-base">انضم إلى منصتنا وابدأ في استقبال الحجوزات في الأردن</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="mr-2 font-medium text-sm md:text-base">المعلومات الأساسية</span>
          </div>
          <div className="w-12 md:w-16 h-1 bg-gray-200 rounded-full">
            <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="mr-2 font-medium text-sm md:text-base">أوقات العمل</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المؤسسة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  placeholder="مثال: صالون الجمال الملكي"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الخدمة *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المؤسسة
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base resize-none"
                placeholder="اكتب وصفاً مختصراً عن خدماتك ومميزاتك..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان في الأردن *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                placeholder="مثال: عمان - الدوار الأول - شارع الملكة رانيا"
                required
                list="jordan-cities"
              />
              <datalist id="jordan-cities">
                {jordanianCities.map((city, index) => (
                  <option key={index} value={city} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  placeholder="07xxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  placeholder="example@domain.com"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-blue-50 p-4 md:p-6 rounded-lg border border-blue-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">تحديد الموقع الدقيق</h3>
                  <p className="text-sm text-gray-600">لضمان ظهور مؤسستك بدقة على الخريطة</p>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                >
                  {isGettingLocation ? "جاري التحديد..." : "📍 تحديد موقعي الحالي"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    خط العرض (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange("latitude", e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    placeholder="31.9539"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    خط الطول (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange("longitude", e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    placeholder="35.9106"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3 bg-white p-2 rounded border">
                💡 يمكنك الحصول على الإحداثيات من خرائط جوجل أو الضغط على "تحديد موقعي الحالي". 
                إذا تركت فارغاً، سيتم استخدام موقع عمان الافتراضي.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium shadow-md"
              >
                التالي: أوقات العمل ←
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">أوقات العمل</h3>
              <div className="space-y-3 md:space-y-4">
                {days.map((day) => (
                  <div key={day.key} className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse p-3 md:p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-full md:w-20">
                      <span className="font-medium text-gray-700 text-sm md:text-base">{day.label}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.workingHours[day.key as keyof typeof formData.workingHours].isOpen}
                        onChange={(e) => handleWorkingHoursChange(day.key, "isOpen", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">مفتوح</span>
                    </div>

                    {formData.workingHours[day.key as keyof typeof formData.workingHours].isOpen && (
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                        <span className="text-sm text-gray-600">من</span>
                        <input
                          type="time"
                          value={formData.workingHours[day.key as keyof typeof formData.workingHours].open}
                          onChange={(e) => handleWorkingHoursChange(day.key, "open", e.target.value)}
                          className="px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <span className="text-sm text-gray-600">إلى</span>
                        <input
                          type="time"
                          value={formData.workingHours[day.key as keyof typeof formData.workingHours].close}
                          onChange={(e) => handleWorkingHoursChange(day.key, "close", e.target.value)}
                          className="px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base font-medium"
              >
                ← السابق
              </button>
              
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base font-medium"
                >
                  إلغاء
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium shadow-md"
                >
                  {isSubmitting ? "جاري التسجيل..." : "✅ تسجيل مقدم الخدمة"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
