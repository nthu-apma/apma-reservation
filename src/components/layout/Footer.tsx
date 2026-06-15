'use client'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const { lang } = useLanguage()

  return (
    <footer className="border-t bg-muted/30 py-6">
      <div className="container text-center">
        <p className="text-xs text-muted-foreground">
          {lang === 'zh'
            ? '如有實驗相關問題，請聯繫該設備/服務負責人。平台系統相關問題，請洽陳柏翰教授'
            : 'For experiment-related questions, please contact the responsible person for the equipment/service. For platform issues, please contact Prof. Po-Han Chen.'}
        </p>
      </div>
    </footer>
  )
}
