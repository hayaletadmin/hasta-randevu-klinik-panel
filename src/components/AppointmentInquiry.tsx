"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { validateTC } from "@/lib/validations"
import { getPatientByIdentityNo, getAppointmentsByPatientId, updateAppointment, type Appointment } from "@/lib/supabase"
import { Loader2, Calendar, MapPin, User, Clock, X, AlertCircle } from "lucide-react"

export function AppointmentInquiry() {
    const [tc, setTc] = useState("")
    const [loading, setLoading] = useState(false)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [hasSearched, setHasSearched] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [cancelTcInput, setCancelTcInput] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const handleTcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
        setTc(val);
    }

    const handleSearch = async () => {
        if (tc.length !== 11 || !validateTC(tc)) {
            alert("Lütfen 11 haneli geçerli bir TC Kimlik Numarası giriniz.");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const patient = await getPatientByIdentityNo(tc);
            if (!patient) {
                setAppointments([]);
            } else {
                const apps = await getAppointmentsByPatientId(patient.id);
                setAppointments(apps);
            }
        } catch (error) {
            console.error("Sorgulama hatası:", error);
        } finally {
            setLoading(false);
        }
    }
    const handleCancelClick = (app: Appointment) => {
        setSelectedAppointment(app);
        setCancelTcInput("");
    }

    const confirmCancellation = async () => {
        if (!selectedAppointment) return;
        if (cancelTcInput !== tc) {
            alert("Girdiğiniz TC Kimlik Numarası hatalı.");
            return;
        }

        setIsCancelling(true);
        try {
            await updateAppointment(selectedAppointment.id!, {
                status: 'İptal (Hasta)',
                cancelled_at: new Date().toISOString()
            });
            // Refresh appointments list
            const apps = await getAppointmentsByPatientId(selectedAppointment.patient_id);
            setAppointments(apps);
            setSelectedAppointment(null);
        } catch (error: any) {
            console.error("İptal hatası detayı:", error);
            alert(`Randevu iptal edilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
        } finally {
            setIsCancelling(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto w-full">
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5 sm:p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Randevu Sorgula</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">TC Kimlik No</label>
                        <Input
                            placeholder="11 haneli TC Kimlik No"
                            value={tc}
                            onChange={handleTcChange}
                            className="h-11 bg-white border-gray-300 focus-visible:ring-teal-600"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 transition-all uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sorgula"}
                    </Button>
                </CardContent>
            </Card>

            {hasSearched && !loading && (
                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        <>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Calendar className="w-4 h-4 text-teal-600" />
                                Randevularınız
                            </h3>
                            {appointments.map((app) => (
                                <Card key={app.id} className="border-l-4 border-l-teal-600 hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-3 text-left">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <User className="w-4 h-4" />
                                                    <span className="font-bold text-gray-900 tracking-tight">{app.doctors?.title} {app.doctors?.full_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="uppercase text-xs font-medium">{app.departments?.name}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3 text-left sm:text-right sm:items-end flex flex-col">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="font-bold text-black">
                                                        {new Date(app.appointment_date).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-bold text-black">{app.appointment_time.slice(0, 5)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {app.status === 'Bekleniyor' && (
                                                    <Button
                                                        onClick={() => handleCancelClick(app)}
                                                        variant="ghost"
                                                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                        İptal Et
                                                    </Button>
                                                )}
                                                {app.status.includes('İptal') && app.cancelled_at && (
                                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">
                                                        ({new Date(app.cancelled_at).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })} {new Date(app.cancelled_at).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })}) İPTAL EDİLDİ
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'Tamamlandı' ? 'bg-gray-100 text-gray-900' :
                                                    app.status.includes('İptal') ? 'bg-gray-50 text-gray-400 line-through' :
                                                        'bg-teal-600 text-white'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <Card className="bg-white border-gray-200 shadow-sm">
                            <CardContent className="p-10 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Calendar className="w-8 h-8 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-900 font-bold uppercase tracking-tight">Aktif Randevu Bulunamadı</p>
                                    <p className="text-xs text-gray-500 font-medium">Lütfen TC No'yu kontrol ediniz veya yeni bir randevu oluşturunuz.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
            {/* İptal Onay Modalı */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm border-none shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-3 text-red-600">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">Randevuyu İptal Et</h3>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    Randevuyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </p>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-gray-500">
                                        Onaylamak için ' <strong>{tc}</strong> ' yazınız
                                    </label>
                                    <Input
                                        value={cancelTcInput}
                                        onChange={(e) => setCancelTcInput(e.target.value.slice(0, 20))}
                                        placeholder="TC Kimlik No"
                                        className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all font-bold tracking-widest text-center"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setSelectedAppointment(null)}
                                    variant="outline"
                                    className="flex-1 h-12 border-gray-200 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    onClick={confirmCancellation}
                                    disabled={cancelTcInput !== tc || isCancelling}
                                    className={`flex-1 h-12 font-black uppercase text-[10px] tracking-widest transition-all ${cancelTcInput === tc
                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                                        : "bg-red-100 text-red-300 cursor-not-allowed border-none shadow-none"
                                        }`}
                                >
                                    {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "İptal Et"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
