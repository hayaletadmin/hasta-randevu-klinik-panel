"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PatientSchemaType, patientSchema } from "@/lib/validations"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"

interface StepPatientInfoProps {
    onComplete: (data: PatientSchemaType) => void;
    initialData?: PatientSchemaType;
}

export function StepPatientInfo({ onComplete, initialData }: StepPatientInfoProps) {
    const form = useForm<PatientSchemaType>({
        resolver: zodResolver(patientSchema),
        defaultValues: initialData || {
            tcNumber: "",
            firstName: "",
            lastName: "",
            phone: "",
        },
    })

    function onSubmit(values: PatientSchemaType) {
        onComplete(values)
    }

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-teal-700 mb-6 font-primary">Hasta Bilgileri</h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="tcNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">TC Kimlik No *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="11 haneli TC Kimlik Numaranız"
                                            maxLength={11}
                                            className="h-11 bg-white border-gray-300 focus-visible:ring-teal-500"
                                            {...field}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                field.onChange(val);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Ad *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Adınız"
                                                className="h-11 bg-white border-gray-300 focus-visible:ring-teal-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Soyad *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Soyadınız"
                                                className="h-11 bg-white border-gray-300 focus-visible:ring-teal-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Telefon Numaranız *</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center">
                                            <div className="bg-gray-100 border border-r-0 border-gray-300 h-11 px-3 rounded-l-md flex items-center justify-center text-gray-600 font-medium min-w-14">
                                                +90
                                            </div>
                                            <Input
                                                placeholder="5xx xxx xx xx"
                                                className="h-11 rounded-l-none bg-white border-gray-300 focus-visible:ring-teal-500"
                                                maxLength={10}
                                                {...field}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    field.onChange(val);
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-8 rounded-lg">
                                Devam Et →
                            </Button>
                        </div>

                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
