import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM || '清華大學研究聯盟預約系統 <noreply@example.com>'

export async function sendReservationSubmitted(to: string, data: {
  userName: string
  equipmentName: string
  date: string
  timeSlot: string
  reservationId: string
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【預約申請已送出】${data.equipmentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">預約申請已送出</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>您的預約申請已成功送出，請等待管理員審核。</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">設備</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.equipmentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">日期</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">時段</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.timeSlot}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">預約編號</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.reservationId}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">清華大學研究聯盟預約系統</p>
      </div>
    `,
  })
}

export async function sendReservationConfirmed(to: string, data: {
  userName: string
  equipmentName: string
  date: string
  timeSlot: string
  adminNote?: string
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【預約已確認】${data.equipmentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">預約已確認 ✓</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>您的預約已通過審核確認。</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">設備</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.equipmentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">日期</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">時段</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.timeSlot}</td></tr>
        </table>
        ${data.adminNote ? `<p><strong>管理員備注：</strong>${data.adminNote}</p>` : ''}
        <p style="color: #6b7280; font-size: 14px;">清華大學研究聯盟預約系統</p>
      </div>
    `,
  })
}

export async function sendReservationRejected(to: string, data: {
  userName: string
  equipmentName: string
  date: string
  adminNote?: string
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【預約未通過】${data.equipmentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">預約未通過審核</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>很遺憾，您的預約申請未通過審核。</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">設備</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.equipmentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">日期</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.date}</td></tr>
        </table>
        ${data.adminNote ? `<p><strong>原因：</strong>${data.adminNote}</p>` : ''}
        <p>如有疑問，請聯繫管理員。</p>
        <p style="color: #6b7280; font-size: 14px;">清華大學研究聯盟預約系統</p>
      </div>
    `,
  })
}

export async function sendPasswordReset(to: string, data: {
  userName: string
  resetUrl: string
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: '【重設密碼】清華大學研究聯盟預約系統',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">重設您的密碼</h2>
        <p>親愛的 ${data.userName}，</p>
        <p>我們收到您的密碼重設請求。請點擊下方按鈕設定新密碼：</p>
        <div style="margin: 30px 0;">
          <a href="${data.resetUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">重設密碼</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">此連結將在 <strong>1 小時</strong>後失效。</p>
        <p style="color: #6b7280; font-size: 14px;">如果您未要求重設密碼，請忽略此封郵件，您的密碼不會有任何更改。</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">清華大學研究聯盟預約系統</p>
      </div>
    `,
  })
}

export async function sendAdminNewReservation(to: string, data: {
  userName: string
  userEmail: string
  equipmentName: string
  date: string
  timeSlot: string
  reservationId: string
  appUrl: string
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `【新預約申請】${data.equipmentName} - ${data.userName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">新的預約申請待審核</h2>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">申請人</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.userName} (${data.userEmail})</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">設備</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.equipmentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">日期</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">時段</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${data.timeSlot}</td></tr>
        </table>
        <a href="${data.appUrl}/admin/reservations" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">前往審核</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">清華大學研究聯盟預約系統</p>
      </div>
    `,
  })
}
