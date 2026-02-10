import { getClinicSettings } from "@/lib/supabase"
import AppointmentClient from "@/components/AppointmentClient"

export const dynamic = "force-dynamic"

export default async function AppointmentPage() {
    // Verileri sunucu tarafında çekiyoruz
    // Bu sayede kullanıcı sayfayı açtığı anda üst klinik bilgilerini anında görecek
    const settings = await getClinicSettings();

    const clinicInfo = {
        name: '',
        logo: '',
        phone1: '',
        website: '',
        description: '',
        address: ''
    };

    settings.forEach(s => {
        if (s.key === 'clinic_name') clinicInfo.name = s.value;
        if (s.key === 'clinic_logo') clinicInfo.logo = s.value;
        if (s.key === 'clinic_phone1') clinicInfo.phone1 = s.value;
        if (s.key === 'clinic_website') clinicInfo.website = s.value;
        if (s.key === 'clinic_description') clinicInfo.description = s.value;
        if (s.key === 'clinic_address') clinicInfo.address = s.value;
    });

    return <AppointmentClient clinicInfo={clinicInfo} />;
}
