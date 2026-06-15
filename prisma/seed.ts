import { PrismaClient, Role, EquipmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com'
  const adminName = process.env.INITIAL_ADMIN_NAME || '系統管理員'
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashed,
        role: Role.ADMIN,
      },
    })
    console.log(`✅ Admin created: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`)
  }

  const equipmentCount = await prisma.equipment.count()
  if (equipmentCount === 0) {
    await prisma.equipment.create({
      data: {
        name: '瞬態吸收光譜量測平台',
        nameEn: 'Transient Absorption Spectroscopy Platform',
        description: '提供飛秒至微秒時間尺度的瞬態吸收光譜量測服務，可量測光激發後材料的激發態動力學。',
        descriptionEn:
          'Provides femtosecond to microsecond transient absorption spectroscopy measurements for excited-state dynamics of photoexcited materials.',
        notices:
          '1. 請於預約前確認樣品濃度與溶劑相容性\n2. 樣品需提前 24 小時告知\n3. 量測時間以 3 小時為單位\n4. 請攜帶研究計畫書或指導教授同意書',
        noticesEn:
          '1. Please confirm sample concentration and solvent compatibility before booking\n2. Notify 24 hours in advance about samples\n3. Measurement time in 3-hour units\n4. Please bring research proposal or advisor approval',
        category: '光譜量測',
        status: EquipmentStatus.ACTIVE,
        order: 1,
        formFields: [
          {
            id: 'sample_name',
            label: '樣品名稱',
            labelEn: 'Sample Name',
            type: 'text',
            required: true,
            placeholder: '例：有機染料分子 BDPF',
            placeholderEn: 'e.g., Organic dye BDPF',
          },
          {
            id: 'concentration',
            label: '樣品濃度',
            labelEn: 'Sample Concentration',
            type: 'text',
            required: true,
            placeholder: '例：10 μM in THF',
            placeholderEn: 'e.g., 10 μM in THF',
          },
          {
            id: 'solvent',
            label: '溶劑',
            labelEn: 'Solvent',
            type: 'text',
            required: true,
            placeholder: '例：THF、DCM、乙腈',
            placeholderEn: 'e.g., THF, DCM, Acetonitrile',
          },
          {
            id: 'excitation_wavelength',
            label: '激發波長 (nm)',
            labelEn: 'Excitation Wavelength (nm)',
            type: 'text',
            required: true,
            placeholder: '例：400 或 520',
            placeholderEn: 'e.g., 400 or 520',
          },
          {
            id: 'detection_range',
            label: '探測波長範圍 (nm)',
            labelEn: 'Detection Wavelength Range (nm)',
            type: 'text',
            required: true,
            placeholder: '例：450-750',
            placeholderEn: 'e.g., 450-750',
          },
          {
            id: 'time_range',
            label: '時間範圍',
            labelEn: 'Time Range',
            type: 'select',
            required: true,
            options: ['飛秒 (fs)', '皮秒 (ps)', '奈秒 (ns)', '微秒 (μs)'],
            optionsEn: ['Femtosecond (fs)', 'Picosecond (ps)', 'Nanosecond (ns)', 'Microsecond (μs)'],
          },
          {
            id: 'institution',
            label: '所屬單位/學校',
            labelEn: 'Institution / School',
            type: 'text',
            required: true,
            placeholder: '例：國立清華大學化學系',
            placeholderEn: 'e.g., Dept. of Chemistry, NTHU',
          },
          {
            id: 'project',
            label: '計畫名稱或編號',
            labelEn: 'Project Name or Number',
            type: 'text',
            required: false,
            placeholder: '選填',
            placeholderEn: 'Optional',
          },
          {
            id: 'special_requirements',
            label: '特殊需求或備注',
            labelEn: 'Special Requirements or Notes',
            type: 'textarea',
            required: false,
            placeholder: '如有特殊實驗需求，請在此說明',
            placeholderEn: 'Please describe any special experimental requirements',
          },
        ],
      },
    })
    console.log('✅ Sample equipment created')
  }

  const labCount = await prisma.lab.count()
  if (labCount === 0) {
    await prisma.lab.create({
      data: {
        name: '光電化學實驗室',
        nameEn: 'Photoelectrochemistry Lab',
        description: '研究光電化學材料與太陽能轉換',
        order: 1,
        active: true,
      },
    })
    console.log('✅ Sample lab created')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
