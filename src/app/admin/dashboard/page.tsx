export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Panel Özeti</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Bugünkü Randevular</h3>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Bekleyen Onay</h3>
                    <p className="text-3xl font-bold text-sky-600">4</p>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Toplam Hasta</h3>
                    <p className="text-3xl font-bold text-gray-900">1,248</p>
                </div>
            </div>
        </div>
    );
}
