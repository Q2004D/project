import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { AddProviderForm } from "./AddProviderForm";
import { ProviderBookingManagement } from "./ProviderBookingManagement";

export function ProviderDashboard() {
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Id<"providers"> | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "services" | "delete">("overview");

  const myProviders = useQuery(api.providers.getMyProviders);
  const createService = useMutation(api.services.createService);
  const updateService = useMutation(api.services.updateService);
  const deleteService = useMutation(api.services.deleteService);
  const deleteProvider = useMutation(api.providers.deleteProvider);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 60,
  });

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);

  const handleAddProviderSuccess = () => {
    setShowAddProvider(false);
    toast.success("تم إضافة مقدم الخدمة بنجاح!");
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      if (editingService) {
        await updateService({
          serviceId: editingService as any,
          ...serviceForm,
        });
        toast.success("تم تحديث الخدمة بنجاح");
      } else {
        await createService({
          providerId: selectedProvider,
          ...serviceForm,
        });
        toast.success("تم إضافة الخدمة بنجاح");
      }
      
      setServiceForm({ name: "", description: "", price: 0, duration: 60 });
      setShowServiceForm(false);
      setEditingService(null);
    } catch (error) {
      toast.error("حدث خطأ في حفظ الخدمة");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;

    try {
      await deleteService({ serviceId: serviceId as any });
      toast.success("تم حذف الخدمة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في حذف الخدمة");
    }
  };

  const handleDeleteProvider = async (providerId: string, providerName: string) => {
    const confirmMessage = `⚠️ تحذير: هل أنت متأكد من حذف "${providerName}" نهائياً؟\n\nسيتم حذف:\n• جميع الخدمات المرتبطة\n• جميع التقييمات\n• جميع العروض الترويجية\n• جميع الحجوزات المكتملة والملغية\n\nملاحظة: لا يمكن حذف الصالون إذا كان لديك حجوزات نشطة (في الانتظار أو مؤكدة)\n\nهذا الإجراء لا يمكن التراجع عنه!`;
    
    if (!confirm(confirmMessage)) return;

    try {
      await deleteProvider({ providerId: providerId as any });
      toast.success(`تم حذف "${providerName}" بنجاح`);
      // إعادة تعيين المقدم المحدد إذا تم حذفه
      if (selectedProvider === providerId) {
        setSelectedProvider(null);
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في حذف الصالون");
    }
  };

  if (showAddProvider) {
    return (
      <AddProviderForm
        onSuccess={handleAddProviderSuccess}
        onCancel={() => setShowAddProvider(false)}
      />
    );
  }

  if (!myProviders || myProviders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏪</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لم تقم بإنشاء أي مقدم خدمة بعد
          </h3>
          <p className="text-gray-500 mb-6">
            ابدأ بإضافة مقدم خدمة جديد لإدارة أعمالك وخدماتك
          </p>
        </div>
        
        <button
          onClick={() => setShowAddProvider(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + إضافة مقدم خدمة جديد
        </button>
      </div>
    );
  }

  const currentProvider = selectedProvider ? myProviders.find(p => p._id === selectedProvider) : myProviders[0];
  if (!selectedProvider && myProviders.length > 0) {
    setSelectedProvider(myProviders[0]._id);
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col space-y-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold">لوحة تحكم مقدم الخدمة</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <button
              onClick={() => setShowAddProvider(true)}
              className="bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              + إضافة مقدم خدمة
            </button>
            {myProviders.length > 1 && (
              <select
                value={selectedProvider || ""}
                onChange={(e) => setSelectedProvider(e.target.value as Id<"providers">)}
                className="px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {myProviders.map((provider) => (
                  <option key={provider._id} value={provider._id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 space-x-reverse overflow-x-auto">
            {[
              { key: "overview", label: "نظرة عامة", icon: "📊" },
              { key: "bookings", label: "إدارة الحجوزات", icon: "📅" },
              { key: "services", label: "إدارة الخدمات", icon: "⚙️" },
              { key: "delete", label: "حذف الصالون", icon: "🗑️" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 space-x-reverse whitespace-nowrap ${
                  activeTab === tab.key
                    ? tab.key === "delete" 
                      ? "border-red-500 text-red-600"
                      : "border-blue-500 text-blue-600"
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
      {activeTab === "overview" && currentProvider && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">معلومات {currentProvider.name}</h3>
            <button
              onClick={() => handleDeleteProvider(currentProvider._id, currentProvider.name)}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              🗑️ حذف الصالون نهائياً
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">معلومات الاتصال</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">الهاتف:</span> {currentProvider.phone}</p>
                <p><span className="text-gray-500">البريد:</span> {currentProvider.email}</p>
                <p><span className="text-gray-500">العنوان:</span> {currentProvider.address}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">الإحصائيات</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">التقييم:</span> {currentProvider.rating?.toFixed(1) || '0.0'} ⭐</p>
                <p><span className="text-gray-500">عدد التقييمات:</span> {currentProvider.reviewCount || 0}</p>
                <p><span className="text-gray-500">الحالة:</span> {currentProvider.isActive !== false ? 'نشط' : 'معطل'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">الوصف</h4>
            <p className="text-gray-600 text-sm">{currentProvider.description}</p>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">⚠️ منطقة الخطر</h4>
              <p className="text-sm text-red-700 mb-4">
                حذف الصالون سيؤدي إلى إزالة جميع البيانات المرتبطة به نهائياً.
              </p>
              <button
                onClick={() => handleDeleteProvider(currentProvider._id, currentProvider.name)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ حذف "{currentProvider.name}" نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bookings" && selectedProvider && (
        <ProviderBookingManagement providerId={selectedProvider} />
      )}

      {activeTab === "services" && currentProvider && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 mb-6">
              <h3 className="text-lg font-semibold">إدارة الخدمات</h3>
              <button
                onClick={() => {
                  setShowServiceForm(true);
                  setEditingService(null);
                  setServiceForm({ name: "", description: "", price: 0, duration: 60 });
                }}
                className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 text-sm sm:text-base"
              >
                + إضافة خدمة جديدة
              </button>
            </div>

            {showServiceForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-4">
                  {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
                </h4>
                <form onSubmit={handleServiceSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم الخدمة
                      </label>
                      <input
                        type="text"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        السعر (د.أ)
                      </label>
                      <input
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف
                    </label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المدة (بالدقائق)
                    </label>
                    <input
                      type="number"
                      value={serviceForm.duration}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 text-sm sm:text-base"
                    >
                      {editingService ? "تحديث الخدمة" : "إضافة الخدمة"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowServiceForm(false);
                        setEditingService(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {currentProvider.services?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد خدمات مضافة بعد</p>
              ) : (
                currentProvider.services?.map((service: any) => (
                  <div key={service._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:space-x-4 sm:space-x-reverse mt-2 text-xs sm:text-sm text-gray-500">
                          <span>💰 {service.price} د.أ</span>
                          <span>⏱️ {service.duration} دقيقة</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 sm:space-x-reverse w-full sm:w-auto">
                        <button
                          onClick={() => {
                            setEditingService(service._id);
                            setServiceForm({
                              name: service.name,
                              description: service.description,
                              price: service.price,
                              duration: service.duration,
                            });
                            setShowServiceForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm py-1 px-2 sm:px-0 bg-blue-50 sm:bg-transparent rounded sm:rounded-none text-center sm:text-right"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          className="text-red-600 hover:text-red-800 text-xs sm:text-sm py-1 px-2 sm:px-0 bg-red-50 sm:bg-transparent rounded sm:rounded-none text-center sm:text-right"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "delete" && currentProvider && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center">
              🗑️ حذف الصالون نهائياً
            </h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-red-900 mb-3">⚠️ تحذير مهم</h4>
              <p className="text-red-800 mb-4">
                حذف الصالون سيؤدي إلى إزالة جميع البيانات التالية نهائياً:
              </p>
              <ul className="text-red-700 text-sm space-y-2 mb-4">
                <li>• جميع الخدمات المقدمة ({currentProvider.services?.length || 0} خدمة)</li>
                <li>• جميع التقييمات والمراجعات</li>
                <li>• جميع العروض الترويجية</li>
                <li>• جميع الحجوزات المكتملة والملغية</li>
                <li>• جميع الإحصائيات والتقارير</li>
              </ul>
              
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                <p className="text-yellow-800 text-sm font-medium">
                  📝 ملاحظة: لا يمكن حذف الصالون إذا كان لديك حجوزات نشطة (في الانتظار أو مؤكدة)
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">معلومات الصالون المراد حذفه:</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>الاسم:</strong> {currentProvider.name}</p>
                <p><strong>العنوان:</strong> {currentProvider.address}</p>
                <p><strong>الفئة:</strong> {currentProvider.category}</p>
                <p><strong>عدد الخدمات:</strong> {currentProvider.services?.length || 0}</p>
                <p><strong>التقييم:</strong> {currentProvider.rating?.toFixed(1) || '0.0'} ⭐</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleDeleteProvider(currentProvider._id, currentProvider.name)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                🗑️ نعم، احذف "{currentProvider.name}" نهائياً
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                إلغاء والعودة للنظرة العامة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
