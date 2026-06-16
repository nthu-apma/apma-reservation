import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const FROM = process.env.EMAIL_FROM || '前瞻光電技術與材料聯盟服務預約系統 <noreply@example.com>'

export async function sendConsultationSubmitted(to: string, data: {
  userName: string; equipmentName: string; reservationId: string
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `【諮詢申請已送出】${data.equipmentName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">諮詢申請已送出</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>您的諮詢申請已成功送出，設備管理員將盡快與您聯繫，請等待審核結果。</p>
        <table style="border-collapse:collapse;width:100%;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">設備/服務</td><td style="padding:8px;border:1px solid #e5e7eb">${data.equipmentName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">申請編號</td><td style="padding:8px;border:1px solid #e5e7eb">${data.reservationId}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px">前瞻光電技術與材料聯盟服務預約系統</p>
      </div>`,
  })
}

export async function sendConsultationConfirmed(to: string, data: {
  userName: string; equipmentName: string; adminNote?: string
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `【諮詢申請已確認】${data.equipmentName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">諮詢申請已確認 ✓</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>您針對「${data.equipmentName}」的諮詢申請已通過確認，設備管理員將直接與您聯繫，安排量測時間。</p>
        ${data.adminNote ? `<p><strong>管理員備注：</strong>${data.adminNote}</p>` : ''}
        <p style="color:#6b7280;font-size:14px">前瞻光電技術與材料聯盟服務預約系統</p>
      </div>`,
  })
}

export async function sendConsultationRejected(to: string, data: {
  userName: string; equipmentName: string; adminNote?: string
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `【諮詢申請未通過】${data.equipmentName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">諮詢申請未通過</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>很遺憾，您針對「${data.equipmentName}」的諮詢申請未通過審核。</p>
        ${data.adminNote ? `<p><strong>原因：</strong>${data.adminNote}</p>` : ''}
        <p>如有疑問，請直接聯繫設備管理員。</p>
        <p style="color:#6b7280;font-size:14px">前瞻光電技術與材料聯盟服務預約系統</p>
      </div>`,
  })
}

export async function sendAdminNewConsultation(to: string, data: {
  userName: string; userEmail: string; equipmentName: string; reservationId: string; appUrl: string
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `【新諮詢申請】${data.equipmentName} - ${data.userName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">新的諮詢申請待審核</h2>
        <table style="border-collapse:collapse;width:100%;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">申請人</td><td style="padding:8px;border:1px solid #e5e7eb">${data.userName} (${data.userEmail})</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">設備/服務</td><td style="padding:8px;border:1px solid #e5e7eb">${data.equipmentName}</td></tr>
        </table>
        <a href="${data.appUrl}/admin/reservations" style="display:inline-block;background:#7c3aed;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">前往審核</a>
        <p style="color:#6b7280;font-size:14px;margin-top:20px">前瞻光電技術與材料聯盟服務預約系統</p>
      </div>`,
  })
}

export async function sendPasswordReset(to: string, data: { userName: string; resetUrl: string }) {
  await transporter.sendMail({
    from: FROM, to,
    subject: '【重設密碼】前瞻光電技術與材料聯盟服務預約系統',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">重設您的密碼</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>我們收到您的密碼重設請求。請點擊下方按鈕設定新密碼：</p>
        <div style="margin:30px 0">
          <a href="${data.resetUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:16px">重設密碼</a>
        </div>
        <p style="color:#6b7280;font-size:14px">此連結將在 <strong>1 小時</strong>後失效。</p>
        <p style="color:#9ca3af;font-size:12px">前瞻光電技術與材料聯盟服務預約系統</p>
      </div>`,
  })
}
