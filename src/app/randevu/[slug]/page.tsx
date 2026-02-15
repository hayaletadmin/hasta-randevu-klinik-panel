
import { notFound } from "next/navigation"
import AppointmentClient from "@/components/AppointmentClient"
import { getClinicBySlug, getClinicSettings } from "@/lib/supabase"

interface PageProps {
    params: {
        slug: string
    }
}

export default async function ClinicAppointmentPage({ params }: PageProps) {
    const { slug } = params

    // 1. Fetch Clinic by Slug
    const clinic = await getClinicBySlug(slug)

    if (!clinic) {
        notFound()
    }

    // 2. Fetch Clinic Settings (optional custom settings)
    const settings = await getClinicSettings(clinic.id)

    // Prepare clinic info for Client Component
    const clinicInfo = {
        name: clinic.name,
        logo: clinic.logo_url || "",
        phone1: clinic.phone || "",
        website: clinic.website || "",
        description: clinic.description || "",
        address: clinic.address || ""
    }

    return (
        <AppointmentClient clinicInfo={clinicInfo} clinicId={clinic.id} />
    )
}
