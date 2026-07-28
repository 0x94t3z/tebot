# Saran Penyusunan Bab 4 dan Bab 5

Dokumen ini dipakai sebagai pegangan kasar saat menulis Bab 4 dan Bab 5 untuk judul:

```text
Implementasi Metode Pattern Matching pada Chatbot Frequently Asked Questions: SAMSAT Bandung Timur
```

Ikuti format kampus dulu kalau ada aturan resmi. Struktur di bawah ini lebih mirip peta kerja: bagian mana yang perlu ditulis, bukti apa yang perlu dimasukkan, dan kalimat seperti apa yang aman dipakai saat menjelaskan sistem.

## Bab 4 - Implementasi dan Pengujian

Bab 4 jangan terlalu banyak teori lagi. Teori pattern matching, chatbot, webhook, dan Telegram seharusnya sudah berada di Bab 2 atau Bab 3. Di Bab 4, tulis apa yang benar-benar dibuat di proyek ini dan bagaimana hasilnya saat diuji.

### 4.1 Implementasi Sistem

Buka Bab 4 dengan menjelaskan bentuk jadi dari sistem. Dalam proyek ini, sistemnya adalah chatbot Telegram. Backend-nya Cloudflare Workers. Komunikasi dari Telegram ke backend memakai webhook.

Isi yang perlu masuk:

- Telegram Bot API dipakai sebagai media chat.
- Cloudflare Workers menerima request dari Telegram.
- Dataset FAQ dibaca dari file JSON.
- Cloudflare KV menyimpan data yang berubah, seperti profil responden, voting, dan daftar message ID untuk `/clear`.
- Bot hanya menerima teks. Foto, video, sticker, voice note, dan file ditolak.

Contoh narasi:

```text
Pada tahap implementasi, sistem dibuat dalam bentuk chatbot Telegram untuk FAQ SAMSAT Bandung Timur. Telegram mengirim pesan pengguna ke Cloudflare Workers melalui webhook. Setelah request diterima, Worker memeriksa jenis input yang masuk, lalu menjalankan proses yang sesuai: command, tombol menu, pertanyaan bebas, voting, atau fallback.
```

Kalimatnya tidak perlu dibuat megah. Yang dicari dosen biasanya jelas: sistemnya berjalan di mana, menerima input apa, lalu memprosesnya dengan cara apa.

### 4.2 Implementasi Dataset FAQ

Dataset adalah bahan utama bot. Jelaskan bahwa data FAQ aktif berjumlah 150 baris dan disimpan di:

```text
src/data/faq-samsat-bandung-timur.json
```

Setiap baris data memiliki struktur seperti ini:

| Field | Isi |
| --- | --- |
| `id` | nomor FAQ |
| `category` | kategori pertanyaan |
| `question` | bentuk pertanyaan utama |
| `answer` | jawaban yang dikirim bot |
| `source` | sumber rujukan jawaban |

Tulis juga kategori yang dipakai. Tidak harus dijelaskan panjang-panjang satu per satu. Cukup sebutkan bahwa dataset dikelompokkan ke kategori Layanan, Pajak, Dokumen, Balik Nama, Mutasi, Cek Fisik, SIGNAL, Samsat Keliling, Fasilitas, dan Pengaduan.

Contoh narasi:

```text
Dataset FAQ disimpan dalam format JSON agar data pertanyaan dan jawaban tidak bercampur dengan kode algoritma. Dengan pemisahan ini, perubahan jawaban atau penambahan pola pertanyaan dapat dilakukan tanpa mengubah alur utama program.
```

Jika dosen bertanya kenapa tidak pakai database relasional, jawabnya sederhana: data FAQ relatif statis, jumlahnya masih kecil, dan JSON cukup untuk kebutuhan implementasi saat ini. Data yang berubah-ubah disimpan di Cloudflare KV.

### 4.3 Implementasi Pattern Matching

Ini bagian yang paling dekat dengan judul. Jangan hanya menulis “bot memakai pattern matching”. Tunjukkan urutannya.

Alur yang bisa ditulis:

```text
Input pengguna
  -> normalisasi teks
  -> segmentasi jika ada lebih dari satu pertanyaan
  -> tokenisasi
  -> penghapusan stop word
  -> perluasan sinonim sederhana
  -> pencocokan dengan FAQ, custom pattern, dan regex pendukung
  -> perhitungan skor relevansi
  -> pemilihan FAQ terbaik atau fallback
```

Penjelasan singkatnya:

```text
Pattern matching pada sistem ini bekerja dengan membandingkan input pengguna terhadap data FAQ dan pola tambahan yang sudah ditentukan. Input pengguna lebih dulu dinormalisasi agar variasi penulisan menjadi lebih seragam. Setelah itu, sistem memberi skor pada kandidat FAQ dan memilih jawaban dengan skor tertinggi jika melewati batas minimum.
```

Gunakan istilah “skor relevansi internal”. Jangan menyebutnya akurasi machine learning, karena sistem ini tidak melatih model statistik.

### 4.4 Regex Pendukung

Regex perlu dijelaskan sebagai pendukung. Bukan metode utama.

Regex di proyek ini dipakai untuk dua hal:

- menyamakan variasi penulisan, misalnya `5 tahun`, `5 tahunan`, dan `lima tahunan`
- mengenali pola frasa tertentu, misalnya STNK hilang, TNKB rusak, pembayaran SIGNAL belum berubah, dan cek fisik untuk mutasi

Contoh narasi:

```text
Regex dipakai untuk membantu sistem mengenali variasi penulisan yang sering muncul pada pertanyaan pengguna. Misalnya, istilah "ganti plat", "pajak lima tahunan", dan "5 tahunan" dapat diarahkan ke konteks layanan yang sama. Keputusan akhir tetap ditentukan oleh proses scoring pattern matching.
```

Tambahkan satu contoh kasus yang pernah diuji:

```text
Kalau STNK hilang bagaimana?
```

Kalimat tersebut tetap mengarah ke FAQ STNK hilang meskipun susunan katanya berbeda dari pertanyaan utama pada dataset.

### 4.5 Tampilan Chatbot di Telegram

Masukkan screenshot. Ini penting untuk Bab 4 karena pembaca perlu melihat sistemnya benar-benar jadi.

Screenshot yang layak dimasukkan:

- tampilan awal setelah `/start`
- menu kategori
- daftar pertanyaan pada satu kategori
- jawaban FAQ dengan sumber
- tombol voting Memuaskan dan Tidak Memuaskan
- contoh fallback untuk pertanyaan di luar SAMSAT

Jelaskan seperlunya saja. Misalnya:

```text
Setelah pengguna menjalankan `/start`, bot menampilkan pesan pembuka dan menu kategori. Pengguna dapat memilih kategori melalui tombol atau langsung mengetik pertanyaan bebas. Setelah jawaban dikirim, bot menampilkan menu utama lagi agar pengguna dapat melanjutkan pencarian tanpa mengetik command baru.
```

### 4.6 Penyimpanan Data Riset

Tuliskan data apa yang disimpan dan kenapa data itu disimpan.

Data yang tersimpan setelah `/start`:

- Telegram ID
- username
- nama depan dan nama belakang
- kode bahasa
- waktu mulai
- waktu terakhir aktif

Untuk voting, sistem menyimpan pilihan pengguna pada FAQ tertentu. Satu pengguna dihitung satu suara untuk satu FAQ. Kalau pengguna mengganti pilihan, suara lama dikoreksi.

Contoh narasi:

```text
Data riset digunakan untuk mencatat responden yang mencoba chatbot dan hasil penilaian mereka terhadap jawaban FAQ. Sistem tidak meminta pengguna mengisi formulir terpisah. Data dasar diambil dari profil Telegram setelah pengguna menjalankan `/start`, sedangkan penilaian jawaban dicatat melalui tombol voting.
```

Tambahkan catatan privasi kalau diperlukan: token export dilindungi `ADMIN_EXPORT_TOKEN`, jadi endpoint CSV tidak terbuka untuk umum.

### 4.7 Pengujian Sistem

Pisahkan pengujian otomatis dan pengujian lewat Telegram.

| Pengujian | Yang dicek |
| --- | --- |
| Unit test | fungsi matcher, fallback, multi-intent, dan format balasan |
| Black box | kecocokan input dan output |
| Telegram | pengalaman user pada bot yang berjalan |
| Voting | penilaian pengguna terhadap jawaban |

Contoh narasi:

```text
Pengujian dilakukan dengan pendekatan black box. Input diberikan dalam bentuk pertanyaan pengguna, lalu output dibandingkan dengan hasil yang diharapkan. Jika input masih berada dalam konteks SAMSAT, bot diharapkan mengembalikan FAQ yang sesuai. Jika input berada di luar konteks, bot harus mengembalikan fallback.
```

Pakai output `npm test` sebagai bukti teknis. Setelah itu masukkan screenshot Telegram sebagai bukti bahwa bot berjalan pada media aslinya.

### 4.8 Skenario Pengujian Pattern Matching

Skenario test tidak perlu dibuat seperti semua kemungkinan bahasa user. Itu tidak realistis. Yang perlu ada adalah kelas input yang mewakili kasus utama.

Contoh tabel:

| No | Skenario | Input | Output |
| ---: | --- | --- | --- |
| 1 | pertanyaan sesuai dataset | Apa syarat bayar pajak tahunan? | FAQ syarat pajak tahunan |
| 2 | urutan kata berubah | Kalau STNK hilang bagaimana? | FAQ STNK hilang |
| 3 | pertanyaan natural | Plat motor saya rusak karena kecelakaan | FAQ TNKB rusak |
| 4 | dua pertanyaan dalam satu pesan | Syarat balik nama dan mutasi apa saja? | dua jawaban FAQ |
| 5 | di luar konteks | Bisa perpanjang paspor di Samsat? | fallback |

Untuk menjawab pertanyaan “kenapa dataset 150 tapi test 209”, pakai penjelasan ini:

```text
Dataset FAQ berjumlah 150 data. Angka 209 pada hasil test adalah jumlah skenario pengujian otomatis, bukan jumlah data FAQ. Test case dibuat berdasarkan kelas input black box, seperti pertanyaan asli, variasi urutan kata, pertanyaan natural, multi-intent, dan fallback.
```

### 4.9 Hasil Pengujian

Masukkan hasil test secara apa adanya. Misalnya:

```text
Test Files  2 passed (2)
Tests  209 passed (209)
```

Lalu jelaskan artinya:

```text
Hasil tersebut menunjukkan bahwa seluruh skenario pengujian otomatis berhasil dijalankan. Pengujian mencakup validasi dataset, pencocokan pertanyaan, fallback, multi-intent, dan format balasan Telegram.
```

Kalau sudah ada hasil voting dari responden, buat tabel terpisah. Jangan dicampur dengan skor pattern matching. Voting adalah penilaian user. Skor matcher adalah nilai internal algoritma.

### 4.10 Analisis Hasil

Analisisnya tidak perlu dipoles berlebihan. Tulis temuan yang benar-benar terlihat dari sistem.

Poin yang bisa dibahas:

- pertanyaan yang dekat dengan dataset lebih mudah dikenali
- custom pattern membantu kalimat user yang tidak sama persis dengan dataset
- regex membantu istilah yang punya banyak variasi penulisan
- fallback mencegah bot menjawab pertanyaan di luar layanan SAMSAT
- sistem masih bergantung pada kualitas dataset dan pattern

Contoh narasi:

```text
Dari hasil pengujian, bot dapat menjawab pertanyaan yang masih memiliki kata kunci atau pola yang sesuai dengan dataset. Pertanyaan seperti "Kalau STNK hilang bagaimana?" tetap dikenali karena pola STNK hilang sudah diwakili oleh custom pattern dan regex pendukung. Sebaliknya, pertanyaan di luar layanan SAMSAT, seperti perpanjangan paspor, diarahkan ke fallback.
```

Kalau ada kasus gagal, tulis juga. Penelitian justru terlihat lebih kuat kalau batasannya jelas.

## Bab 5 - Kesimpulan dan Saran

Bab 5 cukup pendek. Jangan membuka teori baru. Ambil hasil dari Bab 4, lalu jawab rumusan masalah.

### 5.1 Kesimpulan

Kesimpulan bisa dibuat 5 sampai 7 poin. Jangan terlalu panjang.

Contoh poin:

1. Chatbot FAQ SAMSAT Bandung Timur berhasil dibuat dengan Telegram Bot API dan Cloudflare Workers.
2. Metode pattern matching diterapkan melalui normalisasi teks, tokenisasi, custom pattern, regex pendukung, dan scoring.
3. Dataset FAQ berisi 150 data dan disimpan dalam file JSON.
4. Sistem dapat menjawab pertanyaan bebas, pilihan menu, dan pesan multi-intent selama masih berada dalam cakupan pattern.
5. Pertanyaan di luar konteks SAMSAT diarahkan ke fallback.
6. Pengujian otomatis memeriksa 209 skenario dan seluruh skenario berhasil dijalankan.
7. Voting Memuaskan dan Tidak Memuaskan dipakai untuk mencatat penilaian pengguna terhadap jawaban bot.

Narasi yang bisa dipakai:

```text
Berdasarkan implementasi dan pengujian, chatbot FAQ SAMSAT Bandung Timur berhasil dibuat sebagai bot Telegram berbasis Cloudflare Workers. Sistem menerapkan pattern matching berbasis aturan untuk mencocokkan pertanyaan pengguna dengan dataset FAQ. Proses pencocokan dilakukan melalui normalisasi teks, tokenisasi, penghapusan stop word, perluasan sinonim sederhana, custom pattern, regex pendukung, dan scoring.
```

### 5.2 Keterbatasan Sistem

Tuliskan batasan tanpa terlalu membela sistem.

Contoh batasan:

- bot tidak memakai AI generatif
- jawaban hanya berasal dari dataset FAQ
- pola pertanyaan baru perlu ditambahkan manual
- kualitas jawaban dipengaruhi oleh kualitas sumber dan dataset
- perubahan dataset atau pattern perlu deploy ulang
- `/clear` mengikuti batasan Telegram Bot API

Contoh narasi:

```text
Keterbatasan utama sistem berada pada metode rule-based. Bot hanya dapat menjawab pertanyaan yang memiliki kecocokan dengan dataset, custom pattern, atau regex pendukung. Jika pengguna menulis pertanyaan dengan pola yang belum pernah diwakili, bot dapat mengembalikan fallback.
```

### 5.3 Saran Pengembangan

Saran pengembangan lebih kuat kalau dekat dengan masalah yang muncul di proyek ini.

Contoh saran:

1. Tambahkan dashboard admin untuk mengelola FAQ.
2. Catat pertanyaan fallback agar pola gagal bisa dianalisis.
3. Tambahkan evaluasi precision dan recall jika data uji sudah diberi label.
4. Buat fitur import dataset dari CSV atau spreadsheet.
5. Tambahkan rekomendasi beberapa jawaban saat skor kandidat berdekatan.
6. Kembangkan pendekatan hybrid dengan similarity matching, tetapi jawaban tetap diambil dari dataset valid.

Contoh narasi:

```text
Pengembangan berikutnya dapat diarahkan pada fitur pengelolaan dataset. Saat ini perubahan FAQ masih dilakukan melalui file JSON di repository. Dengan dashboard admin atau fitur import CSV, pembaruan data dapat dilakukan lebih cepat, terutama jika peneliti menemukan pola pertanyaan baru dari hasil uji coba responden.
```

## Susunan Ringkas

Kalau dosen meminta format yang lebih pendek, struktur ini cukup aman:

```text
BAB IV IMPLEMENTASI DAN PENGUJIAN
4.1 Implementasi Sistem
4.2 Implementasi Dataset FAQ
4.3 Implementasi Metode Pattern Matching
4.4 Implementasi Regex Pendukung
4.5 Implementasi Tampilan Chatbot
4.6 Penyimpanan Data Riset
4.7 Pengujian Sistem
4.8 Hasil Pengujian
4.9 Analisis Hasil

BAB V KESIMPULAN DAN SARAN
5.1 Kesimpulan
5.2 Keterbatasan Sistem
5.3 Saran Pengembangan
```

## Catatan Saat Menulis

- Sebut skor matcher sebagai skor relevansi internal.
- Jangan menyebut skor matcher sebagai akurasi machine learning.
- Persentase Memuaskan dan Tidak Memuaskan berasal dari voting pengguna.
- Regex adalah pendukung. Metode utamanya tetap pattern matching.
- Angka 150 adalah jumlah dataset FAQ. Angka 209 adalah jumlah test case otomatis.
- Uji coba responden dilakukan lewat Telegram karena bot memang diimplementasikan di Telegram.
