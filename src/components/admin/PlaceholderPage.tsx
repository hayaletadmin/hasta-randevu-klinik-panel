"use client"

import React from 'react';

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🏗️</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Bu Sayfa Yapım Aşamasında</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">
                    {title} sayfası için çalışmalarımız devam ediyor. Yakında tüm fonksiyonları ile burada olacak.
                </p>
            </div>
        </div>
    );
}
