'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { type Language, translations, type Translations } from '@/lib/i18n'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  setLang: () => {},
  t: translations.zh,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Language | null
    if (stored === 'zh' || stored === 'en') setLangState(stored)
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
