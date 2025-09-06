import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "providers" | "bookings" | "analytics" | "settings">("overview");
  
  const adminUser = useQuery(api.admin.checkCurrentUserAdmin);
  const systemStats = useQuery(api.admin.getSystemStats);
  const allUsers = useQuery(api.admin.getAllUsers, { limit: 100 });
  const allProviders = useQuery(api.admin.getAllProviders, { limit: 100 });
  const allBookings = useQuery(api.admin.getAllBookings, { limit: 100 });
  
  const toggleProviderStatus = useMutation(api.admin.toggleProviderStatus);
  const toggleProviderVisibility = useMutation(api.admin.toggleProviderVisibility);
  const deleteProvider = useMutation(api.admin.deleteProvider);
  const deleteAllProviders = useMutation(api.admin.deleteAllProviders);
  const deleteAllData = useMutation(api.admin.deleteAllData);

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  const handleToggleProvider = async (providerId: string, isActive: boolean) => {
    try {
      await toggleProviderStatus({
        providerId: providerId as any,
        isActive: !isActive,
      });
      toast.success(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} مقدم الخدمة بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في تحديث حالة مقدم الخدمة");
    }
  };

  const handleToggleVisibility = async (providerId: string, isVisible: boolean) => {
    try {
      await toggleProviderVisibility({
        providerId: providerId as any,
        isVisible: !isVisible,
      });
      toast.success(`تم ${!isVisible ? 'إظهار' : 'إخفاء'} مقدم الخدمة بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في تحديث ظهور مقدم الخدمة");
    }
  };

  const handleDeleteProvider = async (providerId: string, providerName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${providerName}"؟ سيتم حذف جميع الخدمات والحجوزات المرتبطة به.`)) {
      return;
    }

    try {
      await deleteProvider({
        providerId: providerId as any,
      });
      toast.success(`تم حذف "${providerName}" بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في حذف مقدم الخدمة");
    }
  };

  const handleDeleteAllProviders = async () => {
    const confirmMessage = `⚠️ تحذير خطير: هل أنت متأكد من حذف جميع مقدمي الخدمة؟\n\nسيتم حذف:\n• جميع مقدمي الخدمة\n• جميع الخدمات\n• جميع الحجوزات\n• جميع التقييمات\n\nهذا الإجراء لا يمكن التراجع عنه!`;
    
    if (!confirm(confirmMessage)) return;
    
    if (!confirm("هل أنت متأكد 100%؟ هذا سيحذف كل شيء!")) return;

    try {
      const result = await deleteAllProviders();
      toast.success(`تم حذف ${result.deletedCount} مقدم خدمة بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في حذف مقدمي الخدمة");
    }
  };

  const handleDeleteAllData = async () => {
    const confirmMessage = `🚨 تحذير خطير: حذف جميع البيانات!\n\nسيتم حذف كل شيء من النظام\n\nهذا سيمحو النظام بالكامل!`;
    
    if (!confirm(confirmMessage)) return;
    if (!confirm("هل أنت متأكد 100%؟")) return;
    if (!confirm("تأكيد أخير!")) return;

    try {
      const result = await deleteAllData();
      toast.success(`تم حذف ${result.deletedCount} عنصر بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ في حذف البيانات");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🛡️ لوحة تحكم الأدمن</h1>
              <p className="text-gray-600 text-sm sm:text-base">مرحباً، {adminUser.role === 'super_admin' ? 'مدير عام' : adminUser.role === 'admin' ? 'مدير' : 'مشرف'}</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {adminUser.role === 'super_admin' ? '👑 مدير عام' : adminUser.role === 'admin' ? '🔧 مدير' : '👮 مشرف'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-8 space-x-reverse px-3 sm:px-6 overflow-x-auto">
              {[
                { key: "overview", label: "نظرة عامة", icon: "📊" },
                { key: "users", label: "المستخدمين", icon: "👥" },
                { key: "providers", label: "مقدمي الخدمة", icon: "🏪" },
                { key: "bookings", label: "الحجوزات", icon: "📅" },
                { key: "analytics", label: "التحليلات", icon: "📈" },
                { key: "settings", label: "الإعدادات", icon: "⚙️" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 space-x-reverse whitespace-nowrap ${
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
          <OverviewTab stats={systemStats} />
        )}
        {activeTab === "users" && (
          <UsersTab users={allUsers} />
        )}
        {activeTab === "providers" && (
          <ProvidersTab 
            providers={allProviders} 
            onToggleStatus={handleToggleProvider}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDeleteProvider}
            onDeleteAll={handleDeleteAllProviders}
          />
        )}
        {activeTab === "bookings" && (
          <BookingsTab bookings={allBookings} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab stats={systemStats} />
        )}
        {activeTab === "settings" && (
          <SettingsTab adminUser={adminUser} onDeleteAllData={handleDeleteAllData} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ stats }: { stats: any }) {
  if (!stats) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              👥
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              🏪
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">مقدمي الخدمة</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalProviders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              📅
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الحجوزات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              💰
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalRevenue} د.أ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">توزيع حالات الحجز</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.bookingsByStatus).map(([status, count]) => {
            const statusLabels = {
              pending: "في الانتظار",
              confirmed: "مؤكد",
              completed: "مكتمل",
              cancelled: "ملغي",
              rejected: "مرفوض",
              no_show: "لم يحضر",
            };
            const statusColors = {
              pending: "bg-yellow-100 text-yellow-800",
              confirmed: "bg-blue-100 text-blue-800",
              completed: "bg-green-100 text-green-800",
              cancelled: "bg-gray-100 text-gray-800",
              rejected: "bg-red-100 text-red-800",
              no_show: "bg-orange-100 text-orange-800",
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

      {/* Top Providers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">أكثر مقدمي الخدمة نشاطاً</h3>
        <div className="space-y-3">
          {stats.topProviders?.map((item: any, index: number) => (
            <div key={item.provider?._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{item.provider?.name}</p>
                  <p className="text-sm text-gray-600">{item.provider?.category}</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {item.bookingCount} حجز
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: any[] | undefined }) {
  if (!users) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">المستخدمين ({users.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المستخدم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                البريد الإلكتروني
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ التسجيل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.name?.charAt(0) || user.email?.charAt(0) || '؟'}
                      </span>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user._creationTime).toLocaleDateString('ar-JO')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    نشط
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProvidersTab({ providers, onToggleStatus, onToggleVisibility, onDelete, onDeleteAll }: { 
  providers: any[] | undefined; 
  onToggleStatus: (id: string, isActive: boolean) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onDelete: (id: string, name: string) => void;
  onDeleteAll: () => void;
}) {
  if (!providers) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      mens_salon: "صالون رجالي",
      womens_salon: "صالون نسائي",
      beauty_clinic: "عيادة تجميل",
      laser_clinic: "عيادة ليزر",
      skincare: "العناية بالبشرة",
    };
    return categories[category] || category;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">مقدمي الخدمة ({providers.length})</h3>
        {providers.length > 0 && (
          <button
            onClick={onDeleteAll}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
          >
            🗑️ حذف الكل
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مقدم الخدمة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المالك
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الفئة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التقييم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الظهور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider) => (
              <tr key={provider._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {provider.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {provider.address}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {provider.owner?.name || provider.owner?.email || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryLabel(provider.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="mr-1">
                      {provider.rating?.toFixed(1) || '0.0'} ({provider.reviewCount || 0})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    provider.isActive !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.isActive !== false ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    provider.isVisible !== false 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.isVisible !== false ? 'ظاهر' : 'مخفي'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3 space-x-reverse">
                    <button
                      onClick={() => onToggleStatus(provider._id, provider.isActive !== false)}
                      className={provider.isActive !== false ? 'text-red-600' : 'text-green-600'}
                    >
                      {provider.isActive !== false ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => onToggleVisibility(provider._id, provider.isVisible !== false)}
                      className={provider.isVisible !== false ? 'text-gray-600' : 'text-blue-600'}
                    >
                      {provider.isVisible !== false ? 'إخفاء' : 'إظهار'}
                    </button>
                    <button
                      onClick={() => onDelete(provider._id, provider.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: any[] | undefined }) {
  if (!bookings) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">الحجوزات ({bookings.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مقدم الخدمة
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
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.user?.name || booking.user?.email || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.provider?.name || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.service?.name || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.date} - {booking.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.totalPrice} د.أ
                  {booking.customPrice && booking.customPrice !== booking.totalPrice && (
                    <span className="text-xs text-green-600 block">
                      (مخصص: {booking.customPrice} د.أ)
                    </span>
                  )}
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
    </div>
  );
}

function AnalyticsTab({ stats }: { stats: any }) {
  if (!stats) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">تحليلات النظام</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">المستخدمين الجدد هذا الشهر</h4>
            <p className="text-2xl font-bold text-blue-600">{stats.overview.newUsersThisMonth}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">حجوزات اليوم</h4>
            <p className="text-2xl font-bold text-green-600">{stats.overview.todayBookings}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">متوسط الإيرادات اليومية</h4>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(stats.overview.totalRevenue / 30)} د.أ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ adminUser, onDeleteAllData }: { adminUser: any; onDeleteAllData?: () => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">إعدادات النظام</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">معلومات المدير</h4>
            <p className="text-sm text-gray-600">الدور: {adminUser.role}</p>
            <p className="text-sm text-gray-600">الحالة: {adminUser.isActive ? 'نشط' : 'معطل'}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ تحذير</h4>
            <p className="text-sm text-yellow-800">
              هذه الصفحة مخصصة للمديرين فقط. تأكد من استخدام الصلاحيات بحذر.
            </p>
          </div>
          
          {adminUser.role === 'super_admin' && onDeleteAllData && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-3">🚨 منطقة الخطر القصوى</h4>
              <p className="text-sm text-red-800 mb-4">
                حذف جميع البيانات سيمحو النظام بالكامل ولا يمكن التراجع عنه.
              </p>
              <button
                onClick={onDeleteAllData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ حذف جميع البيانات نهائياً
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
