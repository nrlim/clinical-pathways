# Panduan Pengguna: Halaman Clinical Insight & Plan

> Dokumen ini menjelaskan setiap bagian yang tampil setelah proses analisis SnapPath selesai — apa artinya, dari mana datanya, dan bagaimana cara membacanya.

---

## Dari Mana Data Berasal?

Halaman ini menggabungkan tiga sumber informasi:

| Sumber | Penjelasan |
|---|---|
| **Data yang Anda isi** | Informasi pasien, tindakan, obat, diagnosa, dan outcome yang dimasukkan ke dalam formulir |
| **Katalog Standar RS** | Daftar resmi tindakan, obat, ICD-10, dan tarif yang berlaku di rumah sakit Anda |
| **Analisis AI** | Hasil penilaian klinis yang dihasilkan secara otomatis berdasarkan kedua data di atas |

> **Catatan penting:** Skor validasi dan status setiap item (tindakan/obat) **tidak ditentukan oleh AI**, melainkan dihitung secara otomatis berdasarkan kecocokan dengan katalog standar rumah sakit Anda. AI hanya memberikan penjelasan klinis dan narasi pendukungnya.

---

## Bagian A — Ringkasan SnapPath

Ini adalah bagian pertama yang muncul, memberikan gambaran cepat kondisi keseluruhan episode rawat pasien.

---

### A.1 · Penanda Sumber Data

Di bagian paling atas terdapat label kecil yang menunjukkan apakah ringkasan sudah melewati analisis AI atau belum.

- **"Data dari Analisis AI"** — Ringkasan sudah diverifikasi secara lengkap. Angka-angka yang tampil sudah melalui proses validasi penuh.
- **"Data dari Input Form"** — Analisis AI belum dijalankan. Angka yang tampil adalah hasil kalkulasi langsung dari data yang Anda isi, belum divalidasi.

---

### A.2 · Skor Validasi

```
Skor: 72 / 100
Status: Perlu Review
6 dari 8 item tindakan/obat lolos validasi · 75% tingkat kesesuaian
⚠ Rp 450.000 perlu ditinjau lebih lanjut
```

Skor ini mencerminkan seberapa sesuai keseluruhan episode rawat pasien dengan standar klinis dan katalog rumah sakit.

**Cara membaca skor:**

| Rentang Skor | Status | Artinya |
|---|---|---|
| **80 – 100** | ✅ Baik | Semua atau hampir semua item sesuai standar |
| **50 – 79** | ⚠️ Perlu Review | Ada beberapa item yang perlu diperiksa lebih lanjut |
| **0 – 49** | ❌ Tidak Sesuai | Banyak item yang tidak sesuai, butuh perhatian segera |

**Apa yang dihitung dalam skor ini?**

Skor ditentukan oleh **tiga hal** secara bersamaan:

1. **Apakah tindakan/obat terdaftar aktif di katalog standar RS?**
   Item yang tidak ditemukan atau sudah tidak aktif di katalog akan mengurangi skor.

2. **Apakah dokter sudah menyatakan bahwa item sesuai dengan diagnosa?**
   Jika pada formulir ada tindakan/obat yang ditandai "Tidak Sesuai" oleh dokter, item tersebut akan mempengaruhi skor.

3. **Apakah harga yang diinputkan masih dalam batas toleransi?**
   Jika harga tindakan atau obat menyimpang terlalu jauh dari tarif standar katalog, item tersebut akan masuk kategori "Perlu Review".

---

### A.3 · Ringkasan Biaya & Durasi Rawat

```
┌─────────────┬─────────────┬─────────────┬──────────────┐
│  Tindakan   │    Obat     │ Grand Total │  Aktual LOS  │
│  Rp 1.2 jt  │  Rp 800 rb  │  Rp 2 jt   │   5 hari     │
└─────────────┴─────────────┴─────────────┴──────────────┘
```

| Metrik | Penjelasan |
|---|---|
| **Tindakan** | Total biaya seluruh tindakan medis yang diinputkan (harga satuan × jumlah) |
| **Obat** | Total biaya seluruh obat yang diinputkan (harga satuan × jumlah) |
| **Grand Total** | Gabungan total biaya tindakan dan obat |
| **Aktual LOS** | Jumlah hari rawat aktual, dihitung dari tanggal masuk hingga tanggal keluar |

**Apakah lama rawat sesuai standar?**

Sistem secara otomatis membandingkan lama rawat aktual pasien dengan standar lama rawat yang ditetapkan untuk diagnosa tersebut. Hasilnya ditampilkan sebagai:

- 🔴 **Overstay** — Pasien dirawat lebih lama dari standar. Ini ditandai dengan persentase kelebihan hari rawat.
- 🟡 **Understay** — Pasien dipulangkan lebih cepat dari standar. Ini bisa mengindikasikan perlunya verifikasi kondisi pasien saat pulang.

Jika tidak ada penyimpangan signifikan, penanda ini tidak akan muncul.

---

### A.4 · Evaluasi Kesesuaian Klinis

Daftar poin-poin yang menunjukkan seberapa sesuai episode rawat ini dengan standar klinis:

| Poin Evaluasi | Artinya |
|---|---|
| **Tindakan & Obat sesuai diagnosa** | Berapa item yang lolos validasi dibanding total item yang ada |
| **Item perlu review** | Jumlah tindakan/obat yang perlu diperiksa lebih lanjut sebelum klaim |
| **Item tidak sesuai** | Jumlah tindakan/obat yang teridentifikasi tidak sesuai dengan diagnosa atau katalog |
| **Rawat inap sesuai indikasi** | Apakah keputusan rawat inap sudah sesuai indikasi klinis yang valid |

---

## Bagian B — Laporan Klinis AI

Ini adalah laporan lengkap yang dihasilkan oleh AI berdasarkan seluruh data yang ada. Laporan ini dirancang sebagai **alat bantu pengambilan keputusan klinis**, bukan pengganti keputusan dokter.

---

### B.1 · Ringkasan Eksekutif & Sinopsis Klinis

Bagian pertama laporan berisi dua paragraf utama:

**Ringkasan Eksekutif**
Gambaran singkat namun menyeluruh mengenai kondisi pasien, rencana perawatan yang berjalan, dan proyeksi hasil rawat. Cocok dibaca oleh manajemen atau pimpinan klinis untuk mendapat gambaran cepat.

**Sinopsis Klinis**
Narasi lengkap perjalanan klinis pasien: dari kondisi saat masuk, perkembangan selama perawatan, terapi yang diberikan, hingga status terkini. Ditulis dalam bahasa klinis untuk dibaca oleh tim medis.

---

### B.2 · Assessment Klinis & Alasan Validasi

Dua panel bersebelahan:

**Assessment Kerja**
Penilaian klinis menyeluruh dari perspektif tim multidisiplin (dokter, perawat, apoteker, case manager). Berisi penilaian kondisi medis pasien secara holistik.

**Alasan Validasi**
Penjelasan mengapa setiap kategori dinilai sesuai atau tidak:
- **Tindakan** — Apakah tindakan yang dilakukan relevan dengan diagnosa pasien?
- **Obat** — Apakah obat yang diberikan sesuai dengan diagnosa, dosis, dan formularium?
- **Rawat Inap** — Apakah keputusan rawat inap memang terindikasi secara klinis?
- **Lama Rawat** — Apakah durasi rawat sesuai atau menyimpang dari standar? (jika ada penyimpangan signifikan, akan muncul keterangan OVERSTAY atau UNDERSTAY)

---

### B.3 · Tujuan Perawatan

Daftar target klinis yang harus dicapai selama episode rawat ini. Contoh:
- Stabilisasi saturasi oksigen di atas 95%
- Kontrol demam dalam 24 jam pertama
- Pemberian antibiotik empiris sesuai panduan

Tujuan ini spesifik untuk kondisi dan diagnosa pasien yang bersangkutan.

---

### B.4 · Rencana Perawatan Harian (Day-by-Day)

Panduan perawatan yang disusun per hari, sesuai dengan perkiraan lama rawat pasien. Setiap hari berisi:

| Kolom | Isi |
|---|---|
| **Asesmen** | Hal-hal yang perlu diperiksa/dinilai pada hari tersebut |
| **Intervensi** | Tindakan medis yang direncanakan |
| **Obat** | Pertimbangan pemberian atau penyesuaian obat |
| **Monitoring** | Parameter klinis yang perlu dipantau (misal: tekanan darah, saturasi O2) |
| **Kriteria Pulang** | Kondisi yang harus tercapai sebelum pasien dipulangkan pada hari tersebut |

> Rencana ini adalah panduan klinis berbasis bukti, bukan instruksi tetap. Keputusan akhir tetap berada di tangan DPJP.

---

### B.5 · Peta Risiko Klinis

Daftar risiko klinis yang teridentifikasi untuk pasien ini, dilengkapi dengan tingkat keparahan dan rencana tindak lanjutnya.

| Tingkat Risiko | Artinya |
|---|---|
| 🟢 **Rendah** | Risiko kecil, pantau rutin |
| 🟡 **Sedang** | Perlu atensi, siapkan rencana antisipasi |
| 🔴 **Tinggi** | Butuh penanganan aktif, waspadai eskalasi |
| ⚫ **Kritis** | Kondisi mengancam jiwa, perlu respons segera |

Setiap risiko dilengkapi dengan:
- Nama risiko dan alasan mengapa risiko ini relevan untuk pasien
- Rekomendasi tindakan pencegahan atau penanganan

---

### B.6 · Varians Pathway

Bagian ini menampilkan **penyimpangan** yang terdeteksi dari jalur perawatan standar. Varians bisa terjadi di area:

- **Diagnosa** — Ketidaksesuaian kode ICD yang digunakan
- **Tindakan** — Tindakan yang dilakukan di luar protokol standar
- **Obat** — Pemberian obat yang tidak ada dalam formularium atau tidak sesuai indikasi
- **Lama Rawat** — Durasi yang menyimpang dari standar klinis
- **Biaya** — Tarif yang menyimpang dari referensi katalog

Setiap varians dilengkapi penjelasan dampak potensialnya (klinis maupun administratif/klaim) dan rekomendasi tindak lanjut.

Jika tidak ada varians yang terdeteksi, bagian ini akan menampilkan pesan bahwa episode rawat berjalan sesuai pathway standar.

---

### B.7 · Kesiapan Pemulangan

Penilaian apakah pasien sudah siap untuk dipulangkan, berdasarkan kondisi klinis yang ada.

**Status Kesiapan:**

| Status | Artinya |
|---|---|
| ✅ **Siap** | Semua kriteria klinis terpenuhi, pasien dapat dipulangkan |
| ⚠️ **Perlu Review** | Ada hal yang masih perlu dikonfirmasi sebelum memutuskan pemulangan |
| ❌ **Belum Siap** | Masih ada kondisi klinis yang menghalangi pemulangan |

Bagian ini juga menampilkan:

- **Kriteria yang sudah terpenuhi** — Kondisi medis yang sudah aman
- **Penghambat pemulangan** — Kondisi yang masih perlu diatasi
- **Rencana tindak lanjut** — Jadwal kontrol, terapi lanjutan, atau rujukan setelah pulang
- **Edukasi pasien** — Poin penting yang perlu dijelaskan kepada pasien dan keluarga sebelum pulang

---

### B.8 · Ringkasan untuk Setiap Peran

Laporan ini otomatis menghasilkan empat versi ringkasan yang disesuaikan dengan kebutuhan masing-masing:

| Untuk Siapa | Isi Ringkasan |
|---|---|
| **Dokter / Klinisi** | Ringkasan medis lengkap dengan terminologi klinis, mencakup kondisi, terapi, dan rekomendasi klinis |
| **Staf Koding / Klaim** | Ringkasan yang fokus pada kode tindakan, kode diagnosa, dan implikasi terhadap klaim BPJS atau asuransi |
| **Pasien / Keluarga** | Penjelasan kondisi dan rencana perawatan dalam bahasa sehari-hari yang mudah dimengerti |
| **Tim Manajemen Katalog** | Daftar tindakan dan obat yang perlu ditambahkan atau diperbarui di katalog standar RS |

---

### B.9 · Catatan Keselamatan & Isu Data

Dua panel peringatan di bagian bawah laporan:

**🚨 Catatan Keselamatan**
Peringatan yang berkaitan dengan keselamatan pasien — misalnya obat yang tidak aktif di formularium, atau kombinasi yang perlu diwaspadai.

**🔎 Isu Kualitas Data**
Temuan mengenai kelengkapan dan konsistensi data yang diinputkan — misalnya tindakan yang tidak ditemukan di katalog, atau data dokter yang tidak terdaftar.

> Isu-isu ini bersifat **informatif dan membantu Anda melengkapi data**, bukan sebuah penolakan atau sanksi.

---

## Catatan Umum

- Seluruh analisis di halaman ini bersifat **alat bantu pengambilan keputusan klinis**. Keputusan akhir tetap menjadi tanggung jawab DPJP dan tim klinis.
- Laporan ini dapat digunakan sebagai **bahan diskusi tim multidisiplin** maupun sebagai **dokumen pendukung klaim**.
- Semakin lengkap data yang diinputkan, semakin akurat dan relevan hasil analisis yang dihasilkan.

---

*Panduan ini berlaku untuk versi SnapPath yang sedang berjalan. Jika ada perubahan fitur atau tampilan, dokumen ini akan diperbarui.*
