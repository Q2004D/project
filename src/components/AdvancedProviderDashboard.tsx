import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { AddProviderForm } from "./AddProviderForm";

export function AdvancedProviderDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "analytics" | "promotions" | "customers">("overview");
  const [showAddProvider, setShowAddProvider] = useState(false);
  const myProviders = useQuery(api.providers.getMyProviders);
  const [selectedProvider, setSelectedProvider] = useState<Id<"providers"> | null>(null);

  const dashboardSummary = useQuery(
    api.analytics.getDashboardSummary,
    selectedProvider ? { providerId: selectedProvider } : "skip"
  );

  const analytics = useQuery(
    api.analytics.getProviderAnalytics,
    selectedProvider ? { providerId: selectedProvider } : "skip"
  );

  const promotions = useQuery(
    api.promotions.getProviderPromotions,
    selectedProvider ? { providerId: selectedProvider } : "skip"
  );

  const handleAddProviderSuccess = () => {
    setShowAddProvider(false);
    toast.success("تم إضافة مقدم الخدمة بنجاح!");
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
        
        <div className="mt-8 text-sm text-gray-400">
          <p>بعد إضافة مقدم الخدمة، ستتمكن من:</p>
          <ul className="mt-2 space-y-1">
            <li>• إدارة الخدمات والأسعار</li>
            <li>• متابعة الحجوزات والعملاء</li>
            <li>• عرض التحليلات والإحصائيات</li>
            <li>• إنشاء العروض والخصومات</li>
          </ul>
        </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">لوحة التحكم المتقدمة</h2>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setShowAddProvider(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + إضافة مقدم خدمة
            </button>
            {myProviders.length > 1 && (
              <select
                value={selectedProvider || ""}
                onChange={(e) => setSelectedProvider(e.target.value as Id<"providers">)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <nav className="flex space-x-8 space-x-reverse">
            {[
              { key: "overview", label: "نظرة عامة", icon: "📊" },
              { key: "services", label: "الخدمات", icon: "🛠️" },
              { key: "analytics", label: "التحليلات", icon: "📈" },
              { key: "promotions", label: "العروض", icon: "🎉" },
              { key: "customers", label: "العملاء", icon: "👥" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
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
      {activeTab === "overview" && (
        <OverviewTab 
          provider={currentProvider} 
          summary={dashboardSummary} 
        />
      )}
      {activeTab === "services" && (
        <ServicesTab providerId={selectedProvider!} />
      )}
      {activeTab === "analytics" && (
        <AnalyticsTab 
          providerId={selectedProvider!} 
          analytics={analytics} 
        />
      )}
      {activeTab === "promotions" && (
        <PromotionsTab 
          providerId={selectedProvider!} 
          promotions={promotions} 
        />
      )}
      {activeTab === "customers" && (
        <CustomersTab providerId={selectedProvider!} />
      )}
    </div>
  );
}

function OverviewTab({ provider, summary }: { provider: any; summary: any }) {
  if (!summary) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📅
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">حجوزات اليوم</p>
              <p className="text-2xl font-bold text-gray-900">{summary.todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              ⏳
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">في الانتظار</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              💰
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إيرادات الشهر</p>
              <p className="text-2xl font-bold text-gray-900">{summary.monthlyRevenue} د.أ</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              ⭐
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">التقييم</p>
              <p className="text-2xl font-bold text-gray-900">{summary.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">الحجوزات القادمة</h3>
        {summary.upcomingBookings?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد حجوزات قادمة</p>
        ) : (
          <div className="space-y-3">
            {summary.upcomingBookings?.map((booking: any) => (
              <div key={booking._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">عميل - {booking.time}</p>
                  <p className="text-sm text-gray-600">{booking.totalPrice} د.أ</p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  مؤكد
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">آخر التقييمات</h3>
        {summary.recentReviews?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد تقييمات حديثة</p>
        ) : (
          <div className="space-y-4">
            {summary.recentReviews?.map((review: any) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">عميل</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="mr-1">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ providerId, analytics }: { providerId: Id<"providers">; analytics: any }) {
  if (!analytics) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-2">إجمالي الحجوزات</h4>
          <p className="text-3xl font-bold text-blue-600">{analytics.summary.totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-2">إجمالي الإيرادات</h4>
          <p className="text-3xl font-bold text-green-600">{analytics.summary.totalRevenue} د.أ</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-2">متوسط التقييم</h4>
          <p className="text-3xl font-bold text-yellow-600">{analytics.summary.averageRating}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-2">أيام النشاط</h4>
          <p className="text-3xl font-bold text-purple-600">{analytics.summary.totalDays}</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">توزيع حالات الحجز</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.statusDistribution).map(([status, count]) => {
            const statusLabels = {
              pending: "في الانتظار",
              confirmed: "مؤكد",
              completed: "مكتمل",
              cancelled: "ملغي",
              no_show: "لم يحضر",
            };
            const statusColors = {
              pending: "bg-yellow-100 text-yellow-800",
              confirmed: "bg-blue-100 text-blue-800",
              completed: "bg-green-100 text-green-800",
              cancelled: "bg-red-100 text-red-800",
              no_show: "bg-gray-100 text-gray-800",
            };
            
            return (
              <div key={status} className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                  {statusLabels[status as keyof typeof statusLabels]}
                </div>
                <p className="text-2xl font-bold mt-2">{count as number}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">آخر الحجوزات</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوقت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.bookings.map((booking: any) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'completed' ? 'مكتمل' :
                       booking.status === 'confirmed' ? 'مؤكد' :
                       booking.status === 'pending' ? 'في الانتظار' : 'ملغي'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.totalPrice} د.أ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PromotionsTab({ providerId, promotions }: { providerId: Id<"providers">; promotions: any }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const createPromotion = useMutation(api.promotions.createPromotion);
  const updatePromotion = useMutation(api.promotions.updatePromotion);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "percentage" as const,
    discountValue: 0,
    validFrom: "",
    validUntil: "",
    usageLimit: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPromotion({
        providerId,
        ...formData,
        usageLimit: formData.usageLimit || undefined,
      });
      toast.success("تم إنشاء العرض بنجاح");
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        validFrom: "",
        validUntil: "",
        usageLimit: 0,
      });
    } catch (error) {
      toast.error("حدث خطأ في إنشاء العرض");
    }
  };

  const togglePromotion = async (promotionId: string, isActive: boolean) => {
    try {
      await updatePromotion({
        promotionId: promotionId as any,
        isActive: !isActive,
      });
      toast.success("تم تحديث العرض بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في تحديث العرض");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">إدارة العروض والخصومات</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          {showCreateForm ? "إلغاء" : "+ إضافة عرض جديد"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">إنشاء عرض جديد</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان العرض
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الخصم
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">نسبة مئوية</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف العرض
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  قيمة الخصم {formData.discountType === 'percentage' ? '(%)' : '(د.أ)'}
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حد الاستخدام (اختياري)
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="اتركه فارغاً لعدم وضع حد"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              إنشاء العرض
            </button>
          </form>
        </div>
      )}

      {/* Existing Promotions */}
      <div className="space-y-4">
        {promotions?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">لا توجد عروض حالياً</p>
          </div>
        ) : (
          promotions?.map((promotion: any) => (
            <div key={promotion._id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{promotion.title}</h4>
                  <p className="text-gray-600 mt-1">{promotion.description}</p>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {promotion.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                  <button
                    onClick={() => togglePromotion(promotion._id, promotion.isActive)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      promotion.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {promotion.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">الخصم:</span>
                  <p className="font-medium">
                    {promotion.discountValue}{promotion.discountType === 'percentage' ? '%' : ' د.أ'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">صالح من:</span>
                  <p className="font-medium">{promotion.validFrom}</p>
                </div>
                <div>
                  <span className="text-gray-500">صالح حتى:</span>
                  <p className="font-medium">{promotion.validUntil}</p>
                </div>
                <div>
                  <span className="text-gray-500">الاستخدام:</span>
                  <p className="font-medium">
                    {promotion.usedCount || 0} / {promotion.usageLimit || '∞'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CustomersTab({ providerId }: { providerId: Id<"providers"> }) {
  // This would typically fetch customer data and analytics
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">إدارة العملاء</h3>
        <p className="text-gray-500 text-center py-8">
          ستتوفر هذه الميزة قريباً - إدارة قاعدة بيانات العملاء والتواصل معهم
        </p>
      </div>
    </div>
  );
}

function ServicesTab({ providerId }: { providerId: Id<"providers"> }) {
  const services = useQuery(api.services.getServicesByProvider, { providerId });
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">إدارة الخدمات</h3>
        <div className="space-y-4">
          {services?.map((service) => (
            <div key={service._id} className="border rounded-lg p-4">
              <h4 className="font-semibold">{service.name}</h4>
              <p className="text-gray-600 text-sm">{service.description}</p>
              <p className="text-blue-600 font-medium">{service.price} د.أ - {service.duration} دقيقة</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
