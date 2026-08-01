# Manual Penelitian

Dokumen ini berisi penjelasan pendukung untuk Tugas Akhir berjudul:

```text
Implementasi Metode Pattern Matching pada Chatbot Frequently Asked Questions: SAMSAT Bandung Timur
```

Dokumen ini disiapkan untuk menjawab pertanyaan yang kemungkinan muncul saat bimbingan atau sidang: dataset, pengujian, pertanyaan random, dan cara merawat pattern ketika ada input baru yang belum dikenali.

Laporan akademik utama:

- [Laporan Akademik Bab 4 dan Bab 5](laporan-akademik.md)

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
4. Stop word umum diabaikan agar pencocokan fokus pada kata yang membawa makna.
5. Beberapa sinonim sederhana diperluas.
6. Input dibandingkan dengan pertanyaan FAQ, kategori, custom pattern, dan regex pendukung.
7. Setiap kandidat FAQ diberi nilai relevansi.
8. FAQ dengan nilai relevansi tertinggi dipilih jika melewati ambang batas.
9. Jika tidak ada kandidat yang cukup relevan, bot mengirim fallback.

Kalimat yang bisa dipakai:

```text
Chatbot menerapkan metode pattern matching berbasis aturan. Input pengguna dinormalisasi, ditokenisasi, diperluas dengan aturan sinonim sederhana, lalu dibandingkan dengan pola FAQ. Regex digunakan sebagai teknik pendukung untuk normalisasi teks dan deteksi frasa spesifik, sedangkan pemilihan jawaban akhir dilakukan menggunakan pattern matching dan perhitungan nilai relevansi.
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

Kalimat yang bisa dipakai:

```text
Regex tidak menggantikan pattern matching. Regex membantu sistem mengenali variasi penulisan dan pola frasa tertentu. Keputusan akhir tetap memakai perhitungan nilai relevansi pattern matching.
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

Kalimat yang bisa dipakai:

```text
Dataset FAQ berjumlah 150 data, sedangkan 209 adalah jumlah test case otomatis. Jumlah test tidak dihitung dari perkalian dataset dengan seluruh variasi pertanyaan. Test case ditentukan berdasarkan skenario black box, seperti input FAQ valid, urutan kata dibalik, pertanyaan natural, multi-intent, dan fallback untuk pertanyaan di luar konteks.
```

## Isi Test Case Otomatis

Bagian ini boleh dijelaskan kepada pembimbing sebagai **validasi teknis internal**. Namun, jangan diposisikan sebagai satu-satunya hasil pengujian penelitian. Hasil utama tetap berasal dari pengujian chatbot melalui Telegram, sedangkan test otomatis dipakai untuk memastikan logic sistem tidak berubah atau rusak setelah dataset, pattern, atau regex diperbarui.

Isi test case otomatis dibagi menjadi dua bagian besar.

### 1. Test Pattern Matching

File:

```text
test/pattern-matcher.test.ts
```

Test ini memeriksa kemampuan sistem dalam mencocokkan pertanyaan user ke FAQ yang benar. Isi pengujiannya meliputi:

| Kelompok Test | Tujuan |
| --- | --- |
| Validasi dataset | Memastikan dataset aktif berjumlah 150 FAQ dan jumlah data per kategori sesuai |
| Pertanyaan resmi FAQ | Memastikan setiap pertanyaan utama di dataset cocok ke ID FAQ asalnya |
| Urutan kata dibalik | Memastikan sistem tidak bergantung pada urutan kalimat yang persis sama |
| Variasi regex | Memastikan variasi seperti `drive-thru`, `drivethru`, `pajak 5 tahunan`, `pajak lima tahunan`, `cabut berkas`, dan `gesek rangka` tetap dikenali |
| Pertanyaan natural | Memastikan pertanyaan seperti `Kalau STNK hilang bagaimana?` tetap masuk ke FAQ yang tepat |
| Slang dan variasi ejaan | Memastikan kata seperti `ilang`, `raib`, `seken`, atau `nopol` tetap dapat dikenali jika masih relevan |
| Pertanyaan panjang hasil audit | Memastikan kasus yang lebih kompleks, seperti STNK hilang saat pajak menunggak, TNKB hilang karena banjir, SIGNAL status belum berubah, kendaraan warisan, leasing, mutasi, dan balik nama tetap terjawab sesuai FAQ |
| Pertanyaan di luar cakupan layanan | Memastikan pertanyaan yang masih menyebut SAMSAT tetapi membahas layanan di luar administrasi SAMSAT, seperti perbaikan kendaraan, pembuatan kunci kendaraan, atau pembelian cat kendaraan, tidak salah dicocokkan ke FAQ |
| Multi-intent | Memastikan satu pesan yang berisi lebih dari satu pertanyaan dapat menghasilkan lebih dari satu jawaban jika masih dalam konteks SAMSAT |
| Kategori callback | Memastikan label kategori dari tombol Telegram tetap dibaca dengan benar oleh sistem |

Contoh penjelasan lisan:

```text
Test pattern matching dipakai untuk mengecek apakah input user diarahkan ke FAQ yang benar. Test ini mencakup pertanyaan asli dari dataset, pertanyaan natural, urutan kata yang berubah, variasi regex, pertanyaan panjang, multi-intent, dan fallback untuk input di luar cakupan layanan SAMSAT.
```

### 2. Test Format Balasan Telegram

File:

```text
test/replies.test.ts
```

Test ini memeriksa tampilan dan struktur balasan chatbot yang dikirim ke Telegram. Isi pengujiannya meliputi:

| Kelompok Test | Tujuan |
| --- | --- |
| Menu kategori | Memastikan daftar pertanyaan per kategori hanya menampilkan maksimal 7 pertanyaan per halaman |
| Navigasi menu | Memastikan tombol `Berikutnya`, `Sebelumnya`, dan `Kembali ke kategori` muncul pada kondisi yang benar |
| Menu utama | Memastikan kategori utama memiliki icon dan callback yang sesuai |
| Pesan pembuka | Memastikan `/start` menampilkan sapaan dan instruksi penggunaan yang jelas |
| Format jawaban | Memastikan jawaban menampilkan `Pertanyaan`, isi jawaban, sumber, dan voting pengguna |
| Kebersihan tampilan | Memastikan label teknis seperti `Jawaban:`, `Kategori:`, `Nilai akurasi:`, dan `rating` tidak ditampilkan ke user |
| Voting kepuasan | Memastikan tombol `Memuaskan` dan `Tidak memuaskan` terbentuk dengan benar |
| Sumber ganda | Memastikan beberapa sumber ditampilkan sebagai `Sumber 1`, `Sumber 2`, dan seterusnya |
| Input selain teks | Memastikan media seperti foto, video, atau file ditolak karena bot hanya mendukung teks |
| Fallback | Memastikan pesan fallback menjelaskan bahwa bot hanya menjawab pertanyaan seputar SAMSAT Bandung Timur |

Contoh penjelasan lisan:

```text
Test format balasan Telegram dipakai untuk memastikan output chatbot tetap rapi dan sesuai kebutuhan user. Yang diuji bukan hanya jawabannya, tetapi juga menu, tombol navigasi, voting kepuasan, sumber, dan fallback.
```

Kesimpulan yang bisa disampaikan:

```text
Jadi, 209 test case otomatis bukan berarti 209 responden atau 209 pertanyaan penelitian utama. Angka tersebut adalah jumlah validasi teknis internal untuk memastikan pattern matching, regex pendukung, fallback, multi-intent, dan tampilan balasan Telegram berjalan sesuai rancangan sebelum chatbot diuji langsung melalui Telegram.
```

## Black Box Testing

Pengujian otomatis sesuai dengan pendekatan **black box testing** karena test memeriksa hubungan input dan output tanpa mengharuskan penguji melihat proses internal perhitungan nilai relevansi.

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
Motor mogok bisa diperbaiki di SAMSAT Bandung Timur?

Output yang diharapkan:
Fallback, karena perbaikan kendaraan bukan layanan administrasi SAMSAT dalam dataset FAQ
```

Kalimat yang bisa dipakai:

```text
Pengujian dilakukan dengan metode black box karena sistem diuji berdasarkan input dan output. Penguji memberikan pertanyaan kepada chatbot, lalu hasilnya dibandingkan dengan output yang diharapkan, yaitu FAQ yang benar atau fallback jika pertanyaan berada di luar konteks.
```

## Uji Coba Melalui Telegram Bot

Test otomatis dengan Vitest dipakai untuk memastikan fungsi sistem berjalan benar sebelum deploy. Uji coba kepada responden tetap dilakukan melalui **Telegram bot**, karena Telegram adalah media implementasi chatbot.

Perbedaan pengujian:

| Jenis Pengujian | Media | Tujuan |
| --- | --- | --- |
| Test otomatis | Vitest | Memvalidasi fungsi pattern matching, fallback, multi-intent, dan format balasan |
| Uji coba responden | Telegram bot | Menguji pengalaman user dan mengumpulkan voting kepuasan jawaban |

Kalimat yang bisa dipakai:

```text
Pengujian sistem dilakukan lewat dua jalur. Vitest dipakai untuk memeriksa fungsi pattern matching. Uji coba responden dilakukan lewat Telegram bot karena Telegram adalah media tempat chatbot dipakai.
```

## Data Responden dan Data Kepuasan

Data responden dan data kepuasan boleh disimpan secara terpisah pada level teknis, karena keduanya memiliki fungsi yang berbeda:

| Data | Fungsi |
| --- | --- |
| Data responden | Menyimpan identitas dasar pengguna Telegram yang mencoba chatbot |
| Data voting per user | Menyimpan pilihan `Memuaskan` atau `Tidak memuaskan` dari user untuk satu FAQ |
| Rekap kepuasan per FAQ | Menghitung total dan persentase voting untuk setiap FAQ |

Aturan voting pada sistem adalah satu responden hanya memiliki satu vote aktif untuk satu FAQ ID. Kunci penyimpanan voting memakai kombinasi `faq_id` dan `telegram_id`, sehingga jika responden mengganti pilihan pada FAQ yang sama, sistem memperbarui record lama dan mengoreksi total vote. Dengan cara ini, perubahan pilihan tetap diperbolehkan, tetapi tidak dihitung sebagai suara ganda.

Walaupun disimpan terpisah, data tersebut harus bisa digabung untuk analisis penelitian. Pada sistem ini, export gabungan tersedia melalui:

```sh
npm run export:responses
npm run export:responses:txt
npm run export:responses:html
```

Command tersebut otomatis menyimpan hasil export ke folder:

```text
research/
```

File yang dihasilkan:

```text
research/responses.csv
research/responses.txt
research/responses.html
research/summary.txt
research/summary.html
```

Export gabungan ini menampilkan satu baris untuk satu penilaian jawaban FAQ. Kolomnya memuat Telegram ID, username, nama, bahasa, waktu mulai, terakhir aktif, FAQ ID, kategori, pertanyaan, jawaban, pilihan kepuasan, dan waktu vote.

Kalimat yang bisa dipakai:

```text
Pada implementasi sistem, data responden dan data voting disimpan terpisah agar struktur penyimpanan lebih rapi dan tidak menduplikasi data profil user. Data voting memakai kombinasi FAQ ID dan Telegram ID agar satu responden hanya memiliki satu vote aktif untuk satu jawaban FAQ. Jika responden mengganti pilihan, record voting diperbarui dan total statistik dikoreksi. Untuk analisis penelitian, sistem menyediakan export gabungan yang menyatukan responden, pertanyaan FAQ, jawaban, pilihan kepuasan, dan waktu voting. Jadi hubungan antara responden dan penilaian jawaban tetap dapat dilihat dalam satu tabel.
```

## Command Sistem dan Request API

Bagian ini menjelaskan command yang dipakai dalam proyek, fungsi command tersebut, dan bentuk request API yang sebenarnya dijalankan. Penjelasan ini dapat digunakan ketika pembimbing menanyakan dari mana data export berasal dan bagaimana prosesnya di dalam kode.

### Ringkasan Command

Command ditulis di file:

```text
package.json
```

Bagian:

```json
"scripts": {
  "deploy": "wrangler deploy --secrets-file .env",
  "health": "tsx tools/bot-admin.ts health",
  "webhook:set": "tsx tools/bot-admin.ts set-webhook",
  "webhook:info": "tsx tools/bot-admin.ts webhook-info",
  "export:research": "tsx tools/bot-admin.ts export research csv",
  "export:responses": "tsx tools/bot-admin.ts export responses csv --output research/responses.csv",
  "export:responses:txt": "tsx tools/bot-admin.ts export responses txt --output research/responses.txt",
  "export:responses:html": "tsx tools/bot-admin.ts export responses html --output research/responses.html",
  "export:summary": "tsx tools/bot-admin.ts summary txt --input research/responses.csv --output research/summary.txt",
  "export:summary:txt": "tsx tools/bot-admin.ts summary txt --input research/responses.csv --output research/summary.txt",
  "export:summary:html": "tsx tools/bot-admin.ts summary html --input research/responses.csv --output research/summary.html",
  "export:satisfaction": "tsx tools/bot-admin.ts export satisfaction csv",
  "relevance": "tsx tools/check-relevance.ts",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

Fungsi command:

| Command | Fungsi |
| --- | --- |
| `npm run deploy` | Deploy kode chatbot ke Cloudflare Workers dengan secret dari `.env` |
| `npm run health` | Mengecek apakah Worker aktif melalui endpoint `/health` |
| `npm run webhook:set` | Mendaftarkan URL webhook Worker ke server Telegram |
| `npm run webhook:info` | Mengecek URL webhook Telegram yang sedang aktif |
| `npm run export:research` | Export profil responden dalam format CSV |
| `npm run export:research:txt` | Export profil responden dalam bentuk tabel teks |
| `npm run export:research:html` | Export profil responden dalam HTML |
| `npm run export:responses` | Export gabungan responden, FAQ, pilihan kepuasan, dan waktu vote ke `research/responses.csv` |
| `npm run export:responses:txt` | Export gabungan ke `research/responses.txt` |
| `npm run export:responses:html` | Export gabungan ke `research/responses.html` |
| `npm run export:summary` | Membuat ringkasan TXT dari `research/responses.csv` ke `research/summary.txt` |
| `npm run export:summary:txt` | Alias untuk membuat ringkasan TXT ke `research/summary.txt` |
| `npm run export:summary:html` | Membuat ringkasan HTML dari `research/responses.csv` ke `research/summary.html` |
| `npm run export:satisfaction` | Export rekap kepuasan per FAQ dalam CSV |
| `npm run export:satisfaction:txt` | Export rekap kepuasan per FAQ dalam tabel teks |
| `npm run export:satisfaction:html` | Export rekap kepuasan per FAQ dalam HTML |
| `npm run relevance -- "pertanyaan"` | Melihat proses normalisasi, token, stop word, regex, dan hasil pattern matching untuk satu input |
| `npm run typecheck` | Memeriksa kesalahan tipe TypeScript |
| `npm test` | Menjalankan test otomatis pattern matching dan format balasan Telegram |

Command export yang paling disarankan untuk analisis penelitian adalah:

```sh
npm run export:responses
```

Alasannya, data ini sudah menggabungkan responden dan penilaian jawaban. Satu baris berarti satu responden memberi satu penilaian terhadap satu FAQ.

Setelah data gabungan tersedia, ringkasan penelitian dapat dibuat dengan command:

```sh
npm run export:summary
npm run export:summary:txt
npm run export:summary:html
```

Command tersebut otomatis mengambil data terbaru dari Worker melalui endpoint `/responses.csv`, menyimpannya ke `research/responses.csv`, lalu membuat rekap jumlah responden, total penilaian, persentase `Memuaskan` dan `Tidak memuaskan`, rekap per kategori, rekap per responden, serta FAQ yang paling banyak mendapat penilaian. Dengan demikian, `responses.csv` tetap menjadi data mentah utama, sedangkan `summary.txt` dan `summary.html` menjadi hasil olahan awal untuk membantu pembahasan Bab IV.

Jika hanya ingin membuat ringkasan dari file lokal tanpa mengambil data terbaru dari Worker, gunakan opsi:

```sh
npm run export:summary -- --offline
```

### Command Export dan Request API Asli

Command npm hanya dibuat agar penggunaan lebih mudah. Di balik command tersebut, sistem tetap melakukan request HTTP ke endpoint Worker.

Contoh command:

```sh
npm run export:responses
```

Secara internal command tersebut menjalankan:

```sh
tsx tools/bot-admin.ts export responses csv --output research/responses.csv
```

File:

```text
tools/bot-admin.ts
```

Pada file tersebut, `.env` dibaca otomatis, lalu script mengirim request ke Worker:

```ts
const response = await fetch(`${getWorkerUrl()}/${dataset}.${format}`, {
  headers: {
    Authorization: `Bearer ${requireEnv("ADMIN_EXPORT_TOKEN")}`
  }
});
```

Jika dijalankan secara manual tanpa npm script, bentuk request API-nya adalah:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/responses.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Perbedaannya, command npm otomatis menyimpan hasil request ke file:

```text
research/responses.csv
```

Untuk export lain:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"

curl "https://samsat-bandung-timur-bot.samsat.workers.dev/satisfaction.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Format yang tersedia:

| Endpoint | Fungsi |
| --- | --- |
| `/research.csv` | Data profil responden |
| `/research.txt` | Data profil responden dalam tabel teks |
| `/research.html` | Data profil responden dalam HTML |
| `/responses.csv` | Data gabungan responden dan voting |
| `/responses.txt` | Data gabungan dalam tabel teks |
| `/responses.html` | Data gabungan dalam HTML |
| `/satisfaction.csv` | Rekap kepuasan per FAQ |
| `/satisfaction.txt` | Rekap kepuasan per FAQ dalam tabel teks |
| `/satisfaction.html` | Rekap kepuasan per FAQ dalam HTML |

Endpoint di atas dipakai untuk mengambil data dari Worker. Command `npm run export:summary`, `npm run export:summary:txt`, dan `npm run export:summary:html` juga mengambil data terbaru terlebih dahulu agar ringkasan tidak bergantung pada file lokal lama. Alurnya adalah:

```text
npm run export:summary
  -> tools/bot-admin.ts request GET /responses.csv
  -> sistem menyimpan data terbaru ke research/responses.csv
  -> tools/bot-admin.ts membaca research/responses.csv
  -> sistem membuat research/summary.txt
```

Untuk versi HTML, alurnya sama, tetapi output yang dibuat adalah `research/summary.html`. File ringkasan ini dapat dipakai sebagai bahan awal tabel rekap, sedangkan angka final tetap dapat diperiksa kembali dari `research/responses.csv`. Jika peneliti ingin memakai file lokal tanpa mengambil data terbaru, opsi `--offline` dapat digunakan.

File HTML dapat dibuka di browser dengan command:

```sh
open research/responses.html
open research/summary.html
```

`research/responses.html` menampilkan data gabungan per baris responden dan voting. `research/summary.html` menampilkan rekap ringkas seperti total responden, total penilaian, persentase kepuasan, rekap kategori, rekap per responden, dan FAQ yang paling banyak dinilai.

### Proses Export CSV di Kode Worker

File utama Worker:

```text
src/index.ts
```

Saat Worker menerima request `GET`, sistem membaca path URL. Contohnya:

```ts
if (url.pathname === "/responses.csv") {
  return exportResearchResponsesCsv(request, env);
}
```

Alur export gabungan:

```text
npm run export:responses
  -> tools/bot-admin.ts membaca .env
  -> tools/bot-admin.ts request GET /responses.csv
  -> src/index.ts menerima request
  -> exportResearchResponsesCsv()
  -> getAuthorizedResearchResponseRows()
  -> listResearchResponseRows()
  -> buildResearchResponsesCsv()
  -> Worker mengembalikan file CSV
```

Fungsi otorisasi:

```ts
if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_EXPORT_TOKEN}`) {
  return json({ ok: false, error: "Unauthorized" }, 401);
}
```

Maksudnya, export data riset tidak bisa diakses publik. Request harus membawa `ADMIN_EXPORT_TOKEN`.

Fungsi pengambilan data gabungan:

```ts
const prefix = "research:faq_vote:";
const result = await env.RESEARCH_STORE!.list({ prefix, cursor });
```

Bagian tersebut membaca semua data voting per user yang tersimpan di Cloudflare KV. Setelah vote ditemukan, sistem mengambil:

1. Data FAQ berdasarkan `faq_id`.
2. Data responden berdasarkan `telegram_id`.
3. Pilihan kepuasan user.
4. Waktu voting.

Karena key voting disimpan dalam format `research:faq_vote:{faqId}:{telegramId}`, satu responden hanya memiliki satu record voting untuk satu FAQ. Jika tombol voting berbeda ditekan lagi pada FAQ yang sama, record lama diperbarui dan total statistik dikoreksi. Jika tombol yang sama ditekan ulang, suara tidak bertambah.

Hasilnya digabung menjadi baris export:

```text
telegram_id, username, first_name, last_name, language_code,
started_at, last_seen_at, faq_id, category, question, answer, choice, voted_at
```

### Perbedaan Tiga Export Riset

| Export | Isi Data | Dipakai Untuk |
| --- | --- | --- |
| `research` | Profil responden Telegram | Melihat siapa saja yang mencoba chatbot |
| `responses` | Profil responden + FAQ + pilihan kepuasan | Analisis utama penelitian |
| `satisfaction` | Rekap jumlah dan persentase vote per FAQ | Melihat FAQ mana yang dinilai memuaskan/tidak memuaskan |
| `summary` | Ringkasan dari `responses.csv` | Melihat jumlah responden, aktivitas voting per responden, persentase kepuasan, rekap kategori, dan FAQ yang perlu dievaluasi |

Jadi, untuk pembahasan hasil penelitian, yang paling kuat digunakan adalah:

```sh
npm run export:responses
```

Sedangkan:

```sh
npm run export:research
```

dipakai sebagai daftar responden, dan:

```sh
npm run export:satisfaction
```

dipakai sebagai rekap statistik kepuasan per FAQ.

Command:

```sh
npm run export:summary
```

dipakai untuk membuat ringkasan cepat dari data gabungan. Command ini membantu peneliti melihat gambaran umum hasil voting tanpa menghitung manual sejak awal. Namun, ketika menulis laporan, data rinci tetap merujuk ke `research/responses.csv` karena file tersebut menyimpan hubungan lengkap antara responden, pertanyaan, jawaban, dan pilihan kepuasan.

### Command Webhook

Command:

```sh
npm run webhook:set
```

dipakai untuk mendaftarkan endpoint Worker ke Telegram. Bentuk request API aslinya:

```sh
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

Di kode helper:

```text
tools/bot-admin.ts
```

bagian yang menjalankan request:

```ts
const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: "POST",
  body
});
```

Command:

```sh
npm run webhook:info
```

dipakai untuk mengecek webhook Telegram yang aktif. Bentuk request API aslinya:

```sh
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

### Command Relevance

Command:

```sh
npm run relevance -- "Kalau STNK hilang bagaimana?"
```

dipakai untuk menjelaskan proses pattern matching secara teknis. Output-nya menampilkan:

1. Input asli.
2. Hasil normalisasi.
3. Token sebelum stop word.
4. Stop word yang dibuang.
5. Token dasar.
6. Token yang diperluas dengan sinonim.
7. Regex atau pattern yang cocok.
8. FAQ yang dipilih.
9. Nilai relevansi internal.

Command ini berguna untuk bimbingan karena dapat menunjukkan bahwa sistem tidak menjawab secara acak. Sistem melakukan normalisasi, tokenisasi, penghapusan stop word, perluasan sinonim, regex pendukung, lalu pattern matching ke dataset FAQ.

Kalimat yang bisa dipakai:

```text
Command npm dibuat untuk mempermudah pengoperasian sistem. Pada dasarnya command export tetap melakukan request HTTP ke endpoint Worker, misalnya GET /responses.csv dengan Authorization Bearer token. Worker kemudian mengambil data dari Cloudflare KV, menggabungkan data responden dengan voting dan FAQ, lalu mengembalikan file CSV. Dengan demikian, proses export data penelitian dapat dijelaskan dari sisi command, request API, dan fungsi kode yang menjalankannya.
```

## Batasan Pertanyaan Random

Pertanyaan random atau pertanyaan tidak biasa digunakan sebagai skenario uji yang mewakili kemungkinan input user. Pertanyaan random tidak perlu ditambahkan tanpa batas, karena variasi bahasa user sangat banyak dan terus berubah.

Karena sistem memakai pattern matching dan regex, sistem tidak memahami semua variasi bahasa seperti LLM. Kalau ada pola pertanyaan baru yang valid dan belum dikenali, pattern perlu diperbarui.

Kalimat yang bisa dipakai:

```text
Pertanyaan random diuji sebagai sampel input user, bukan sebagai daftar tanpa batas. Chatbot ini memakai pattern matching berbasis aturan dengan dukungan regex, jadi sistem tidak memahami semua variasi bahasa seperti LLM. Jika ditemukan pola pertanyaan valid yang baru, sistem diperbarui lewat data FAQ, custom pattern, regex pendukung, dan regression test.
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
  relevance: 340
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

Tujuannya sederhana: pertanyaan yang pernah gagal tidak gagal lagi setelah update berikutnya.

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

Kalimat yang bisa dipakai:

```text
Jika ditemukan pola pertanyaan valid baru saat pengujian, dataset FAQ dicek dulu. Jika perlu jawaban baru, data FAQ diperbarui. Jika jawabannya sudah ada, tambahkan custom pattern atau regex pendukung agar variasi kalimat tersebut dikenali. Setelah itu, buat regression test dari pertanyaan yang sebelumnya gagal.
```

## Jawaban Singkat untuk Presentasi

### Apa metode yang digunakan?

Metode yang digunakan adalah pattern matching berbasis aturan, dengan dukungan normalisasi teks, stop word removal, sinonim sederhana, custom pattern, regex pendukung, dan perhitungan nilai relevansi.

### Apakah chatbot menggunakan AI?

Tidak. Chatbot tidak menggunakan AI generatif. Sistem mencocokkan pertanyaan user dengan dataset FAQ.

### Mengapa dataset disimpan di JSON?

Dataset disimpan di JSON agar data FAQ terpisah dari logic algoritma. Data jadi lebih mudah diperbarui tanpa mengubah struktur utama program.

### Mengapa test case 209, bukan 300?

Karena 209 adalah jumlah skenario pengujian otomatis, bukan hasil perkalian jumlah dataset dengan variasi pertanyaan. Pengujian menggunakan pendekatan black box berbasis skenario.

### Apakah pertanyaan random harus semua ditambahkan?

Tidak. Pertanyaan random digunakan sebagai sampel skenario. Jika ditemukan pola valid baru, sistem diperbarui melalui dataset, custom pattern, regex pendukung, dan test case.

### Kenapa perlu Telegram untuk uji coba?

Karena Telegram adalah media implementasi chatbot. Test otomatis memvalidasi fungsi sistem, sedangkan uji coba Telegram memvalidasi pengalaman user dan voting kepuasan jawaban.
