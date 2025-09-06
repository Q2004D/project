import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ServicesManagementPageProps {
  providerId: Id<"providers">;
  onBack: () => void;
}

export function ServicesManagementPage({ providerId, onBack }: ServicesManagementPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const provider = useQuery(api.providers.getProvider, { providerId });
  const allServices = useQuery(api.services.getServicesByProvider, { 
    providerId, 
    includeInactive: true 
  });
  
  const createService = useMutation(api.services.createService);
  const updateService = useMutation(api.services.updateService);
  const deleteService = useMutation(api.services.deleteService);

  // Filter services based on search and status
  const filteredServices = allServices?.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && service.isActive) ||
                         (filterStatus === "inactive" && !service.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleDeleteService = async (serviceId: Id<"services">) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
      try {
        await deleteService({ serviceId });
        toast.success("تم حذف الخدمة بنجاح");
      } catch (error) {
        toast.error("حدث خطأ في حذف الخدمة");
      }
    }
  };

  const handleToggleStatus = async (serviceId: Id<"services">, currentStatus: boolean | undefined) => {
    try {
      await updateService({
        serviceId,
        isActive: !(currentStatus ?? false),
      });
      toast.success(`تم ${!(currentStatus ?? false) ? 'تفعيل' : 'تعطيل'} الخدمة بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في تحديث حالة الخدمة");
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">إدارة خدمات {provider.name}</h1>
                <p className="text-gray-600 mt-1">أضف وعدل خدماتك لتظهر للعملاء</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
            >
              <span>+</span>
              <span>إضافة خدمة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Service Form */}
        {(showAddForm || editingService) && (
          <div className="mb-8">
            <ServiceForm
              providerId={providerId}
              service={editingService}
              onClose={() => {
                setShowAddForm(false);
                setEditingService(null);
              }}
              onSubmit={async (data) => {
                try {
                  if (editingService) {
                    await updateService({
                      serviceId: editingService._id,
                      ...data,
                    });
                    toast.success("تم تحديث الخدمة بنجاح");
                  } else {
                    await createService({
                      providerId,
                      ...data,
                    });
                    toast.success("تم إضافة الخدمة بنجاح");
                  }
                  setShowAddForm(false);
                  setEditingService(null);
                } catch (error) {
                  toast.error("حدث خطأ في حفظ الخدمة");
                }
              }}
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث في الخدمات
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن خدمة..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصفية حسب الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الخدمات</option>
                <option value="active">الخدمات النشطة</option>
                <option value="inactive">الخدمات المعطلة</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div>إجمالي الخدمات: {allServices?.length || 0}</div>
                <div>الخدمات النشطة: {allServices?.filter(s => s.isActive).length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Services List */}
        {filteredServices && filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                onEdit={() => setEditingService(service)}
                onDelete={() => handleDeleteService(service._id)}
                onToggleStatus={() => handleToggleStatus(service._id, service.isActive)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛠️</span>
            </div>
            {searchQuery || filterStatus !== "all" ? (
              <>
                <p className="text-gray-500 mb-4">لا توجد خدمات تطابق البحث</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  مسح الفلاتر
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">لا توجد خدمات مضافة بعد</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  إضافة أول خدمة
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service, onEdit, onDelete, onToggleStatus }: {
  service: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (service.isActive ?? false)
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {(service.isActive ?? false) ? 'نشط' : 'معطل'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">{service.price} د.أ</div>
            <div className="text-sm text-gray-500">{service.duration} دقيقة</div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              تعديل
            </button>
            <button
              onClick={onToggleStatus}
              className={`text-sm font-medium ${
                (service.isActive ?? false)
                  ? 'text-orange-600 hover:text-orange-800' 
                  : 'text-green-600 hover:text-green-800'
              }`}
            >
              {(service.isActive ?? false) ? 'تعطيل' : 'تفعيل'}
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              حذف
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            تم الإنشاء: {new Date(service._creationTime).toLocaleDateString('ar-JO')}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceForm({ providerId, service, onClose, onSubmit }: {
  providerId: Id<"providers">;
  service?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    duration: service?.duration || 30,
    isActive: service?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedDurations = [15, 30, 45, 60, 90, 120, 180];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
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
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم الخدمة *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="مثال: قص وتصفيف الشعر"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              السعر (د.أ) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.5"
              placeholder="25"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            وصف الخدمة *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="اكتب وصفاً تفصيلياً للخدمة يساعد العملاء على فهم ما تقدمه..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدة (دقيقة) *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {predefinedDurations.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} دقيقة
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حالة الخدمة
            </label>
            <select
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">نشط - ظاهر للعملاء</option>
              <option value="inactive">معطل - مخفي عن العملاء</option>
            </select>
          </div>
        </div>

        {/* Service Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">معاينة الخدمة:</h4>
          <div className="bg-white p-4 rounded border">
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-semibold text-gray-900">{formData.name || "اسم الخدمة"}</h5>
              <span className="text-blue-600 font-bold">{formData.price} د.أ</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{formData.description || "وصف الخدمة"}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="ml-1">⏱️</span>
              <span>{formData.duration} دقيقة</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الحفظ..." : (service ? "تحديث الخدمة" : "إضافة الخدمة")}
          </button>
        </div>
      </form>
    </div>
  );
}
