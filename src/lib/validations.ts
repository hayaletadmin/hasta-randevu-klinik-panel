import { z } from "zod";

// TC Kimlik No Validation Logic
export const validateTC = (value: string) => {
    if (!/^[0-9]{11}$/.test(value)) return false;
    if (value[0] === '0') return false;

    const digits = value.split('').map(Number);
    const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sumEven = digits[1] + digits[3] + digits[5] + digits[7];

    const tenthDigit = (((sumOdd * 7) - sumEven) % 10 + 10) % 10;
    const eleventhDigit = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;

    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
};

// Name Validation Logic
const nameRegex = /^(?!.*(.)\1\1)[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/; // Reject 3 consecutive chars

export const patientSchema = z.object({
    tcNumber: z.string().refine(validateTC, {
        message: "Geçersiz TC Kimlik Numarası",
    }),
    firstName: z.string()
        .min(2, "Ad en az 2 karakter olmalıdır")
        .regex(nameRegex, "Geçersiz isim formatı (tekrarlayan karakterler)"),
    lastName: z.string()
        .min(2, "Soyad en az 2 karakter olmalıdır")
        .regex(nameRegex, "Geçersiz soyad formatı"),
    phone: z.string()
        .regex(/^5[0-9]{9}$/, "Telefon numarası 5 ile başlamalı ve 10 haneli olmalıdır (Örn: 5xx...)"),
});

export type PatientSchemaType = z.infer<typeof patientSchema>;
