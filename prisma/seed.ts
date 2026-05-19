/**
 * Prisma Seeder — Master Data Klinis
 *
 * Run: npm run db:seed
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Diagnosa ───────────────────────────────────────────────────────────────
const diagnosesRaw = [
  { code: 'A09.9', name: 'Gastroenteritis and colitis of unspecified origin', description: 'Diare akut/dehidrasi; pathway rehidrasi, elektrolit, evaluasi infeksi.', tags: ['infeksi', 'gastrointestinal', 'diare', 'dehidrasi', 'igd'] },
  { code: 'A15.0', name: 'Tuberculosis of lung, confirmed by sputum microscopy', description: 'TB paru terkonfirmasi bakteriologis; pathway OAT, isolasi, pemantauan efek samping.', tags: ['infeksi', 'paru', 'tb', 'oat', 'menular'] },
  { code: 'A41.9', name: 'Sepsis, unspecified organism', description: 'Sepsis dengan fokus belum pasti; pathway bundle sepsis, kultur, antibiotik empiris.', tags: ['infeksi', 'sepsis', 'igd', 'kritis', 'antibiotik'] },
  { code: 'A91', name: 'Dengue haemorrhagic fever', description: 'DBD klasik; pathway monitoring hematokrit/trombosit, cairan, tanda syok.', tags: ['infeksi', 'dengue', 'anak', 'dewasa', 'trombositopenia'] },
  { code: 'A97.0', name: 'Dengue without warning signs', description: 'Dengue tanpa tanda bahaya; pathway rawat jalan/observasi dan edukasi warning signs.', tags: ['infeksi', 'dengue', 'rawat-jalan'] },
  { code: 'A97.1', name: 'Dengue with warning signs', description: 'Dengue dengan tanda bahaya; pathway rawat inap dan pemantauan cairan ketat.', tags: ['infeksi', 'dengue', 'rawat-inap', 'warning-signs'] },
  { code: 'A97.2', name: 'Severe dengue', description: 'Dengue berat/DSS; pathway resusitasi cairan, monitoring intensif.', tags: ['infeksi', 'dengue', 'syok', 'icu'] },
  { code: 'B20', name: 'HIV disease resulting in infectious and parasitic diseases', description: 'HIV dengan infeksi oportunistik; pathway ART, profilaksis, skrining TB.', tags: ['infeksi', 'hiv', 'imunologi'] },
  { code: 'E10.1', name: 'Type 1 diabetes mellitus with ketoacidosis', description: 'DKA; pathway cairan, insulin drip, koreksi elektrolit, monitoring keton.', tags: ['endokrin', 'diabetes', 'dka', 'igd'] },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', description: 'DM tipe 2 tanpa komplikasi akut; pathway edukasi, OAD/insulin, kontrol metabolik.', tags: ['endokrin', 'diabetes', 'kronis'] },
  { code: 'E11.65', name: 'Type 2 diabetes mellitus with hyperglycaemia', description: 'Hiperglikemia pada DM2; pathway koreksi gula darah dan evaluasi komorbid.', tags: ['endokrin', 'diabetes', 'hiperglikemia'] },
  { code: 'E86', name: 'Volume depletion', description: 'Dehidrasi ringan-sedang-berat; pathway rehidrasi oral/IV dan evaluasi penyebab.', tags: ['cairan', 'dehidrasi', 'igd'] },
  { code: 'G40.9', name: 'Epilepsy, unspecified', description: 'Kejang/epilepsi; pathway kontrol kejang, antikonvulsan, evaluasi neurologis.', tags: ['saraf', 'kejang', 'neurologi'] },
  { code: 'I10', name: 'Essential (primary) hypertension', description: 'Hipertensi esensial; pathway stratifikasi risiko, terapi antihipertensi, edukasi.', tags: ['kardiovaskular', 'hipertensi', 'kronis'] },
  { code: 'I20.0', name: 'Unstable angina', description: 'Angina tidak stabil; pathway ACS, EKG serial, troponin, antiplatelet.', tags: ['jantung', 'acs', 'igd'] },
  { code: 'I21.9', name: 'Acute myocardial infarction, unspecified', description: 'Infark miokard akut; pathway reperfusi, antiplatelet, antikoagulan, ICU.', tags: ['jantung', 'ami', 'stemi', 'nstemi', 'kritis'] },
  { code: 'I50.9', name: 'Heart failure, unspecified', description: 'Gagal jantung akut/kronik; pathway diuretik, oksigen, evaluasi overload.', tags: ['jantung', 'gagal-jantung', 'rawat-inap'] },
  { code: 'I63.9', name: 'Cerebral infarction, unspecified', description: 'Stroke iskemik; pathway CT kepala, reperfusi bila eligible, rehabilitasi dini.', tags: ['saraf', 'stroke', 'neurologi', 'igd'] },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified', description: 'ISPA atas; pathway simtomatik, edukasi, hindari antibiotik tidak perlu.', tags: ['infeksi', 'respirasi', 'rawat-jalan'] },
  { code: 'J18.9', name: 'Pneumonia, unspecified organism', description: 'Community/hospital acquired pneumonia; pathway antibiotik empiris, oksigen, foto toraks.', tags: ['infeksi', 'paru', 'pneumonia', 'rawat-inap'] },
  { code: 'J44.1', name: 'Chronic obstructive pulmonary disease with acute exacerbation', description: 'Eksaserbasi PPOK; pathway bronkodilator, steroid, antibiotik selektif, oksigen target.', tags: ['paru', 'ppok', 'eksaserbasi'] },
  { code: 'J45.9', name: 'Asthma, unspecified', description: 'Asma akut/kronik; pathway bronkodilator inhalasi, steroid, edukasi inhaler.', tags: ['paru', 'asma', 'igd', 'nebulisasi'] },
  { code: 'K25.0', name: 'Gastric ulcer, acute with haemorrhage', description: 'Ulkus gaster dengan perdarahan; pathway PPI, endoskopi, transfusi selektif.', tags: ['gastrointestinal', 'perdarahan', 'endoskopi'] },
  { code: 'K29.7', name: 'Gastritis, unspecified', description: 'Gastritis/dispepsia; pathway PPI, eradikasi H. pylori bila indikasi.', tags: ['gastrointestinal', 'dispepsia', 'rawat-jalan'] },
  { code: 'K35.8', name: 'Acute appendicitis, other and unspecified', description: 'Apendisitis akut; pathway evaluasi bedah, antibiotik profilaksis, appendectomy.', tags: ['bedah', 'abdomen', 'igd', 'appendectomy'] },
  { code: 'K80.2', name: 'Calculus of gallbladder without cholecystitis', description: 'Kolelitiasis simptomatik; pathway analgesia, USG, rencana kolesistektomi.', tags: ['bedah', 'hepatobilier', 'usg'] },
  { code: 'N17.9', name: 'Acute kidney failure, unspecified', description: 'AKI; pathway koreksi cairan/elektrolit, hindari nefrotoksik, indikasi dialisis.', tags: ['ginjal', 'aki', 'elektrolit'] },
  { code: 'N39.0', name: 'Urinary tract infection, site not specified', description: 'ISK bawah/atas; pathway urinalisis, antibiotik sesuai risiko, kultur bila indikasi.', tags: ['infeksi', 'urologi', 'antibiotik'] },
  { code: 'O80.0', name: 'Spontaneous vertex delivery', description: 'Persalinan normal; pathway partograf, manajemen aktif kala III, observasi nifas.', tags: ['obgyn', 'persalinan', 'maternal'] },
  { code: 'O82.9', name: 'Delivery by caesarean section, unspecified', description: 'Sectio caesarea; pathway praoperatif, antibiotik profilaksis, ERACS selektif.', tags: ['obgyn', 'bedah', 'sectio'] },
  { code: 'P07.3', name: 'Other preterm infants', description: 'Bayi prematur; pathway termoregulasi, nutrisi, skrining komplikasi neonatal.', tags: ['neonatus', 'anak', 'nicu'] },
  { code: 'R10.4', name: 'Other and unspecified abdominal pain', description: 'Nyeri abdomen nonspesifik; pathway triase red flag, lab/imaging sesuai indikasi.', tags: ['gejala', 'abdomen', 'igd'] },
  { code: 'S06.0', name: 'Concussion', description: 'Cedera kepala ringan; pathway observasi neurologis, CT bila red flag.', tags: ['trauma', 'saraf', 'igd'] },
  { code: 'S72.0', name: 'Fracture of neck of femur', description: 'Fraktur collum femur; pathway analgesia, imobilisasi, operasi ortopedi.', tags: ['ortopedi', 'fraktur', 'bedah'] },
  { code: 'U07.1', name: 'COVID-19, virus identified', description: 'COVID-19 terkonfirmasi; pathway isolasi, stratifikasi derajat, antivirus/steroid sesuai indikasi.', tags: ['infeksi', 'covid', 'respirasi', 'isolasi'] },
]

const commonDiagnosisReferences = `
B00.9|Herpesviral infection, unspecified|infeksi,virus,kulit
B02.9|Zoster without complication|infeksi,virus,nyeri-neuropatik
B18.1|Chronic viral hepatitis B without delta-agent|hepatologi,infeksi,kronis
B18.2|Chronic viral hepatitis C|hepatologi,infeksi,antivirus
B24|Unspecified human immunodeficiency virus disease|hiv,infeksi,program
C50.9|Malignant neoplasm of breast, unspecified|onkologi,bedah,wanita
C53.9|Malignant neoplasm of cervix uteri, unspecified|onkologi,obgyn
C61|Malignant neoplasm of prostate|onkologi,urologi
D50.9|Iron deficiency anaemia, unspecified|hematologi,anemia,gizi
D64.9|Anaemia, unspecified|hematologi,anemia
E03.9|Hypothyroidism, unspecified|endokrin,tiroid
E05.9|Thyrotoxicosis, unspecified|endokrin,tiroid
E66.9|Obesity, unspecified|metabolik,gizi,kronis
E78.5|Hyperlipidaemia, unspecified|metabolik,kardiovaskular
F32.9|Depressive episode, unspecified|psikiatri,kesehatan-mental
F41.9|Anxiety disorder, unspecified|psikiatri,rawat-jalan
G43.9|Migraine, unspecified|neurologi,nyeri-kepala
G45.9|Transient cerebral ischaemic attack, unspecified|neurologi,stroke,igd
G51.0|Bell palsy|neurologi,wajah
G62.9|Polyneuropathy, unspecified|neurologi,diabetes
H10.9|Conjunctivitis, unspecified|mata,infeksi
H66.9|Otitis media, unspecified|tht,infeksi,anak
I25.1|Atherosclerotic heart disease|jantung,cad,kronis
I48.9|Atrial fibrillation and atrial flutter, unspecified|jantung,aritmia
I64|Stroke, not specified as haemorrhage or infarction|neurologi,stroke,igd
I69.3|Sequelae of cerebral infarction|rehabilitasi,stroke
I73.9|Peripheral vascular disease, unspecified|vaskular,kronis
J00|Acute nasopharyngitis common cold|respirasi,rawat-jalan
J02.9|Acute pharyngitis, unspecified|tht,infeksi
J03.9|Acute tonsillitis, unspecified|tht,infeksi
J12.9|Viral pneumonia, unspecified|paru,infeksi,pneumonia
J20.9|Acute bronchitis, unspecified|paru,rawat-jalan
J81|Pulmonary oedema|paru,jantung,igd
J96.0|Acute respiratory failure|paru,icu,gawat-darurat
K21.9|Gastro-oesophageal reflux disease without oesophagitis|gastrointestinal,rawat-jalan
K52.9|Noninfective gastroenteritis and colitis, unspecified|gastrointestinal,diare
K59.0|Constipation|gastrointestinal,rawat-jalan
K65.9|Peritonitis, unspecified|bedah,sepsis,abdomen
K74.6|Other and unspecified cirrhosis of liver|hepatologi,kronis
L03.9|Cellulitis, unspecified|kulit,infeksi
L50.9|Urticaria, unspecified|alergi,kulit
M10.9|Gout, unspecified|rematologi,nyeri-sendi
M17.9|Gonarthrosis, unspecified|ortopedi,rehabilitasi
M54.5|Low back pain|rehabilitasi,nyeri
N18.9|Chronic kidney disease, unspecified|ginjal,kronis
N20.0|Calculus of kidney|urologi,nyeri,igd
N40|Hyperplasia of prostate|urologi,rawat-jalan
N73.9|Female pelvic inflammatory disease, unspecified|obgyn,infeksi
O14.9|Pre-eclampsia, unspecified|obgyn,maternal,emergensi
O20.0|Threatened abortion|obgyn,kehamilan
O42.9|Premature rupture of membranes, unspecified|obgyn,kehamilan
O60.1|Preterm spontaneous labour with preterm delivery|obgyn,neonatus
P22.0|Respiratory distress syndrome of newborn|neonatus,nicu,respirasi
P59.9|Neonatal jaundice, unspecified|neonatus,anak
R50.9|Fever, unspecified|gejala,infeksi,igd
R51|Headache|gejala,neurologi
R55|Syncope and collapse|gejala,igd,jantung
S52.5|Fracture of lower end of radius|ortopedi,fraktur
S82.2|Fracture of shaft of tibia|ortopedi,trauma
T14.1|Open wound of unspecified body region|trauma,bedah-minor
T78.2|Anaphylactic shock, unspecified|alergi,emergensi
Z34.9|Supervision of normal pregnancy, unspecified|obgyn,preventif
Z51.1|Chemotherapy session for neoplasm|onkologi,kemoterapi
Z51.5|Palliative care|paliatif,onkologi
Z99.2|Dependence on renal dialysis|ginjal,dialisis
`.trim().split('\n')

const supplementalDiagnoses = commonDiagnosisReferences.map((line) => {
  const [code, name, tagText] = line.split('|')
  const tags = tagText.split(',')
  return {
    code,
    name,
    description: `Referensi validasi clinical pathway untuk ${name}: diagnosis, pemeriksaan penunjang, terapi, indikasi rawat, LOS, red flags, dan kriteria rujukan.`,
    tags,
  }
})

// ─── Tindakan ───────────────────────────────────────────────────────────────
const proceduresRaw = [
  { code: '00.17', name: 'Infusion of vasopressor agent', description: 'Pemberian vasopressor pada syok dengan monitoring ketat.', unit: 'episode', baseTariff: '350000', tags: ['icu', 'syok', 'sepsis'] },
  { code: '33.22', name: 'Fiber-optic bronchoscopy', description: 'Bronkoskopi diagnostik/terapeutik pada indikasi respirasi tertentu.', unit: 'tindakan', baseTariff: '2500000', tags: ['paru', 'diagnostik'] },
  { code: '34.04', name: 'Insertion of intercostal catheter for drainage', description: 'Pemasangan chest tube untuk pneumotoraks/efusi masif.', unit: 'tindakan', baseTariff: '2800000', tags: ['bedah', 'paru', 'emergensi'] },
  { code: '35.10', name: 'Open heart valvuloplasty without replacement', description: 'Intervensi bedah katup jantung.', unit: 'tindakan', baseTariff: '45000000', tags: ['jantung', 'bedah'] },
  { code: '36.06', name: 'Insertion of non-drug-eluting coronary artery stent', description: 'PCI dengan stent koroner non-DES.', unit: 'stent', baseTariff: '38000000', tags: ['jantung', 'pci', 'acs'] },
  { code: '37.22', name: 'Left heart cardiac catheterization', description: 'Kateterisasi jantung kiri/angiografi koroner.', unit: 'tindakan', baseTariff: '9500000', tags: ['jantung', 'diagnostik'] },
  { code: '38.93', name: 'Venous catheterization, not elsewhere classified', description: 'Pemasangan akses vena sentral/perifer sesuai indikasi.', unit: 'tindakan', baseTariff: '450000', tags: ['akses-vaskular', 'igd', 'icu'] },
  { code: '39.95', name: 'Hemodialysis', description: 'Hemodialisis untuk AKI/CKD dengan indikasi dialisis.', unit: 'sesi', baseTariff: '1200000', tags: ['ginjal', 'dialisis'] },
  { code: '45.13', name: 'Other endoscopy of small intestine', description: 'Endoskopi saluran cerna bagian atas/enteroskopi sesuai indikasi.', unit: 'tindakan', baseTariff: '1800000', tags: ['gastrointestinal', 'endoskopi'] },
  { code: '45.16', name: 'Esophagogastroduodenoscopy with closed biopsy', description: 'EGD dengan biopsi pada perdarahan/dispepsia alarm.', unit: 'tindakan', baseTariff: '2500000', tags: ['gastrointestinal', 'endoskopi', 'biopsi'] },
  { code: '45.23', name: 'Colonoscopy', description: 'Kolonoskopi diagnostik/terapeutik.', unit: 'tindakan', baseTariff: '3000000', tags: ['gastrointestinal', 'endoskopi'] },
  { code: '47.09', name: 'Appendectomy', description: 'Operasi pengangkatan apendiks pada apendisitis akut.', unit: 'tindakan', baseTariff: '8500000', tags: ['bedah', 'abdomen', 'appendicitis'] },
  { code: '51.23', name: 'Laparoscopic cholecystectomy', description: 'Kolesistektomi laparoskopik untuk batu empedu simptomatik/kolesistitis.', unit: 'tindakan', baseTariff: '14500000', tags: ['bedah', 'hepatobilier', 'laparoskopi'] },
  { code: '57.94', name: 'Insertion of indwelling urinary catheter', description: 'Pemasangan kateter urin dengan indikasi pemantauan output/retensi.', unit: 'tindakan', baseTariff: '175000', tags: ['keperawatan', 'urologi'] },
  { code: '73.59', name: 'Other manually assisted delivery', description: 'Tindakan bantuan persalinan sesuai indikasi obstetri.', unit: 'tindakan', baseTariff: '2500000', tags: ['obgyn', 'persalinan'] },
  { code: '74.1', name: 'Low cervical cesarean section', description: 'Sectio caesarea transperitoneal segmen bawah rahim.', unit: 'tindakan', baseTariff: '12000000', tags: ['obgyn', 'bedah', 'sectio'] },
  { code: '79.15', name: 'Closed reduction of fracture with internal fixation, femur', description: 'Reduksi dan fiksasi internal fraktur femur.', unit: 'tindakan', baseTariff: '22000000', tags: ['ortopedi', 'fraktur', 'bedah'] },
  { code: '87.03', name: 'Computerized axial tomography of head', description: 'CT scan kepala untuk stroke/trauma/penurunan kesadaran.', unit: 'pemeriksaan', baseTariff: '1500000', tags: ['radiologi', 'saraf', 'trauma'] },
  { code: '87.44', name: 'Routine chest x-ray', description: 'Foto toraks PA/AP untuk evaluasi pneumonia, TB, gagal jantung.', unit: 'pemeriksaan', baseTariff: '250000', tags: ['radiologi', 'paru', 'jantung'] },
  { code: '88.72', name: 'Diagnostic ultrasound of heart', description: 'Ekokardiografi transthorakal.', unit: 'pemeriksaan', baseTariff: '900000', tags: ['jantung', 'radiologi'] },
  { code: '88.76', name: 'Diagnostic ultrasound of abdomen and retroperitoneum', description: 'USG abdomen untuk apendisitis, kolelitiasis, nyeri abdomen.', unit: 'pemeriksaan', baseTariff: '450000', tags: ['radiologi', 'abdomen'] },
  { code: '89.52', name: 'Electrocardiogram', description: 'EKG 12 sadapan untuk ACS, aritmia, evaluasi preoperatif.', unit: 'pemeriksaan', baseTariff: '150000', tags: ['jantung', 'diagnostik', 'igd'] },
  { code: '89.65', name: 'Measurement of systemic arterial blood gases', description: 'Analisa gas darah untuk gagal napas, sepsis, DKA.', unit: 'pemeriksaan', baseTariff: '250000', tags: ['laboratorium', 'igd', 'icu'] },
  { code: '90.01', name: 'Complete blood count', description: 'Darah lengkap: Hb, leukosit, trombosit, hematokrit.', unit: 'pemeriksaan', baseTariff: '85000', tags: ['laboratorium', 'dasar'] },
  { code: '90.05', name: 'Blood glucose test', description: 'Gula darah sewaktu/puasa/serial.', unit: 'pemeriksaan', baseTariff: '35000', tags: ['laboratorium', 'diabetes'] },
  { code: '90.06', name: 'Electrolyte panel', description: 'Natrium, kalium, klorida untuk koreksi cairan/elektrolit.', unit: 'pemeriksaan', baseTariff: '175000', tags: ['laboratorium', 'elektrolit'] },
  { code: '90.07', name: 'Renal function panel', description: 'Ureum, kreatinin, eGFR.', unit: 'pemeriksaan', baseTariff: '160000', tags: ['laboratorium', 'ginjal'] },
  { code: '90.09', name: 'Liver function test', description: 'SGOT/AST, SGPT/ALT, bilirubin, albumin.', unit: 'pemeriksaan', baseTariff: '220000', tags: ['laboratorium', 'hepar'] },
  { code: '90.19', name: 'C-reactive protein', description: 'CRP untuk evaluasi inflamasi/infeksi.', unit: 'pemeriksaan', baseTariff: '180000', tags: ['laboratorium', 'infeksi'] },
  { code: '90.31', name: 'Urinalysis', description: 'Urinalisis lengkap untuk ISK, AKI, skrining metabolik.', unit: 'pemeriksaan', baseTariff: '75000', tags: ['laboratorium', 'urologi'] },
  { code: '90.43', name: 'Blood culture', description: 'Kultur darah sebelum antibiotik pada sepsis/infeksi berat.', unit: 'set', baseTariff: '550000', tags: ['laboratorium', 'mikrobiologi', 'sepsis'] },
  { code: '90.45', name: 'Sputum AFB smear', description: 'Pemeriksaan BTA sputum untuk TB paru.', unit: 'sampel', baseTariff: '120000', tags: ['laboratorium', 'tb', 'mikrobiologi'] },
  { code: '90.47', name: 'Dengue NS1 antigen test', description: 'Tes NS1 pada fase awal dengue.', unit: 'pemeriksaan', baseTariff: '220000', tags: ['laboratorium', 'dengue'] },
  { code: '90.48', name: 'Dengue IgM/IgG serology', description: 'Serologi dengue sesuai hari sakit.', unit: 'pemeriksaan', baseTariff: '240000', tags: ['laboratorium', 'dengue'] },
  { code: '90.59', name: 'Serial complete blood count for dengue monitoring', description: 'Darah rutin serial per 6-12 jam untuk hematokrit dan trombosit.', unit: 'pemeriksaan', baseTariff: '150000', tags: ['laboratorium', 'dengue', 'monitoring'] },
  { code: '90.71', name: 'Cardiac troponin test', description: 'Troponin I/T serial untuk ACS.', unit: 'pemeriksaan', baseTariff: '350000', tags: ['laboratorium', 'jantung', 'acs'] },
  { code: '90.72', name: 'Coagulation profile', description: 'PT, aPTT, INR untuk perdarahan, sepsis, praoperatif.', unit: 'pemeriksaan', baseTariff: '280000', tags: ['laboratorium', 'koagulasi'] },
  { code: '91.39', name: 'Microscopic examination of specimen from lower urinary tract', description: 'Mikroskopis/kultur urine untuk ISK kompleks.', unit: 'pemeriksaan', baseTariff: '250000', tags: ['laboratorium', 'urologi', 'mikrobiologi'] },
  { code: '93.90', name: 'Non-invasive mechanical ventilation', description: 'NIV/CPAP/BiPAP untuk gagal napas selektif.', unit: 'hari', baseTariff: '750000', tags: ['paru', 'icu', 'gagal-napas'] },
  { code: '93.94', name: 'Respiratory medication administered by nebulizer', description: 'Nebulisasi bronkodilator untuk asma/PPOK eksaserbasi.', unit: 'tindakan', baseTariff: '120000', tags: ['paru', 'asma', 'ppok', 'keperawatan'] },
  { code: '96.04', name: 'Insertion of endotracheal tube', description: 'Intubasi endotrakeal untuk proteksi jalan napas/gagal napas.', unit: 'tindakan', baseTariff: '1500000', tags: ['igd', 'icu', 'jalan-napas'] },
  { code: '96.07', name: 'Insertion of nasogastric tube', description: 'Pemasangan NGT untuk dekompresi/nutrisi enteral.', unit: 'tindakan', baseTariff: '175000', tags: ['keperawatan', 'gastrointestinal'] },
  { code: '96.70', name: 'Continuous invasive mechanical ventilation, unspecified duration', description: 'Ventilasi mekanik invasif.', unit: 'hari', baseTariff: '1800000', tags: ['icu', 'ventilator', 'gagal-napas'] },
  { code: '99.04', name: 'Transfusion of packed cells', description: 'Transfusi PRC sesuai indikasi anemia/perdarahan.', unit: 'kantong', baseTariff: '600000', tags: ['transfusi', 'perdarahan'] },
  { code: '99.05', name: 'Transfusion of platelets', description: 'Transfusi trombosit sesuai indikasi klinis/perdarahan.', unit: 'kantong', baseTariff: '750000', tags: ['transfusi', 'dengue', 'hematologi'] },
  { code: '99.15', name: 'Parenteral infusion of concentrated nutritional substances', description: 'Nutrisi parenteral pada indikasi khusus.', unit: 'hari', baseTariff: '950000', tags: ['nutrisi', 'icu'] },
  { code: '99.18', name: 'Injection or infusion of electrolytes', description: 'Koreksi elektrolit IV seperti KCl, MgSO4, NaCl hipertonik.', unit: 'episode', baseTariff: '150000', tags: ['elektrolit', 'igd', 'icu'] },
  { code: '99.21', name: 'Injection of antibiotic', description: 'Pemberian antibiotik parenteral.', unit: 'dosis', baseTariff: '50000', tags: ['infeksi', 'antibiotik'] },
  { code: '99.23', name: 'Injection of steroid', description: 'Pemberian kortikosteroid parenteral sesuai indikasi.', unit: 'dosis', baseTariff: '45000', tags: ['asma', 'ppok', 'antiinflamasi'] },
  { code: '99.29', name: 'Injection or infusion of other therapeutic substance', description: 'Infus obat terapeutik lain sesuai instruksi klinis.', unit: 'dosis', baseTariff: '50000', tags: ['terapi', 'injeksi'] },
  { code: '99.60', name: 'Cardiopulmonary resuscitation, not otherwise specified', description: 'Resusitasi jantung paru.', unit: 'episode', baseTariff: '2500000', tags: ['emergensi', 'code-blue'] },
]

const commonProcedureReferences = `
LAB-HBA1C|Hemoglobin A1c test|pemeriksaan|180000|laboratorium,diabetes
LAB-LIPID|Lipid profile|pemeriksaan|220000|laboratorium,metabolik
LAB-TSH|Thyroid stimulating hormone test|pemeriksaan|230000|laboratorium,tiroid
LAB-FT4|Free thyroxine test|pemeriksaan|240000|laboratorium,tiroid
LAB-FERR|Serum ferritin test|pemeriksaan|260000|laboratorium,anemia
LAB-B12|Vitamin B12 level|pemeriksaan|320000|laboratorium,neurologi
LAB-HBSAG|Hepatitis B surface antigen|pemeriksaan|180000|laboratorium,hepatitis
LAB-HCV|Anti-HCV antibody test|pemeriksaan|220000|laboratorium,hepatitis
LAB-HIV|Rapid HIV antibody antigen test|pemeriksaan|160000|laboratorium,hiv
LAB-CD4|CD4 lymphocyte count|pemeriksaan|450000|laboratorium,hiv
LAB-PCT|Procalcitonin test|pemeriksaan|550000|laboratorium,sepsis
LAB-LACTATE|Serum lactate test|pemeriksaan|250000|laboratorium,sepsis,igd
LAB-DIMER|D-dimer test|pemeriksaan|300000|laboratorium,trombosis
LAB-BNP|B-type natriuretic peptide test|pemeriksaan|650000|laboratorium,jantung
LAB-PSA|Prostate specific antigen test|pemeriksaan|350000|laboratorium,urologi
RAD-CT-THORAX|CT scan thorax|pemeriksaan|2500000|radiologi,paru
RAD-CT-ABDOMEN|CT scan abdomen with contrast|pemeriksaan|3200000|radiologi,abdomen
RAD-MRI-BRAIN|MRI brain|pemeriksaan|4500000|radiologi,neurologi
RAD-MAMMO|Mammography|pemeriksaan|650000|radiologi,onkologi
RAD-BMD|Bone mineral densitometry|pemeriksaan|550000|radiologi,ortopedi
CARD-TMT|Treadmill exercise stress test|pemeriksaan|850000|jantung,diagnostik
CARD-HOLTER|24-hour Holter monitoring|pemeriksaan|950000|jantung,aritmia
CARD-DC-SHOCK|Electrical cardioversion|tindakan|2500000|jantung,igd
NEURO-EEG|Electroencephalography|pemeriksaan|900000|neurologi,kejang
NEURO-LP|Lumbar puncture|tindakan|1200000|neurologi,infeksi
RESP-SPIRO|Spirometry|pemeriksaan|350000|paru,diagnostik
RESP-PEF|Peak expiratory flow monitoring|pemeriksaan|75000|paru,asma
GI-H-PYLORI|Helicobacter pylori stool antigen test|pemeriksaan|275000|gastrointestinal,infeksi
GI-PARACENTESIS|Diagnostic abdominal paracentesis|tindakan|850000|hepatologi,abdomen
RENAL-USG|Kidney and urinary tract ultrasound|pemeriksaan|500000|radiologi,ginjal
URO-UROFLOW|Uroflowmetry|pemeriksaan|350000|urologi
OBS-CTG|Cardiotocography|pemeriksaan|300000|obgyn,maternal
OBS-USG|Obstetric ultrasound|pemeriksaan|450000|obgyn,radiologi
OBS-PAP|Cervical cytology Pap smear|pemeriksaan|250000|obgyn,preventif
NEO-PHOTO|Neonatal phototherapy|hari|600000|neonatus,anak
NEO-CPAP|Neonatal CPAP therapy|hari|950000|neonatus,nicu
WOUND-DEBRIDE|Wound debridement|tindakan|900000|bedah,luka
WOUND-SUTURE|Simple wound suturing|tindakan|450000|bedah-minor,igd
ORTHO-SPLINT|Limb splinting|tindakan|350000|ortopedi,trauma
ORTHO-CAST|Circular cast application|tindakan|750000|ortopedi
REHAB-PT|Therapeutic exercise session|sesi|200000|rehabilitasi
REHAB-SWALLOW|Swallowing therapy session|sesi|250000|rehabilitasi,stroke
NUTR-COUNSEL|Clinical nutrition counseling|sesi|180000|gizi,edukasi
PHARM-RECON|Medication reconciliation|episode|150000|farmasi-klinik
PALL-CARE|Palliative care consultation|sesi|350000|paliatif
ONC-BIOPSY|Core needle biopsy|tindakan|1800000|onkologi,patologi
ONC-CHEMO|Chemotherapy administration|sesi|2500000|onkologi,kemoterapi
ISO-AIRBORNE|Airborne isolation room care|hari|650000|isolasi,infeksi
TRANS-FFP|Fresh frozen plasma transfusion|kantong|650000|transfusi,koagulasi
TRANS-CRYO|Cryoprecipitate transfusion|kantong|550000|transfusi,koagulasi
`.trim().split('\n')

const supplementalProcedures = commonProcedureReferences.map((line) => {
  const [code, name, unit, baseTariff, tagText] = line.split('|')
  const tags = tagText.split(',')
  return {
    code,
    name,
    description: `Master prosedur untuk validasi pathway: ${name}, termasuk indikasi, kewajaran utilisasi, frekuensi, dan pembanding tarif.`,
    unit,
    baseTariff: new Prisma.Decimal(baseTariff),
    tags,
  }
})

// ─── Obat ───────────────────────────────────────────────────────────────────
const medicationsRaw = [
  { code: 'MED-RL-500', name: 'Ringer Laktat 500 mL', description: 'Kristaloid balanced untuk rehidrasi/resusitasi cairan.', unit: 'botol', baseTariff: '25000', tags: ['cairan', 'dengue', 'dehidrasi', 'igd'] },
  { code: 'MED-NS-500', name: 'NaCl 0.9% 500 mL', description: 'Kristaloid isotonik untuk resusitasi, pengencer obat, koreksi hipovolemia.', unit: 'botol', baseTariff: '23000', tags: ['cairan', 'sepsis', 'dka'] },
  { code: 'MED-D5-500', name: 'Dextrose 5% 500 mL', description: 'Cairan glukosa untuk kebutuhan kalori dasar/pengencer selektif.', unit: 'botol', baseTariff: '22000', tags: ['cairan', 'maintenance'] },
  { code: 'MED-PCT-500', name: 'Paracetamol 500 mg tablet', description: 'Antipiretik/analgesik lini pertama.', unit: 'tablet', baseTariff: '750', tags: ['analgesik', 'antipiretik', 'demam'] },
  { code: 'MED-PCT-INF', name: 'Paracetamol infusion 1 g/100 mL', description: 'Antipiretik/analgesik IV bila tidak dapat oral.', unit: 'vial', baseTariff: '65000', tags: ['analgesik', 'antipiretik', 'rawat-inap'] },
  { code: 'MED-IBU-400', name: 'Ibuprofen 400 mg tablet', description: 'NSAID; hindari pada dengue/perdarahan/AKI.', unit: 'tablet', baseTariff: '1200', tags: ['analgesik', 'nsaid', 'kontraindikasi-dengue'] },
  { code: 'MED-KETO-IV', name: 'Ketorolac 30 mg/mL injection', description: 'Analgesik NSAID IV jangka pendek; monitor risiko perdarahan/renal.', unit: 'ampul', baseTariff: '18000', tags: ['analgesik', 'nsaid', 'bedah'] },
  { code: 'MED-OMEP-20', name: 'Omeprazole 20 mg capsule', description: 'PPI oral untuk dispepsia/ulkus/gastroproteksi selektif.', unit: 'kapsul', baseTariff: '1500', tags: ['ppi', 'gastrointestinal'] },
  { code: 'MED-PANTO-IV', name: 'Pantoprazole 40 mg injection', description: 'PPI IV untuk perdarahan saluran cerna/indikasi rawat inap.', unit: 'vial', baseTariff: '85000', tags: ['ppi', 'perdarahan', 'gastrointestinal'] },
  { code: 'MED-ONDAN-IV', name: 'Ondansetron 4 mg injection', description: 'Antiemetik IV untuk mual muntah.', unit: 'ampul', baseTariff: '25000', tags: ['antiemetik', 'igd'] },
  { code: 'MED-DOMP-10', name: 'Domperidone 10 mg tablet', description: 'Antiemetik/prokinetik oral selektif.', unit: 'tablet', baseTariff: '1200', tags: ['antiemetik', 'gastrointestinal'] },
  { code: 'MED-ORALIT', name: 'Oral rehydration salts', description: 'Rehidrasi oral untuk diare/dehidrasi ringan-sedang.', unit: 'sachet', baseTariff: '1500', tags: ['rehidrasi', 'diare'] },
  { code: 'MED-ZINC-20', name: 'Zinc 20 mg tablet', description: 'Suplemen zinc pada diare anak.', unit: 'tablet', baseTariff: '900', tags: ['diare', 'anak'] },
  { code: 'MED-CEFTR-1G', name: 'Ceftriaxone 1 g injection', description: 'Sefalosporin generasi III untuk pneumonia, sepsis, ISK komplike sesuai indikasi.', unit: 'vial', baseTariff: '65000', tags: ['antibiotik', 'sepsis', 'pneumonia', 'isk'] },
  { code: 'MED-CEFTAZ-1G', name: 'Ceftazidime 1 g injection', description: 'Antibiotik antipseudomonas selektif.', unit: 'vial', baseTariff: '95000', tags: ['antibiotik', 'pseudomonas', 'icu'] },
  { code: 'MED-AMP-SUL', name: 'Ampicillin sulbactam 1.5 g injection', description: 'Antibiotik beta-laktam/beta-laktamase inhibitor.', unit: 'vial', baseTariff: '75000', tags: ['antibiotik', 'bedah', 'pneumonia'] },
  { code: 'MED-AMOX-500', name: 'Amoxicillin 500 mg capsule', description: 'Antibiotik oral untuk infeksi ringan tertentu sesuai indikasi.', unit: 'kapsul', baseTariff: '1800', tags: ['antibiotik', 'rawat-jalan'] },
  { code: 'MED-AZITH-500', name: 'Azithromycin 500 mg tablet', description: 'Makrolida untuk CAP/atipikal selektif.', unit: 'tablet', baseTariff: '22000', tags: ['antibiotik', 'pneumonia'] },
  { code: 'MED-LEVO-750', name: 'Levofloxacin 750 mg tablet', description: 'Fluorokuinolon respiratorik; gunakan bijak sesuai stewardship.', unit: 'tablet', baseTariff: '35000', tags: ['antibiotik', 'pneumonia', 'stewardship'] },
  { code: 'MED-MERO-1G', name: 'Meropenem 1 g injection', description: 'Karbapenem untuk infeksi berat/MDR dengan indikasi jelas.', unit: 'vial', baseTariff: '280000', tags: ['antibiotik', 'sepsis', 'icu', 'reserve'] },
  { code: 'MED-METRO-IV', name: 'Metronidazole 500 mg infusion', description: 'Antibiotik anaerob untuk infeksi intraabdomen/ginekologi.', unit: 'botol', baseTariff: '45000', tags: ['antibiotik', 'anaerob', 'bedah'] },
  { code: 'MED-DOXY-100', name: 'Doxycycline 100 mg tablet', description: 'Tetrasiklin untuk infeksi tertentu; perhatikan kontraindikasi.', unit: 'tablet', baseTariff: '2500', tags: ['antibiotik', 'infeksi'] },
  { code: 'MED-OAT-FDC', name: 'OAT KDT kategori 1', description: 'Kombinasi isoniazid, rifampicin, pyrazinamide, ethambutol untuk TB sensitif obat.', unit: 'paket-harian', baseTariff: '0', tags: ['tb', 'oat', 'program'] },
  { code: 'MED-INH-300', name: 'Isoniazid 300 mg tablet', description: 'Obat anti-TB; monitor hepatotoksisitas dan neuropati.', unit: 'tablet', baseTariff: '800', tags: ['tb', 'oat'] },
  { code: 'MED-RIF-450', name: 'Rifampicin 450 mg capsule', description: 'Obat anti-TB; interaksi obat kuat.', unit: 'kapsul', baseTariff: '1500', tags: ['tb', 'oat'] },
  { code: 'MED-SALB-NEB', name: 'Salbutamol nebules 2.5 mg', description: 'Bronkodilator inhalasi untuk asma/PPOK eksaserbasi.', unit: 'nebule', baseTariff: '35000', tags: ['asma', 'ppok', 'nebulisasi'] },
  { code: 'MED-IPI-NEB', name: 'Ipratropium bromide nebules', description: 'Bronkodilator antikolinergik inhalasi, sering dikombinasi pada eksaserbasi.', unit: 'nebule', baseTariff: '42000', tags: ['asma', 'ppok', 'nebulisasi'] },
  { code: 'MED-BUD-NEB', name: 'Budesonide nebules 0.5 mg', description: 'Kortikosteroid inhalasi/nebulisasi selektif.', unit: 'nebule', baseTariff: '55000', tags: ['asma', 'ppok', 'steroid'] },
  { code: 'MED-MPRED-IV', name: 'Methylprednisolone 125 mg injection', description: 'Kortikosteroid IV untuk eksaserbasi asma/PPOK atau indikasi inflamasi berat.', unit: 'vial', baseTariff: '75000', tags: ['steroid', 'asma', 'ppok'] },
  { code: 'MED-PRED-5', name: 'Prednisone 5 mg tablet', description: 'Kortikosteroid oral untuk tapering/terapi inflamasi.', unit: 'tablet', baseTariff: '800', tags: ['steroid', 'inflamasi'] },
  { code: 'MED-O2-NASAL', name: 'Oxygen therapy nasal cannula', description: 'Terapi oksigen aliran rendah.', unit: 'jam', baseTariff: '15000', tags: ['oksigen', 'respirasi'] },
  { code: 'MED-ASP-80', name: 'Aspirin 80 mg tablet', description: 'Antiplatelet untuk ACS/stroke iskemik sesuai indikasi.', unit: 'tablet', baseTariff: '700', tags: ['antiplatelet', 'acs', 'stroke'] },
  { code: 'MED-CLOP-75', name: 'Clopidogrel 75 mg tablet', description: 'Antiplatelet P2Y12 untuk ACS/stroke sesuai indikasi.', unit: 'tablet', baseTariff: '3500', tags: ['antiplatelet', 'acs', 'stroke'] },
  { code: 'MED-ATOR-40', name: 'Atorvastatin 40 mg tablet', description: 'Statin intensitas tinggi/sedang untuk ACS/stroke/dislipidemia.', unit: 'tablet', baseTariff: '6500', tags: ['statin', 'acs', 'stroke'] },
  { code: 'MED-HEP-5000', name: 'Unfractionated heparin 5000 IU/mL', description: 'Antikoagulan untuk ACS/VTE/indikasi tertentu.', unit: 'vial', baseTariff: '60000', tags: ['antikoagulan', 'acs'] },
  { code: 'MED-ENOX-60', name: 'Enoxaparin 60 mg syringe', description: 'LMWH untuk ACS/VTE profilaksis/terapi sesuai dosis.', unit: 'syringe', baseTariff: '145000', tags: ['antikoagulan', 'acs', 'vte'] },
  { code: 'MED-NTG-SL', name: 'Nitroglycerin sublingual 0.5 mg', description: 'Vasodilator untuk nyeri dada angina; hindari pada hipotensi/PDE5 inhibitor.', unit: 'tablet', baseTariff: '1500', tags: ['jantung', 'angina'] },
  { code: 'MED-FURO-IV', name: 'Furosemide 20 mg/2 mL injection', description: 'Diuretik loop IV untuk overload/gagal jantung.', unit: 'ampul', baseTariff: '12000', tags: ['diuretik', 'gagal-jantung'] },
  { code: 'MED-AML-5', name: 'Amlodipine 5 mg tablet', description: 'CCB untuk hipertensi.', unit: 'tablet', baseTariff: '1200', tags: ['antihipertensi', 'hipertensi'] },
  { code: 'MED-CAP-25', name: 'Captopril 25 mg tablet', description: 'ACE inhibitor untuk hipertensi/gagal jantung selektif.', unit: 'tablet', baseTariff: '800', tags: ['antihipertensi', 'ace-inhibitor'] },
  { code: 'MED-BIS-5', name: 'Bisoprolol 5 mg tablet', description: 'Beta blocker untuk hipertensi, gagal jantung, CAD sesuai indikasi.', unit: 'tablet', baseTariff: '2500', tags: ['beta-blocker', 'jantung'] },
  { code: 'MED-INS-R', name: 'Regular insulin 100 IU/mL', description: 'Insulin kerja pendek untuk koreksi hiperglikemia/DKA.', unit: 'vial', baseTariff: '85000', tags: ['insulin', 'diabetes', 'dka'] },
  { code: 'MED-INS-GLAR', name: 'Insulin glargine 100 IU/mL', description: 'Insulin basal kerja panjang.', unit: 'pen', baseTariff: '185000', tags: ['insulin', 'diabetes'] },
  { code: 'MED-METF-500', name: 'Metformin 500 mg tablet', description: 'OAD lini pertama DM2 bila tidak kontraindikasi.', unit: 'tablet', baseTariff: '900', tags: ['diabetes', 'oad'] },
  { code: 'MED-GLIM-2', name: 'Glimepiride 2 mg tablet', description: 'Sulfonilurea untuk DM2; risiko hipoglikemia.', unit: 'tablet', baseTariff: '1300', tags: ['diabetes', 'oad'] },
  { code: 'MED-KCL', name: 'Potassium chloride injection', description: 'Koreksi hipokalemia dengan monitoring EKG dan laju infus aman.', unit: 'ampul', baseTariff: '9000', tags: ['elektrolit', 'dka', 'icu'] },
  { code: 'MED-MGSO4', name: 'Magnesium sulfate injection', description: 'Koreksi hipomagnesemia/eklamsia/aritmia tertentu.', unit: 'ampul', baseTariff: '12000', tags: ['elektrolit', 'obgyn', 'aritmia'] },
  { code: 'MED-DIAZ-IV', name: 'Diazepam 10 mg/2 mL injection', description: 'Benzodiazepin untuk kejang akut.', unit: 'ampul', baseTariff: '10000', tags: ['kejang', 'neurologi'] },
  { code: 'MED-LEVET-IV', name: 'Levetiracetam 500 mg injection', description: 'Antikejang untuk status epileptikus/terapi lanjutan selektif.', unit: 'vial', baseTariff: '185000', tags: ['kejang', 'neurologi'] },
  { code: 'MED-PHENY-IV', name: 'Phenytoin 100 mg injection', description: 'Antikonvulsan untuk kejang berulang/status epileptikus.', unit: 'ampul', baseTariff: '28000', tags: ['kejang', 'neurologi'] },
  { code: 'MED-MORPH-IV', name: 'Morphine 10 mg injection', description: 'Opioid untuk nyeri berat/ACS selektif; monitor depresi napas.', unit: 'ampul', baseTariff: '35000', tags: ['analgesik', 'opioid', 'nyeri-berat'] },
  { code: 'MED-TRAM-IV', name: 'Tramadol 50 mg injection', description: 'Analgesik opioid lemah untuk nyeri sedang-berat.', unit: 'ampul', baseTariff: '16000', tags: ['analgesik', 'opioid'] },
  { code: 'MED-LIDO-2', name: 'Lidocaine 2% injection', description: 'Anestesi lokal untuk prosedur minor.', unit: 'vial', baseTariff: '18000', tags: ['anestesi', 'prosedur'] },
  { code: 'MED-BUPI', name: 'Bupivacaine spinal 0.5%', description: 'Anestesi spinal/epidural oleh tenaga kompeten.', unit: 'ampul', baseTariff: '45000', tags: ['anestesi', 'obgyn', 'bedah'] },
  { code: 'MED-CEFZ-1G', name: 'Cefazolin 1 g injection', description: 'Antibiotik profilaksis operasi bersih/bersih-terkontaminasi.', unit: 'vial', baseTariff: '55000', tags: ['antibiotik', 'profilaksis', 'bedah'] },
  { code: 'MED-OXYTOCIN', name: 'Oxytocin 10 IU injection', description: 'Uterotonik untuk manajemen aktif kala III/atonia uteri.', unit: 'ampul', baseTariff: '9000', tags: ['obgyn', 'persalinan'] },
  { code: 'MED-TXA', name: 'Tranexamic acid 500 mg injection', description: 'Antifibrinolitik pada perdarahan tertentu.', unit: 'ampul', baseTariff: '22000', tags: ['perdarahan', 'obgyn', 'trauma'] },
  { code: 'MED-VITK', name: 'Vitamin K1 injection', description: 'Profilaksis perdarahan neonatus/koreksi defisiensi selektif.', unit: 'ampul', baseTariff: '12000', tags: ['neonatus', 'hematologi'] },
  { code: 'MED-ORS-PAED', name: 'Pediatric oral rehydration kit', description: 'Paket oralit dan edukasi cairan untuk anak.', unit: 'paket', baseTariff: '10000', tags: ['anak', 'diare', 'rehidrasi'] },
  { code: 'MED-ARV-TDF3TC', name: 'Tenofovir/Lamivudine/Dolutegravir fixed-dose combination', description: 'Regimen ART lini pertama sesuai program HIV.', unit: 'tablet', baseTariff: '0', tags: ['hiv', 'art', 'program'] },
  { code: 'MED-REMDES', name: 'Remdesivir 100 mg injection', description: 'Antivirus COVID-19 pada indikasi tertentu sesuai protokol terbaru.', unit: 'vial', baseTariff: '950000', tags: ['covid', 'antivirus'] },
  { code: 'MED-DEXA-IV', name: 'Dexamethasone 5 mg/mL injection', description: 'Kortikosteroid untuk COVID berat/indikasi inflamasi tertentu.', unit: 'ampul', baseTariff: '9000', tags: ['steroid', 'covid', 'antiinflamasi'] },
  { code: 'MED-NAC', name: 'N-acetylcysteine 200 mg capsule', description: 'Mukolitik/indikasi toksikologi tertentu.', unit: 'kapsul', baseTariff: '1200', tags: ['mukolitik', 'respirasi'] },
]

const commonMedicationReferences = `
MED-ACYC-400|Acyclovir 400 mg tablet|tablet|2500|antivirus,herpes
MED-VALAC-500|Valacyclovir 500 mg tablet|tablet|18000|antivirus,herpes
MED-TDF-300|Tenofovir disoproxil fumarate 300 mg tablet|tablet|0|antivirus,hepatitis-b,hiv
MED-SOF-VEL|Sofosbuvir/Velpatasvir tablet|tablet|0|antivirus,hepatitis-c
MED-FESO4|Ferrous sulfate tablet|tablet|600|anemia,hematologi
MED-FOLIC|Folic acid 1 mg tablet|tablet|400|hematologi,obgyn
MED-B12|Cyanocobalamin injection|ampul|18000|hematologi,neurologi
MED-LEVOTH-50|Levothyroxine 50 mcg tablet|tablet|1200|tiroid,endokrin
MED-THIAM-100|Thiamazole 10 mg tablet|tablet|1800|tiroid,endokrin
MED-PROP-10|Propranolol 10 mg tablet|tablet|800|jantung,tiroid
MED-SERTR-50|Sertraline 50 mg tablet|tablet|4500|psikiatri,ssri
MED-FLUOX-20|Fluoxetine 20 mg capsule|kapsul|3500|psikiatri,ssri
MED-AMIT-25|Amitriptyline 25 mg tablet|tablet|900|neurologi,nyeri-neuropatik
MED-GABA-300|Gabapentin 300 mg capsule|kapsul|6500|neurologi,nyeri-neuropatik
MED-SUMA-50|Sumatriptan 50 mg tablet|tablet|28000|migrain,neurologi
MED-CETIR-10|Cetirizine 10 mg tablet|tablet|1200|alergi,kulit
MED-LORAT-10|Loratadine 10 mg tablet|tablet|1400|alergi
MED-EPIN-AMP|Epinephrine 1 mg/mL injection|ampul|18000|emergensi,anafilaksis
MED-COLCH-05|Colchicine 0.5 mg tablet|tablet|2500|gout,rematologi
MED-ALLO-100|Allopurinol 100 mg tablet|tablet|800|gout,kronis
MED-CELE-200|Celecoxib 200 mg capsule|kapsul|8500|analgesik,nsaid
MED-LACTU|Lactulose syrup|botol|65000|gastrointestinal,hepatologi
MED-BISAC|Bisacodyl 5 mg tablet|tablet|700|gastrointestinal
MED-SPIRON-25|Spironolactone 25 mg tablet|tablet|1200|diuretik,hepatologi,jantung
MED-ALB20|Albumin 20% infusion|botol|950000|hepatologi,icu
MED-TAMSU-04|Tamsulosin 0.4 mg capsule|kapsul|6500|urologi,bph
MED-FINAS-5|Finasteride 5 mg tablet|tablet|7500|urologi,bph
MED-NITROF|Nitrofurantoin 100 mg capsule|kapsul|5500|antibiotik,isk
MED-CIPRO-500|Ciprofloxacin 500 mg tablet|tablet|5000|antibiotik,urologi
MED-MISO-200|Misoprostol 200 mcg tablet|tablet|4500|obgyn
MED-NIFED-10|Nifedipine 10 mg capsule|kapsul|1200|obgyn,antihipertensi
MED-LABET-IV|Labetalol injection|vial|95000|antihipertensi,obgyn,igd
MED-SURF|Poractant alfa surfactant|vial|4500000|neonatus,nicu
MED-CAFFEINE|Caffeine citrate injection|vial|185000|neonatus,nicu
MED-VANCO-500|Vancomycin 500 mg injection|vial|125000|antibiotik,reserve,icu
MED-PIPTAZO|Piperacillin/tazobactam 4.5 g injection|vial|185000|antibiotik,sepsis,icu
MED-FLUC-150|Fluconazole 150 mg capsule|kapsul|18000|antijamur
MED-NOREPI|Norepinephrine injection|ampul|75000|vasopressor,icu,sepsis
MED-DOBUT|Dobutamine injection|ampul|65000|inotropik,jantung,icu
MED-TPA|Alteplase injection|vial|7500000|stroke,jantung,trombolitik
`.trim().split('\n')

const supplementalMedications = commonMedicationReferences.map((line) => {
  const [code, name, unit, baseTariff, tagText] = line.split('|')
  const tags = tagText.split(',')
  return {
    code,
    name,
    description: `Master obat untuk validasi pathway: ${name}, mencakup indikasi klinis, kontraindikasi umum, rute, satuan, dan pembanding tarif.`,
    unit,
    baseTariff: new Prisma.Decimal(baseTariff),
    tags,
  }
})

// ─── Practitioner ─────────────────────────────────────────────────────────────
const practitionersRaw = [
  { nik: '3173010101800001', name: 'dr. Andi Wijaya, Sp.PD-KPTI', specialization: 'Penyakit Dalam - Tropik Infeksi', tags: ['sepsis', 'dengue', 'tb', 'hiv', 'rawat-inap'] },
  { nik: '3173010202820002', name: 'dr. Maya Kartika, Sp.PD-KEMD', specialization: 'Penyakit Dalam - Endokrin Metabolik Diabetes', tags: ['diabetes', 'dka', 'hiperglikemia'] },
  { nik: '3173010303770003', name: 'dr. Raka Pratama, Sp.JP(K)', specialization: 'Jantung dan Pembuluh Darah', tags: ['acs', 'gagal-jantung', 'kateterisasi'] },
  { nik: '3173010404850004', name: 'dr. Citra Lestari, Sp.A', specialization: 'Kesehatan Anak', tags: ['anak', 'dengue', 'diare', 'neonatus'] },
  { nik: '3173010505790005', name: 'dr. Budi Santoso, Sp.B', specialization: 'Bedah Umum', tags: ['appendectomy', 'abdomen', 'kolelitiasis'] },
  { nik: '3173010606860006', name: 'dr. Ratna Sari, Sp.OG', specialization: 'Obstetri dan Ginekologi', tags: ['persalinan', 'sectio', 'maternal'] },
  { nik: '3173010701740007', name: 'dr. Farid Hidayat, Sp.P', specialization: 'Pulmonologi dan Kedokteran Respirasi', tags: ['pneumonia', 'tb', 'asma', 'ppok'] },
  { nik: '3173010808810008', name: 'dr. Nabila Putri, Sp.N', specialization: 'Neurologi', tags: ['stroke', 'kejang', 'cedera-kepala'] },
  { nik: '3173010903720009', name: 'dr. Yusuf Ramadhan, Sp.An-KIC', specialization: 'Anestesiologi dan Terapi Intensif', tags: ['icu', 'sepsis', 'ventilator', 'nyeri'] },
  { nik: '3173011004900010', name: 'dr. Elina Safitri, Sp.Rad', specialization: 'Radiologi', tags: ['ct-scan', 'usg', 'xray', 'diagnostik'] },
  { nik: '3173011102780011', name: 'dr. Hendra Gunawan, Sp.OT', specialization: 'Ortopedi dan Traumatologi', tags: ['fraktur', 'trauma', 'bedah'] },
  { nik: '3173011205840012', name: 'dr. Laila Amalia, Sp.KFR', specialization: 'Kedokteran Fisik dan Rehabilitasi', tags: ['rehabilitasi', 'stroke', 'ortopedi'] },
  { nik: '3173011301690013', name: 'dr. Taufik Akbar, Sp.B-KBD', specialization: 'Bedah Digestif', tags: ['abdomen', 'hepatobilier', 'endoskopi'] },
  { nik: '3173011404930014', name: 'dr. Sarah Kurnia, Sp.MK', specialization: 'Mikrobiologi Klinik', tags: ['kultur', 'antibiotik', 'stewardship'] },
  { nik: '3173011502860015', name: 'dr. Dimas Nugroho, Sp.PK', specialization: 'Patologi Klinik', tags: ['laboratorium', 'hematologi', 'kimia-klinik'] },
  { nik: '3173011603890016', name: 'dr. Intan Permata, Sp.GK', specialization: 'Gizi Klinik', tags: ['nutrisi', 'diabetes', 'icu'] },
  { nik: '3173011701750017', name: 'dr. Arief Maulana, Sp.U', specialization: 'Urologi', tags: ['isk', 'kateter', 'batu-saluran-kemih'] },
  { nik: '3173011802910018', name: 'dr. Vina Maharani, Sp.A(K) Neonatologi', specialization: 'Anak - Neonatologi', tags: ['neonatus', 'prematur', 'nicu'] },
  { nik: '3173011904830019', name: 'dr. Reza Firmansyah, Sp.EM', specialization: 'Emergency Medicine', tags: ['igd', 'triase', 'resusitasi', 'trauma'] },
  { nik: '3173012001800020', name: 'dr. Dewi Anggraini, Sp.PD-KGH', specialization: 'Penyakit Dalam - Ginjal Hipertensi', tags: ['aki', 'dialisis', 'hipertensi'] },
  { nik: '3173012104770021', name: 'dr. Bagas Wicaksono, Sp.KJ', specialization: 'Kedokteran Jiwa', tags: ['psikiatri', 'konsultasi', 'komorbid'] },
  { nik: '3173012206880022', name: 'dr. Melati Rahma, Sp.KK', specialization: 'Dermatologi Venereologi dan Estetika', tags: ['kulit', 'infeksi-kulit', 'alergi'] },
  { nik: '3173012305780023', name: 'dr. Irfan Hakim, Sp.THT-KL', specialization: 'Telinga Hidung Tenggorok Bedah Kepala Leher', tags: ['tht', 'infeksi', 'jalan-napas'] },
  { nik: '3173012403840024', name: 'dr. Nadia Febriani, Sp.M', specialization: 'Oftalmologi', tags: ['mata', 'diabetes', 'skrining'] },
  { nik: '3173012501710025', name: 'dr. Galih Prakoso, M.Ked.Klin', specialization: 'Dokter Umum Rawat Jalan', tags: ['rawat-jalan', 'triase', 'kronis'] },
  { nik: '3173012604940026', name: 'dr. Amanda Putri', specialization: 'Dokter Umum IGD', tags: ['igd', 'triase', 'stabilisasi'] },
  { nik: '3173012702890027', name: 'dr. Fajar Nugraha', specialization: 'Dokter Umum Bangsal', tags: ['rawat-inap', 'monitoring', 'clinical-pathway'] },
  { nik: '3173012801830028', name: 'dr. Salsabila Anindya, Sp.PD', specialization: 'Penyakit Dalam', tags: ['rawat-inap', 'pneumonia', 'diabetes', 'hipertensi'] },
  { nik: '3173012904760029', name: 'dr. Kevin Hartanto, Sp.BTKV', specialization: 'Bedah Toraks Kardiak Vaskular', tags: ['jantung', 'toraks', 'bedah'] },
  { nik: '3173013005900030', name: 'dr. Rini Puspitasari, Sp.Farm.Klin', specialization: 'Farmakologi Klinik', tags: ['farmasi-klinik', 'interaksi-obat', 'validasi-obat'] },
]

const practitionerNames = [
  'dr. Aditya Wardhana', 'dr. Bella Maharani', 'dr. Chandra Kusuma', 'dr. Dina Prameswari', 'dr. Eko Saputra', 'dr. Fitria Handayani', 'dr. Gilang Ramadhi', 'dr. Hana Oktaviani', 'dr. Ivan Mahendra', 'dr. Jelita Anggraeni', 'dr. Kemal Arya', 'dr. Larasati Dewi', 'dr. Mahesa Putra', 'dr. Niken Ayu', 'dr. Oka Wirawan', 'dr. Prita Laksmi', 'dr. Qori Firmansyah', 'dr. Rangga Prakoso', 'dr. Shinta Wulandari', 'dr. Tegar Pamungkas', 'dr. Utami Saraswati', 'dr. Vega Saputri', 'dr. Wira Nugraha', 'dr. Xaviera Putri', 'dr. Yudha Sanjaya', 'dr. Zahra Amani', 'dr. Aldi Permana', 'dr. Bening Laras', 'dr. Cakra Dinata', 'dr. Dania Kirana', 'dr. Erwin Halim', 'dr. Farah Natasya', 'dr. Gita Pertiwi', 'dr. Haryo Laksono', 'dr. Inas Rahmawati', 'dr. Joko Santika', 'dr. Kartika Dewi', 'dr. Lukman Hakim', 'dr. Mega Arini', 'dr. Nanda Prasetyo', 'dr. Olivia Cahyani', 'dr. Pandu Ardiansyah', 'dr. Qania Safira', 'dr. Rendra Kurnia', 'dr. Sagara Putra', 'dr. Tiara Novita', 'dr. Umar Fathoni', 'dr. Vania Sekar', 'dr. Wahyu Priyanto', 'dr. Yulia Kartini', 'dr. Zaki Mubarak', 'dr. Amelia Putri', 'dr. Bayu Pradana', 'dr. Cindy Natalia', 'dr. Dodi Irawan', 'dr. Elsa Fitriani', 'dr. Fauzan Malik', 'dr. Gracia Felicia', 'dr. Hilmi Yusuf', 'dr. Indira Cempaka', 'dr. Jihan Mutiara', 'dr. Ken Aditama', 'dr. Livia Anjani', 'dr. Mario Susanto', 'dr. Naufal Akbar', 'dr. Ovi Damayanti', 'dr. Putra Wibisana', 'dr. Raisa Maharani', 'dr. Surya Atmadja', 'dr. Tamara Kirana'
]

const practitionerProfiles: Array<[string, string, string[]]> = [
  ['Sp.PD', 'Penyakit Dalam', ['rawat-inap', 'kronis']], ['Sp.PD-KKV', 'Penyakit Dalam - Kardiovaskular', ['hipertensi', 'gagal-jantung']], ['Sp.PD-KGEH', 'Penyakit Dalam - Gastroenterohepatologi', ['hepatitis', 'sirosis']], ['Sp.PD-KHOM', 'Penyakit Dalam - Hematologi Onkologi Medik', ['onkologi', 'anemia']], ['Sp.A', 'Kesehatan Anak', ['anak', 'dengue']], ['Sp.A(K)', 'Anak - Neonatologi/Infeksi', ['neonatus', 'infeksi']], ['Sp.OG', 'Obstetri dan Ginekologi', ['persalinan', 'anc']], ['Sp.B', 'Bedah Umum', ['appendicitis', 'luka']], ['Sp.B-KBD', 'Bedah Digestif', ['abdomen', 'hepatobilier']], ['Sp.U', 'Urologi', ['isk', 'bph']], ['Sp.OT', 'Ortopedi dan Traumatologi', ['fraktur', 'trauma']], ['Sp.N', 'Neurologi', ['stroke', 'kejang']], ['Sp.KJ', 'Psikiatri', ['depresi', 'cemas']], ['Sp.P', 'Pulmonologi', ['tb', 'asma']], ['Sp.JP', 'Jantung dan Pembuluh Darah', ['acs', 'aritmia']], ['Sp.Rad', 'Radiologi', ['ct-scan', 'usg']], ['Sp.PK', 'Patologi Klinik', ['laboratorium', 'hematologi']], ['Sp.MK', 'Mikrobiologi Klinik', ['kultur', 'antibiotik']], ['Sp.An-KIC', 'Anestesiologi dan Terapi Intensif', ['icu', 'ventilator']], ['Sp.EM', 'Emergency Medicine', ['igd', 'resusitasi']], ['Sp.KFR', 'Rehabilitasi Medik', ['stroke', 'low-back-pain']], ['Sp.GK', 'Gizi Klinik', ['obesitas', 'diabetes']], ['Sp.M', 'Oftalmologi', ['mata', 'diabetes']], ['Sp.THT-KL', 'THT-KL', ['otitis', 'tonsilitis']], ['Sp.DV', 'Dermatologi Venereologi', ['selulitis', 'urtikaria']], ['Sp.Onk.Rad', 'Onkologi Radiasi', ['radioterapi', 'paliatif']], ['Sp.Farm.Klin', 'Farmakologi Klinik', ['validasi-obat', 'interaksi']], ['Dokter Umum', 'Dokter Umum Clinical Pathway', ['triase', 'monitoring']]
]

const supplementalPractitioners = practitionerNames.map((baseName, index) => {
  const [credential, specialization, tags] = practitionerProfiles[index % practitionerProfiles.length]
  return {
    nik: `317302${String(1000000000 + index).slice(0, 10)}`,
    name: `${baseName}, ${credential}`,
    specialization,
    tags,
  }
})

const allDiagnoses = [...diagnosesRaw, ...supplementalDiagnoses]
const allProcedures = [
  ...proceduresRaw.map(p => ({ ...p, baseTariff: new Prisma.Decimal(p.baseTariff) })),
  ...supplementalProcedures
]
const allMedications = [
  ...medicationsRaw.map(m => ({ ...m, baseTariff: new Prisma.Decimal(m.baseTariff) })),
  ...supplementalMedications
]
const allPractitioners = [...practitionersRaw, ...supplementalPractitioners]

async function main() {
  console.log('🌱 Seeding Master Data Klinis...')

  let diagnosisCount = 0
  for (const d of allDiagnoses) {
    await prisma.masterDiagnosis.upsert({
      where: { code: d.code as string },
      update: { name: d.name, description: d.description, tags: d.tags },
      create: d,
    })
    diagnosisCount++
  }
  console.log(`  ✅ ${diagnosisCount} Diagnosa`)

  let procedureCount = 0
  for (const p of allProcedures) {
    await prisma.masterProcedure.upsert({
      where: { code: p.code as string },
      update: { name: p.name, description: p.description, unit: p.unit, baseTariff: p.baseTariff, tags: p.tags },
      create: p,
    })
    procedureCount++
  }
  console.log(`  ✅ ${procedureCount} Tindakan`)

  let medicationCount = 0
  for (const m of allMedications) {
    await prisma.masterMedication.upsert({
      where: { code: m.code as string },
      update: { name: m.name, description: m.description, unit: m.unit, baseTariff: m.baseTariff, tags: m.tags },
      create: m,
    })
    medicationCount++
  }
  console.log(`  ✅ ${medicationCount} Obat`)

  let practitionerCount = 0
  for (const p of allPractitioners) {
    await prisma.masterPractitioner.upsert({
      where: { nik: p.nik as string },
      update: { name: p.name, specialization: p.specialization, tags: p.tags },
      create: p,
    })
    practitionerCount++
  }
  console.log(`  ✅ ${practitionerCount} Practitioner`)

  console.log('\n✅ Seeding selesai!')
  console.log(`   Total: ${diagnosisCount + procedureCount + medicationCount + practitionerCount} records`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
