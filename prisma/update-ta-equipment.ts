import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const notices = `【系統規格限制】
• 激發（Pump）波長：450–980 nm
• 探測（Probe）波長：550–1450 nm（注意：近 1000 nm 訊號品質較差）
• 時間延遲範圍：最大至 2 ns
⚠️ 高激發功率可能損壞樣品或比色管，請謹慎評估所需功率。

【量測前須知 — 請務必完成以下三個步驟】
1. 初次討論（Initial Meeting）：來信預約與量測團隊進行事前討論，確認所有實驗參數，包含激發與探測波長、時間範圍、樣品狀態等。
2. 試量測（Trial Measurement）：以樣品進行初步測試，確認訊號品質與實驗條件。
3. 量測後討論（Post-Measurement Review）：確認結果是否符合預期，討論後續發表計畫與貢獻認定。

未完成上述步驟而直接進行量測，可能導致量測無效或需要重複實驗，請務必事先安排。`

const noticesEn = `[System Specifications]
• Pump wavelength: 450–980 nm
• Probe wavelength: 550–1450 nm (note: signal quality degraded near 1000 nm)
• Time delay range: up to 2 ns
⚠️ Increased pump power may damage your sample or cuvette. Assess the required power carefully.

[Pre-Measurement Requirements — Three Mandatory Stages]
1. Initial Meeting: Contact us to schedule a pre-experiment discussion to confirm all measurement parameters: pump/probe wavelengths, time scan range, sample conditions, etc.
2. Trial Measurement: Conduct a preliminary test to verify signal quality and experimental conditions.
3. Post-Measurement Review: Evaluate whether results meet expectations; discuss publication plans and credit attribution.

Proceeding without completing these stages may result in invalid measurements or repeated experiments.`

const formFields = [
  {
    id: 'supervisor',
    label: '指導老師',
    labelEn: 'Supervisor',
    type: 'text',
    required: true,
    placeholder: '例：王小明教授',
    placeholderEn: 'e.g., Prof. Wang',
  },
  {
    id: 'institution',
    label: '所屬單位/學校',
    labelEn: 'Institution / School',
    type: 'text',
    required: true,
    placeholder: '例：國立清華大學光電工程研究所',
    placeholderEn: 'e.g., Institute of Photonics Technologies, NTHU',
  },
  {
    id: 'sample_name',
    label: '樣品名稱 (僅作為平台建檔用途)',
    labelEn: 'Sample Name (for record-keeping only)',
    type: 'text',
    required: true,
    placeholder: '例:PVSK QD',
    placeholderEn: 'e.g., PVSK QD',
  },
  {
    id: 'sample_state',
    label: '樣品狀態',
    labelEn: 'Sample State',
    type: 'select',
    required: true,
    options: ['溶液 (Solution)', '薄膜 (Thin Film)', '固態粉末 (Solid Powder)', '其他 (Other)'],
    optionsEn: ['Solution', 'Thin Film', 'Solid Powder', 'Other'],
    hint: '請選擇樣品的物理狀態',
    hintEn: 'Select the physical state of your sample',
  },
  {
    id: 'sample_state_other',
    label: '其他樣品狀態說明',
    labelEn: 'Other Sample State Description',
    type: 'textarea',
    required: true,
    placeholder: '請描述您的樣品狀態',
    placeholderEn: 'Please describe your sample state',
    conditionalOn: 'sample_state',
    conditionalValue: '其他 (Other)',
  },
  {
    id: 'sample_details',
    label: '樣品詳細資訊',
    labelEn: 'Sample Details',
    type: 'textarea',
    required: true,
    placeholder: '溶液樣品：濃度、溶劑（建議 OD ≈ 0.3）\n薄膜樣品：膜厚、量測環境（氮氣 / 真空 / 密封）、是否需要溫控、是否需要避免氧氣或水氣',
    placeholderEn: 'Solution: concentration, solvent (recommended OD ≈ 0.3)\nThin film: thickness, environment (N2 / vacuum / sealed), temperature control, O2/moisture sensitivity',
    hint: '溶液建議 OD 約 0.3（約 50% 吸收），過高的 OD 可能導致訊號品質下降',
    hintEn: 'For solutions, recommended OD ≈ 0.3 (~50% absorption). Higher OD may degrade signal quality.',
  },
  {
    id: 'absorption_desc',
    label: '樣品吸收光譜描述',
    labelEn: 'Sample Absorption Spectrum Description',
    type: 'textarea',
    required: true,
    placeholder: '例：主吸收峰在 530 nm，吸收範圍約 400–650 nm\n選擇此激發波長的原因：對應樣品的主要吸收區間',
    placeholderEn: 'e.g., Main absorption peak at 530 nm, absorption range 400–650 nm\nReasoning for pump wavelength: targets the main absorption band',
    hint: '用以確認激發波長是否在系統範圍內（Pump：450–980 nm），請同時說明選擇波長的原因',
    hintEn: 'Used to verify pump wavelength compatibility (Pump: 450–980 nm). Also explain your reasoning for the selected wavelength.',
  },
  {
    id: 'absorption_spectrum_url',
    label: '吸收光譜圖—文獻連結（選填）',
    labelEn: 'Absorption Spectrum — Literature Link (optional)',
    type: 'url',
    required: false,
    placeholder: 'https://doi.org/...',
    placeholderEn: 'https://doi.org/...',
    hint: '可提供文獻 DOI 或任何公開可存取的光譜圖連結',
    hintEn: 'Provide a DOI or any publicly accessible link to the absorption spectrum',
  },
  {
    id: 'absorption_spectrum_image',
    label: '吸收光譜圖—上傳圖片（選填）',
    labelEn: 'Absorption Spectrum — Upload Image (optional)',
    type: 'file',
    required: false,
    hint: '支援 JPG、PNG、WebP、PDF，最大 10 MB',
    hintEn: 'Supports JPG, PNG, WebP, PDF, max 10 MB',
  },
  {
    id: 'emission_desc',
    label: '探測頻譜範圍',
    labelEn: 'Probe Wavelength Range',
    type: 'textarea',
    required: true,
    placeholder: '例：放光峰約 650 nm，希望探測範圍涵蓋 550–900 nm\n或：對 750–1200 nm 的激發態吸收有興趣',
    placeholderEn: 'e.g., Emission peak ~650 nm, target probe range 550–900 nm\nor: interested in excited-state absorption at 750–1200 nm',
    hint: '用以確認探測範圍是否在系統範圍內（Probe：550–1450 nm，近 1000 nm 訊號品質較差）',
    hintEn: 'Used to verify probe compatibility (Probe: 550–1450 nm; note: quality degraded near 1000 nm)',
  },
  {
    id: 'pump_wavelength',
    label: '激發方式',
    labelEn: 'Pump Mode',
    type: 'select',
    required: true,
    options: ['550 - 980 nm 全激發', '特定波長激發'],
    optionsEn: ['Full range 550–980 nm', 'Specific wavelength'],
    hint: '選擇全激發或指定特定波長（系統範圍：450–980 nm）',
    hintEn: 'Choose full-range or specify a particular pump wavelength (system range: 450–980 nm)',
  },
  {
    id: 'pump_center_wavelength',
    label: '中心波長 (nm)',
    labelEn: 'Center Wavelength (nm)',
    type: 'text',
    required: true,
    placeholder: '例：530',
    placeholderEn: 'e.g., 530',
    hint: '系統範圍：450–980 nm',
    hintEn: 'System range: 450–980 nm',
    conditionalOn: 'pump_wavelength',
    conditionalValue: '特定波長激發',
  },
  {
    id: 'pump_bandwidth',
    label: '頻寬 (nm)',
    labelEn: 'Bandwidth (nm)',
    type: 'text',
    required: true,
    placeholder: '例：10',
    placeholderEn: 'e.g., 10',
    hint: '不得小於 xx nm（待確認）',
    hintEn: 'Must be no less than xx nm (to be confirmed)',
    conditionalOn: 'pump_wavelength',
    conditionalValue: '特定波長激發',
  },
  {
    id: 'probe_wavelength',
    label: '探測波長範圍 (nm)',
    labelEn: 'Probe Wavelength Range (nm)',
    type: 'text',
    required: true,
    placeholder: '例：550–1000（系統範圍：550–1450 nm）',
    placeholderEn: 'e.g., 550–1000 (system range: 550–1450 nm)',
    hint: '如需 NIR（> 1000 nm）探測，無需脈衝壓縮，時間解析度為 ~ps 等級',
    hintEn: 'For NIR probe (>1000 nm): no pulse compression needed, time resolution ~ps',
  },
  {
    id: 'polarization',
    label: 'Pump-Probe 偏振設定',
    labelEn: 'Pump-Probe Polarization',
    type: 'select',
    required: true,
    options: ['平行 (Parallel)', '垂直 (Perpendicular)', '魔角 (Magic Angle, 54.7°)', '無特殊要求'],
    optionsEn: ['Parallel', 'Perpendicular', 'Magic Angle (54.7°)', 'No preference'],
    hint: '若需排除轉動動力學效應，建議使用魔角（54.7°）',
    hintEn: 'To eliminate rotational dynamics contributions, use magic angle (54.7°)',
  },
  {
    id: 'power_dependency',
    label: '是否需要激發強度相關實驗（Power Dependency）',
    labelEn: 'Power Dependency Study Required?',
    type: 'select',
    required: true,
    options: ['不需要（訊號保持在線性響應區域即可）', '需要（量測多個激發強度下的 ΔT/T）'],
    optionsEn: ['No (keep signal in linear regime)', 'Yes (measure ΔT/T at multiple pump powers)'],
    hint: '薄膜或奈米粒子樣品在高激發強度下可能發生 singlet-singlet annihilation，影響動力學量測',
    hintEn: 'For thin films or nanoparticles, high fluence may cause singlet–singlet annihilation, obscuring intrinsic dynamics',
  },
  {
    id: 'time_range',
    label: '時間掃描範圍',
    labelEn: 'Time Scan Range',
    type: 'select',
    required: true,
    options: ['~1 ps（觀察超快初始動態）', '~10 ps', '~100 ps', '~1 ns（觀察長時間衰退）', '~2 ns（系統最大範圍）', '需與量測團隊討論'],
    optionsEn: ['~1 ps (ultrafast initial dynamics)', '~10 ps', '~100 ps', '~1 ns (long-lived dynamics)', '~2 ns (system maximum)', 'To be discussed with the team'],
    hint: '系統最大時間延遲為 2 ns',
    hintEn: 'System maximum time delay: 2 ns',
  },
  {
    id: 'special_requirements',
    label: '特殊需求或備注',
    labelEn: 'Special Requirements or Notes',
    type: 'textarea',
    required: false,
    placeholder: '如有其他特殊實驗需求、樣品安全注意事項（例：需要氮氣保護、避光操作等），請在此說明',
    placeholderEn: 'Any special requirements, sample safety notes (e.g., N2 protection, light sensitivity), etc.',
  },
]

async function main() {
  const equipment = await prisma.equipment.findFirst({
    where: { name: '瞬態吸收光譜量測平台' },
  })

  if (!equipment) {
    console.log('❌ Equipment not found. Make sure the seed has been run first.')
    return
  }

  await prisma.equipment.update({
    where: { id: equipment.id },
    data: {
      notices,
      noticesEn,
      formFields,
    },
  })

  console.log('✅ TA equipment updated with conditional form fields.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
