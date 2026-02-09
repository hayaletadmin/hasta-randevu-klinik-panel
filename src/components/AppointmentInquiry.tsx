"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { validateTC } from "@/lib/validations"
import { getPatientByIdentityNo, getAppointmentsByPatientId, type Appointment } from "@/lib/supabase"
import { Loader2, Calendar, MapPin, User, Clock } from "lucide-react"

export function AppointmentInquiry() {
    const [tc, setTc] = useState("")
    const [loading, setLoading] = useState(false)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [hasSearched, setHasSearched] = useState(false)

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

    return (
        <div className="space-y-6 max-w-2xl mx-auto w-full">
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Randevu Sorgula</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">TC Kimlik No</label>
                        <Input
                            placeholder="11 haneli TC Kimlik No"
                            value={tc}
                            onChange={handleTcChange}
                            className="h-11 bg-white border-gray-300 focus-visible:ring-black"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold h-11 transition-all uppercase text-xs tracking-widest"
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
                                <Calendar className="w-4 h-4 text-black" />
                                Randevularınız
                            </h3>
                            {appointments.map((app) => (
                                <Card key={app.id} className="border-l-4 border-l-black hover:shadow-md transition-shadow">
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
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'Tamamlandı' ? 'bg-gray-100 text-gray-900' :
                                                app.status === 'İptal' ? 'bg-gray-50 text-gray-400 line-through' :
                                                    'bg-black text-white'
                                                }`}>
                                                {app.status}
                                            </span>
                                            {app.status === 'Bekleniyor' && (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">İptal işlemi için kliniği arayınız.</span>
                                            )}
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
        </div>
    )
}
