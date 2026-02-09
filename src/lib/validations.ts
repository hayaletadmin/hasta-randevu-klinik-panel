import { z } from "zod";

// TC Kimlik No Validation Logic
// TC Kimlik No Validation Logic
export const validateTC = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length === 0) return false;

    // Geçici olarak yazarken hata gösterme (1-10 hane arası)
    if (clean.length > 0 && clean.length < 11) {
        return clean[0] !== '0'; // Sadece 0 ile başlamadığından emin ol
    }

    if (clean.length !== 11) return false;
    if (clean[0] === '0') return false;

    const digits = clean.split('').map(Number);
    const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sumEven = digits[1] + digits[3] + digits[5] + digits[7];

    const tenthDigit = (((sumOdd * 7) - sumEven) % 10 + 10) % 10;
    const eleventhDigit = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;

    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
};

// Name Validation Logic
const nameRegex = /^(?!.*(.)\1\1)[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/; // Reject 3 consecutive chars

// Telefon Doğrulama Mantığı
export const validatePhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length === 0) return false;

    // 5 ile başlamalı kontrolü her zaman aktif (hatalı girişi anında yakala)
    if (clean.length > 0 && clean[0] !== '5') return false;

    // Yazarken (1-9 hane) hata gösterme, 5 ile başlıyorsa devam etsin
    if (clean.length > 0 && clean.length < 10) return true;

    // 10 hane olmalı (5xx xxx xx xx)
    if (clean.length !== 10) return false;

    // İlk 3 hane (Operatör öneki) kontrolü
    const prefix = parseInt(clean.substring(0, 3));
    const isValidPrefix =
        (prefix >= 501 && prefix <= 509) ||
        (prefix >= 530 && prefix <= 539) ||
        (prefix >= 540 && prefix <= 549) ||
        (prefix >= 550 && prefix <= 559);

    if (!isValidPrefix) return false;

    // Tekrarlayan rakam kontrolü (örn: 5555555555)
    if (/^(\d)\1{9}$/.test(clean)) return false;

    // Ardışık ikili tekrar kontrolü (örn: 5151515151)
    if (/^(\d\d)\1+$/.test(clean)) return false;

    // Çok fazla ardışık aynı rakam (örn: 5xx xxx 55 55 gibi gerçekçi olabilir ama xxxxx gibi fake engelleme)
    if (/(\d)\1{5,}/.test(clean)) return false;

    return true;
};

export const patientSchema = z.object({
    tcNumber: z.string()
        .min(1, "TC Kimlik No zorunludur")
        .refine(validateTC, {
            message: "Geçersiz TC Kimlik Numarası",
        }),
    firstName: z.string()
        .min(1, "Ad alanı zorunludur")
        .min(2, "Ad en az 2 karakter olmalıdır")
        .max(25, "Ad en fazla 25 karakter olmalıdır")
        .regex(nameRegex, "Geçersiz isim formatı (tekrarlayan karakterler)"),
    lastName: z.string()
        .min(1, "Soyad alanı zorunludur")
        .min(2, "Soyad en az 2 karakter olmalıdır")
        .max(25, "Soyad en fazla 25 karakter olmalıdır")
        .regex(nameRegex, "Geçersiz soyad formatı"),
    phone: z.string()
        .min(1, "Telefon numarası zorunludur")
        .refine(validatePhone, {
            message: "Lütfen geçerli bir telefon numarası giriniz (5xx xxx xx xx)",
        }),
}).superRefine((data, ctx) => {
    if (data.firstName && data.lastName && data.firstName.trim().toLowerCase() === data.lastName.trim().toLowerCase()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ad ve soyad aynı olamaz",
            path: ["lastName"],
        });
    }
});

export type PatientSchemaType = z.infer<typeof patientSchema>;
