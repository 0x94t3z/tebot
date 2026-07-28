# Catatan Penyusunan Tugas Akhir

Dokumen ini berisi penjelasan pendukung untuk Tugas Akhir berjudul:

```text
Implementasi Metode Pattern Matching pada Chatbot Frequently Asked Questions: SAMSAT Bandung Timur
```

Fokus dokumen ini adalah membantu menjawab pertanyaan dosen saat bimbingan atau sidang, terutama tentang dataset, pengujian, pertanyaan random, dan cara maintenance sistem.

## Ringkasan Sistem

Chatbot ini adalah chatbot Telegram untuk FAQ SAMSAT Bandung Timur. Sistem tidak menggunakan AI generatif atau LLM. Sistem memakai metode **pattern matching berbasis aturan** untuk mencocokkan pertanyaan user dengan dataset FAQ.

Alur umum sistem:

```text
Input user di Telegram
  -> Telegram mengirim update ke webhook
  -> Cloudflare Worker menerima request
  -> sistem memvalidasi secret webhook
  -> sistem membaca command, callback button, atau teks user
  -> jika teks bebas, sistem menjalankan pattern matching
  -> sistem memilih FAQ terbaik atau fallback
  -> bot mengirim jawaban, sumber, voting, dan menu utama
  -> data riset dan voting disimpan di Cloudflare KV
```

## Metode Pattern Matching

Metode utama yang digunakan adalah **pattern matching**, sedangkan regex berperan sebagai teknik pendukung.

Proses pencocokan:

1. Input user dinormalisasi menjadi huruf kecil dan bentuk teks yang lebih seragam.
2. Tanda baca, variasi ejaan, dan istilah tertentu disamakan.
3. Input dipecah menjadi token.
4. Stop word umum diabaikan agar pencocokan fokus pada kata penting.
5. Beberapa sinonim sederhana diperluas.
6. Input dibandingkan dengan pertanyaan FAQ, kategori, custom pattern, dan regex pendukung.
7. Setiap kandidat FAQ diberi skor relevansi.
8. FAQ dengan skor tertinggi dipilih jika melewati ambang batas.
9. Jika tidak ada kandidat yang cukup relevan, bot mengirim fallback.

Penjelasan aman:

```text
Chatbot menerapkan metode pattern matching berbasis aturan. Input pengguna dinormalisasi, ditokenisasi, diperluas dengan aturan sinonim sederhana, lalu dibandingkan dengan pola FAQ. Regex digunakan sebagai teknik pendukung untuk normalisasi teks dan deteksi frasa spesifik, sedangkan pemilihan jawaban akhir dilakukan menggunakan pattern matching dan scoring.
```

## Peran Regex

Regex digunakan dalam dua bagian:

1. **Normalisasi teks**

   Contoh:

   - `drive-thru`, `drivethru`, dan `drive through` disamakan menjadi `drive thru`
   - `nopol`, `no polisi`, dan `nomor polisi` disamakan
   - `5 tahun`, `5 tahunan`, dan `lima tahunan` disamakan
   - `cabut berkas` diarahkan ke konteks mutasi
   - `gesek rangka` diarahkan ke konteks cek fisik

2. **Deteksi pola pertanyaan spesifik**

   Contoh:

   - STNK hilang
   - pajak lima tahunan
   - syarat mutasi
   - cek fisik untuk mutasi
   - pembayaran SIGNAL status belum berubah
   - TNKB/plat hilang atau rusak

Penjelasan aman:

```text
Regex tidak menggantikan metode pattern matching, tetapi memperkuat proses pencocokan. Regex membantu sistem mengenali variasi penulisan dan pola frasa tertentu, sementara keputusan akhir tetap menggunakan scoring pattern matching.
```

## Dataset 150 dan Test Case 209

Dataset FAQ aktif berisi **150 data FAQ**. Angka ini adalah jumlah data knowledge base yang digunakan chatbot.

Output test seperti:

```text
Tests  209 passed (209)
```

bukan jumlah data FAQ dan bukan jumlah pertanyaan user yang terjawab. Angka tersebut adalah jumlah **test case otomatis**.

Jadi:

```text
150 = jumlah data FAQ
209 = jumlah skenario pengujian otomatis
```

Jumlah test tidak harus menjadi `150 x 2 = 300`, karena pengujian tidak dibuat dengan cara mengalikan seluruh dataset dengan semua kemungkinan variasi pertanyaan. Test dibuat berdasarkan skenario black box yang mewakili kelas input.

Contoh skenario test:

- validasi jumlah dataset dan kategori
- pertanyaan asli FAQ
- pertanyaan dengan urutan kata dibalik
- pertanyaan natural dari user
- pertanyaan random tapi masih relevan
- pertanyaan di luar konteks yang harus fallback
- pesan multi-intent
- format balasan Telegram

Penjelasan aman:

```text
Dataset FAQ berjumlah 150 data, sedangkan 209 adalah jumlah test case otomatis. Jumlah test tidak dihitung dari perkalian dataset dengan seluruh variasi pertanyaan. Test case ditentukan berdasarkan skenario black box, seperti input FAQ valid, urutan kata dibalik, pertanyaan natural, multi-intent, dan fallback untuk pertanyaan di luar konteks.
```

## Black Box Testing

Pengujian otomatis sesuai dengan pendekatan **black box testing** karena test memeriksa hubungan input dan output tanpa mengharuskan penguji melihat proses internal scoring.

Contoh:

```text
Input:
Kalau STNK hilang bagaimana?

Output yang diharapkan:
FAQ tentang STNK hilang
```

Contoh lain:

```text
Input:
Saya mau bayar pajak sambil perpanjang paspor

Output yang diharapkan:
Fallback, karena paspor bukan layanan SAMSAT
```

Penjelasan aman:

```text
Pengujian dilakukan dengan metode black box karena sistem diuji berdasarkan input dan output. Penguji memberikan pertanyaan kepada chatbot, lalu hasilnya dibandingkan dengan output yang diharapkan, yaitu FAQ yang benar atau fallback jika pertanyaan berada di luar konteks.
```

## Uji Coba Melalui Telegram Bot

Test otomatis dengan Vitest dipakai untuk memastikan fungsi sistem berjalan benar sebelum deploy. Namun uji coba kepada responden tetap dilakukan melalui **Telegram bot**, karena Telegram adalah media implementasi chatbot.

Perbedaan pengujian:

| Jenis Pengujian | Media | Tujuan |
| --- | --- | --- |
| Test otomatis | Vitest | Memvalidasi fungsi pattern matching, fallback, multi-intent, dan format balasan |
| Uji coba responden | Telegram bot | Menguji pengalaman user dan mengumpulkan voting kepuasan jawaban |

Penjelasan aman:

```text
Pengujian sistem dilakukan dengan dua pendekatan. Pertama, pengujian otomatis menggunakan Vitest untuk memvalidasi fungsi pattern matching. Kedua, pengujian kepada responden dilakukan melalui Telegram bot karena Telegram merupakan media implementasi chatbot dalam penelitian ini.
```

## Batasan Pertanyaan Random

Pertanyaan random atau pertanyaan tidak biasa digunakan sebagai skenario uji yang mewakili kemungkinan input user. Pertanyaan random tidak perlu ditambahkan tanpa batas, karena variasi bahasa user sangat banyak dan terus berubah.

Karena sistem menggunakan pattern matching dan regex, sistem tidak dapat memahami semua variasi bahasa seperti LLM atau AI generatif. Jika ada pola pertanyaan baru yang belum dikenali, sistem perlu diperbarui.

Penjelasan aman:

```text
Pertanyaan random diuji sebagai skenario yang mewakili kemungkinan input user, bukan sebagai daftar tidak terbatas. Karena chatbot menggunakan metode pattern matching berbasis aturan dengan dukungan regex, sistem tidak dapat memahami semua variasi bahasa seperti LLM. Jika ditemukan pola pertanyaan valid yang baru, sistem perlu diperbarui melalui penambahan data FAQ, custom pattern, regex pendukung, dan regression test.
```

## Jika Dosen Menguji Pertanyaan Baru

Jika dosen atau penguji mencoba pertanyaan baru dan bot belum menjawab dengan benar, lakukan maintenance dengan urutan berikut.

### 1. Update Dataset

File:

```text
src/data/faq-samsat-bandung-timur.json
```

Update dataset dilakukan jika:

- pertanyaan membutuhkan jawaban baru
- jawaban lama kurang lengkap
- sumber referensi perlu diperbarui
- kategori perlu disesuaikan

Field yang diperhatikan:

| Field | Fungsi |
| --- | --- |
| `id` | ID FAQ |
| `category` | Kategori FAQ |
| `question` | Pertanyaan utama |
| `answer` | Jawaban yang dikirim bot |
| `source` | Sumber referensi |

Jika pertanyaan baru hanya variasi kalimat dari FAQ yang sudah ada, jangan langsung membuat FAQ duplikat. Lebih baik tambahkan custom pattern.

### 2. Tambah Custom Pattern

File:

```text
src/pattern-matcher.ts
```

Bagian:

```ts
const customPatterns: Record<number, string[]> = {
```

Custom pattern digunakan jika jawaban sudah ada, tetapi user bertanya dengan gaya bahasa berbeda.

Contoh:

```ts
80: [
  "bayar pajak pemilik meninggal",
  "bapak meninggal bayar pajak",
  "stnk masih atas nama beliau bayar pajak"
]
```

Maksudnya, beberapa variasi pertanyaan tersebut tetap diarahkan ke FAQ ID `80`.

### 3. Tambah Regex Pendukung

File:

```text
src/pattern-matcher.ts
```

Bagian:

```ts
const regexPatterns: Record<number, RegexPatternSpec[]> = {
```

Regex ditambahkan jika pola pertanyaan punya struktur yang bisa muncul dalam banyak bentuk.

Contoh:

```ts
80: [{
  pattern: /\b(ayah|bapak|pemilik).*\b(meninggal).*\b(pajak|bayar)\b/,
  label: "regex:pajak pemilik meninggal",
  score: 340
}]
```

Regex harus dibuat spesifik agar tidak menangkap pertanyaan yang tidak relevan.

### 4. Tambah Test Case

File:

```text
test/pattern-matcher.test.ts
```

Tambahkan test berdasarkan pertanyaan yang gagal.

Contoh:

```ts
[
  "Bapak saya sudah meninggal dan STNK motor masih atas nama beliau, saya mau bayar pajak tahunan apakah harus balik nama dulu?",
  80,
  "Balik Nama"
]
```

Tujuannya agar pertanyaan yang pernah gagal tidak gagal lagi setelah update berikutnya.

### 5. Jalankan Pengecekan

```sh
npm test
npm run typecheck
git diff --check
```

Jika semua aman, baru deploy:

```sh
npx wrangler deploy --secrets-file .env
```

Penjelasan aman:

```text
Jika ditemukan pola pertanyaan valid baru saat pengujian, sistem diperbarui secara sistematis. Pertama, dataset FAQ dicek untuk menentukan apakah perlu jawaban baru. Jika jawaban sudah ada, custom pattern atau regex pendukung ditambahkan agar variasi pertanyaan tersebut dapat dikenali. Setelah itu, test case regresi ditambahkan menggunakan pertanyaan yang sebelumnya gagal, sehingga perubahan berikutnya tidak merusak skenario yang sama.
```

## Jawaban Singkat untuk Presentasi

### Apa metode yang digunakan?

Metode yang digunakan adalah pattern matching berbasis aturan, dengan dukungan normalisasi teks, stop word removal, sinonim sederhana, custom pattern, regex pendukung, dan scoring.

### Apakah chatbot menggunakan AI?

Tidak. Chatbot tidak menggunakan AI generatif. Sistem mencocokkan pertanyaan user dengan dataset FAQ.

### Mengapa dataset disimpan di JSON?

Dataset disimpan di JSON agar data FAQ terpisah dari logic algoritma. Dengan begitu data lebih mudah diperbarui tanpa mengubah struktur utama program.

### Mengapa test case 209, bukan 300?

Karena 209 adalah jumlah skenario pengujian otomatis, bukan hasil perkalian jumlah dataset dengan variasi pertanyaan. Pengujian menggunakan pendekatan black box berbasis skenario.

### Apakah pertanyaan random harus semua ditambahkan?

Tidak. Pertanyaan random digunakan sebagai sampel skenario. Jika ditemukan pola valid baru, sistem diperbarui melalui dataset, custom pattern, regex pendukung, dan test case.

### Kenapa perlu Telegram untuk uji coba?

Karena Telegram adalah media implementasi chatbot. Test otomatis memvalidasi fungsi sistem, sedangkan uji coba Telegram memvalidasi pengalaman user dan voting kepuasan jawaban.

