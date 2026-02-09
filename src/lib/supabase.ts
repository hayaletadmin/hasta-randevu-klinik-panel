
import { createClient } from '@supabase/supabase-js';

// Supabase Client Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Types
export type Patient = {
    id: string;
    created_at?: string;
    identity_no: string;
    full_name: string;
    phone: string;
    email?: string;
    gender?: string;
    birth_date?: string;
    blood_type?: string;
    notes?: string;
    doctor_id?: string;
    group_id?: string;
    is_active?: boolean;
    doctors?: Doctor; // Joined info
    patient_groups?: PatientGroup; // Joined info
};

export type PatientGroup = {
    id: string;
    created_at?: string;
    name: string;
    description?: string;
    is_active?: boolean;
};

export type Doctor = {
    id: string;
    created_at?: string;
    full_name: string;
    title?: string;
    department_id: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    color?: string; // Hex color code
    // For joined queries
    departments?: Department;
    work_hours?: WorkHour[];
};

export interface WorkHour {
    day: number; // 1-7 (Pazartesi-Pazar)
    start: string;
    end: string;
    isOpen: boolean;
    hasLunchBreak?: boolean;
    lunchStart?: string;
    lunchEnd?: string;
}

export interface Closure {
    id: string;
    created_at?: string;
    closure_date: string; // YYYY-MM-DD
    start_time?: string | null; // HH:mm, null ise tüm gün
    end_time?: string | null;
    target_type: 'clinic' | 'doctor';
    doctor_id?: string | null;
    reason?: string | null;
    is_active?: boolean;
    // Join için
    doctors?: { full_name: string };
}

export type Department = {
    id: string;
    created_at?: string;
    name: string;
    is_active?: boolean;
};

export type Procedure = {
    id: string;
    created_at?: string;
    name: string;
    department_id: string;
    price?: number;
    duration_minutes?: number;
    is_active?: boolean;
};

export type Appointment = {
    id?: string;
    created_at?: string;
    patient_id: string;
    doctor_id?: string;
    department_id?: string;
    procedure_id?: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    priority: 'normal' | 'acil' | 'vip' | 'engelli';
    notes?: string;
    recorded_by?: string;
    // Joined fields for display
    patients?: Patient;
    doctors?: Doctor;
    departments?: Department;
    procedures?: Procedure;
};

export type AppNotification = {
    id: string;
    created_at: string;
    message: string;
    link?: string;
    is_read: boolean;
    related_id?: string;
    type?: string;
};

// Data Fetching Functions

export const getDepartments = async (): Promise<Department[]> => {
    const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching departments:', error);
        return [];
    }
    return data || [];
};

export const getDoctors = async (): Promise<Doctor[]> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('*, departments(name)')
        .eq('is_active', true)
        .order('full_name');

    if (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
    return data || [];
};

export const getProcedures = async (): Promise<Procedure[]> => {
    const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching procedures:', error);
        return [];
    }
    return data || [];
};

export const getPatients = async (searchTerm?: string): Promise<Patient[]> => {
    let query = supabase.from('patients').select('*, doctors(full_name), patient_groups(name)').eq('is_active', true).order('created_at', { ascending: false });

    if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,identity_no.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching patients:', error);
        return [];
    }
    return data || [];
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deletePatient = async (id: string) => {
    // Soft delete usually, but here we might do hard delete or set is_active false
    // Based on getPatients filter eq('is_active', true), setting is_active=false is better.
    const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const getPatientByIdentityNo = async (identityNo: string): Promise<Patient | undefined> => {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('identity_no', identityNo)
        .single();

    if (error) return undefined;
    return data;
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return undefined;
    return data;
};

export const createPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient | null> => {
    const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<any> => {
    // 1. Check for Closures (Klinik veya Doktor kapalı mı?)
    if (appointmentData.appointment_date) {
        const { data: closures } = await supabase
            .from('closures')
            .select('*')
            .eq('closure_date', appointmentData.appointment_date)
            .eq('is_active', true);

        if (closures && closures.length > 0) {
            for (const closure of closures) {
                // Check coverage: Clinic-wide OR Specific Doctor
                const isClinicClosure = closure.target_type === 'clinic';
                const isDoctorClosure = closure.target_type === 'doctor' && closure.doctor_id === appointmentData.doctor_id;

                if (isClinicClosure || isDoctorClosure) {
                    // Full day closure (if start/end times are missing or empty)
                    if (!closure.start_time || !closure.end_time) {
                        throw new Error(`Seçilen tarihte ${isClinicClosure ? 'klinik' : 'seçilen doktor'} hizmet vermemektedir (Kapalı).`);
                    }

                    // Time range closure
                    if (appointmentData.appointment_time >= closure.start_time && appointmentData.appointment_time < closure.end_time) {
                        throw new Error(`Seçilen saat aralığında (${closure.start_time} - ${closure.end_time}) hizmet verilmemektedir.`);
                    }
                }
            }
        }
    }

    // 2. Check for existing appointment for the same doctor, date, and time
    // Only check if doctor_id, appointment_date, and appointment_time are present
    if (appointmentData.doctor_id && appointmentData.appointment_date && appointmentData.appointment_time) {
        const { data: existingApp, error: checkError } = await supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', appointmentData.doctor_id)
            .eq('appointment_date', appointmentData.appointment_date)
            .eq('appointment_time', appointmentData.appointment_time)
            .neq('status', 'İptal') // Ignore cancelled appointments
            .single();

        if (existingApp) {
            throw new Error('Bu doktora, seçilen tarih ve saatte zaten bir randevu mevcut.');
        }
    }

    const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

    if (error) {
        throw error;
    }

    // Automatically create notification
    try {
        // Fetch patient details for name
        const { data: patient } = await supabase
            .from('patients')
            .select('full_name')
            .eq('id', appointmentData.patient_id)
            .single();

        if (patient) {
            const message = `${patient.full_name}, ${appointmentData.appointment_date} tarihinde randevu oluşturdu`;
            await createNotification({
                message,
                link: '/admin/randevular',
                related_id: data.id,
                type: 'appointment'
            });
        }
    } catch (notifyError) {
        console.error('Notification creation failed:', notifyError);
    }

    return data;

};

// New functions for List Page
export const getAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (
                full_name,
                identity_no,
                phone
            ),
            doctors (
                full_name,
                title,
                color
            ),
            departments (
                name
            ),
            procedures (
                name
            )
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    return data || [];
};

export const getAppointmentsByPatientId = async (patientId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (
                full_name,
                identity_no,
                phone
            ),
            doctors (
                full_name,
                title,
                color
            ),
            departments (
                name
            ),
            procedures (
                name
            )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

    if (error) {
        console.error('Error fetching patient appointments:', error);
        return [];
    }
    return data || [];
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
};

export const deleteAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// CRUD Operations for Departments
export const createDepartment = async (name: string): Promise<Department | null> => {
    const { data, error } = await supabase
        .from('departments')
        .insert([{ name }])
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<Department | null> => {
    const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const deleteDepartment = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
    return true;
};

// CRUD Operations for Doctors
export const createDoctor = async (doctor: Omit<Doctor, 'id' | 'created_at'>): Promise<Doctor | null> => {
    const { data, error } = await supabase
        .from('doctors')
        .insert([doctor])
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const updateDoctor = async (id: string, updates: Partial<Doctor>): Promise<Doctor | null> => {
    const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const deleteDoctor = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
    return true;
};

// CRUD Operations for Patient Groups
export const getPatientGroups = async (): Promise<PatientGroup[]> => {
    const { data, error } = await supabase
        .from('patient_groups')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching patient groups:', error);
        return [];
    }
    return data || [];
};

export const createPatientGroup = async (name: string, description?: string): Promise<PatientGroup | null> => {
    const { data, error } = await supabase
        .from('patient_groups')
        .insert([{ name, description }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updatePatientGroup = async (id: string, updates: Partial<PatientGroup>) => {
    const { data, error } = await supabase
        .from('patient_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deletePatientGroup = async (id: string) => {
    const { error } = await supabase
        .from('patient_groups')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const addPatientToGroup = async (patientId: string, groupId: string | null) => {
    const { data, error } = await supabase
        .from('patients')
        .update({ group_id: groupId })
        .eq('id', patientId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Clinic Settings
export type ClinicSetting = {
    key: string;
    value: string;
};

export const getClinicSettings = async (): Promise<ClinicSetting[]> => {
    const { data, error } = await supabase
        .from('clinic_settings')
        .select('key, value');

    if (error) {
        console.error('Error fetching clinic settings:', error);
        return [];
    }
    return data || [];
};

export const updateClinicSetting = async (key: string, value: string) => {
    try {
        const { data, error } = await supabase
            .from('clinic_settings')
            .upsert({ key, value }, { onConflict: 'key' });

        if (error) {
            console.error(`Supabase upsert error for ${key}:`, error);
            throw error;
        }
        return data;
    } catch (err) {
        console.error('UpdateClinicSetting caught error:', err);
        throw err;
    }
};

// Closure (Kapatma) CRUD Operations
export const getClosures = async (): Promise<Closure[]> => {
    const { data, error } = await supabase
        .from('closures')
        .select(`
            *,
            doctors (
                full_name
            )
        `)
        .eq('is_active', true)
        .order('closure_date', { ascending: true });

    if (error) {
        console.error('Error fetching closures:', error);
        return [];
    }
    return data || [];
};

export const createClosure = async (closure: Omit<Closure, 'id' | 'created_at'>): Promise<Closure | null> => {
    const { data, error } = await supabase
        .from('closures')
        .insert([closure])
        .select(`
            *,
            doctors (
                full_name
            )
        `)
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const deleteClosure = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('closures')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
    return true;
};

// Storage & Document Operations

export type PatientDocument = {
    id: string;
    created_at: string;
    patient_id: string;
    file_path: string;
    file_name: string;
    file_type: 'anamnez' | 'onam' | 'ekbilgiler';
    content_type: string;
    file_size: number;
};

export const uploadPatientDocument = async (
    file: File,
    patientId: string,
    fileType: 'anamnez' | 'onam' | 'ekbilgiler'
) => {
    // 1. Dosyayı Storage'a yükle
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${fileType}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) throw uploadError;

    // 2. Veritabanına kaydet
    const { data, error: dbError } = await supabase
        .from('patient_documents')
        .insert([{
            patient_id: patientId,
            file_path: filePath,
            file_name: file.name,
            file_type: fileType,
            content_type: file.type,
            file_size: file.size
        }])
        .select()
        .single();

    if (dbError) throw dbError;
    return data;
};

export const uploadClinicLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const getPatientDocuments = async (patientId: string): Promise<PatientDocument[]> => {
    const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
    return data || [];
};

export const deletePatientDocument = async (documentId: string, filePath: string) => {
    // 1. Storage'dan sil
    const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([filePath]);

    if (storageError) {
        console.error('Storage silme hatası:', storageError);
    }

    // 2. Veritabanından sil
    const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', documentId);

    if (dbError) throw dbError;
    return true;
};

export const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
        .from('patient-documents')
        .getPublicUrl(filePath);
    return data.publicUrl;
};

// Notification System
export const getNotifications = async (): Promise<AppNotification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Last 20 notifications

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) {
        console.error('Error fetching notification count:', error);
        return 0;
    }
    return count || 0;
};

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error.message, error.details, error.hint, error.code);
        // Do not throw error here to avoid breaking main flow if notification fails (unless critical table missing)
    }
    return data;
};

export const markNotificationAsRead = async (id: string) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
};

export const markAllNotificationsAsRead = async () => {
    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .select();

    if (error) throw error;
    return data;
};

