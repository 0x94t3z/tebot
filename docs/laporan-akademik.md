# Laporan Akademik Bab IV dan Bab V

Judul penelitian:

```text
Implementasi Metode Pattern Matching pada Chatbot Frequently Asked Questions: SAMSAT Bandung Timur
```

Dokumen ini merupakan laporan akademik Bab IV dan Bab V. Isi dokumen masih perlu disesuaikan kembali dengan pedoman penulisan Tugas Akhir UIN Sunan Gunung Djati Bandung, khususnya format penomoran gambar, tabel, kutipan, dan daftar pustaka.

# BAB IV IMPLEMENTASI DAN PENGUJIAN SISTEM

## 4.1 Gambaran Umum Sistem

Bab ini membahas implementasi dan pengujian chatbot Frequently Asked Questions (FAQ) SAMSAT Bandung Timur. Chatbot dibuat sebagai media tanya jawab melalui Telegram. Pengguna dapat mengetik pertanyaan dalam bentuk teks atau memilih pertanyaan dari menu kategori.

Metode yang digunakan adalah pattern matching berbasis aturan. Pertanyaan pengguna dicocokkan dengan data FAQ yang sudah disiapkan. Jawaban chatbot tidak dibuat secara bebas, tetapi diambil dari dataset yang berisi pertanyaan, jawaban, kategori, dan sumber rujukan. Batas jawaban chatbot mengikuti batas dataset tersebut.

Proses dimulai saat pengguna mengirim pesan melalui Telegram. Sistem membaca jenis input yang masuk. Jika input berupa teks pertanyaan, sistem mencocokkannya dengan dataset FAQ. Jika ditemukan FAQ yang relevan, chatbot mengirimkan jawaban. Jika tidak, atau jika pertanyaan berada di luar layanan SAMSAT, chatbot mengirimkan respons fallback.

Alur umum sistem ditunjukkan pada Gambar 4.1.

**Gambar 4.1 Alur umum sistem chatbot FAQ SAMSAT Bandung Timur**

[Sisipkan diagram alur sistem: pengguna Telegram -> chatbot -> proses pattern matching -> jawaban FAQ/fallback -> voting kepuasan.]

## 4.2 Hasil Implementasi Sistem

Hasil implementasi penelitian ini adalah chatbot Telegram untuk FAQ SAMSAT Bandung Timur. Chatbot menerima pertanyaan pengguna dan memberikan jawaban berdasarkan dataset FAQ. Di dalam chatbot tersedia menu kategori, daftar pertanyaan, jawaban dengan sumber rujukan, voting kepuasan, dan respons fallback.

Bagian yang diuji dalam sistem meliputi antarmuka chatbot, dataset FAQ, proses pencocokan pertanyaan, penyimpanan data riset, dan penilaian pengguna terhadap jawaban. Ringkasan komponen sistem ditunjukkan pada Tabel 4.1.

**Tabel 4.1 Komponen Utama Sistem**

| Komponen | Keterangan |
| --- | --- |
| Antarmuka chatbot | Media interaksi pengguna melalui Telegram |
| Dataset FAQ | Kumpulan pertanyaan, jawaban, kategori, dan sumber rujukan |
| Pattern matching | Proses pencocokan pertanyaan pengguna dengan FAQ |
| Regex pendukung | Teknik pendukung untuk mengenali variasi penulisan dan pola frasa |
| Respons fallback | Respons ketika pertanyaan tidak sesuai cakupan atau tidak ditemukan kecocokan |
| Voting kepuasan | Penilaian pengguna terhadap jawaban chatbot |
| Penyimpanan data riset | Penyimpanan data responden dan hasil voting |

Chatbot hanya memproses teks. Foto, video, dokumen, voice note, dan sticker ditolak karena metode yang digunakan dalam penelitian ini bekerja pada input berupa kata atau frasa.

## 4.3 Dataset Frequently Asked Questions

Dataset FAQ menjadi dasar jawaban chatbot. Isinya berupa pertanyaan dan jawaban seputar layanan SAMSAT Bandung Timur. Setiap data memuat kategori, pertanyaan, jawaban, dan sumber rujukan. Sumber dicantumkan agar jawaban dapat ditelusuri kembali.

Jumlah dataset FAQ yang digunakan dalam penelitian ini adalah 150 data. Dataset tersebut dikelompokkan ke dalam beberapa kategori layanan agar pengguna dapat mencari informasi secara lebih terarah. Kategori dan jumlah data FAQ ditunjukkan pada Tabel 4.2.

**Tabel 4.2 Jumlah FAQ Berdasarkan Kategori**

| Kategori | Jumlah FAQ |
| --- | ---: |
| Layanan | 25 |
| Pajak | 28 |
| Dokumen | 20 |
| Balik Nama | 17 |
| Mutasi | 17 |
| Cek Fisik | 14 |
| SIGNAL | 12 |
| Samsat Keliling | 7 |
| Fasilitas | 6 |
| Pengaduan | 4 |
| **Total** | **150** |

Pengelompokan dataset dipakai untuk menu chatbot dan proses pencocokan. Melalui kategori, pengguna dapat memilih topik layanan tanpa harus mengetik pertanyaan bebas.

## 4.4 Implementasi Antarmuka Chatbot

Pada awal percakapan, chatbot menampilkan pesan pembuka dan menu kategori. Setelah itu pengguna dapat memilih salah satu kategori atau mengetik pertanyaan langsung pada ruang chat.

Fitur antarmuka yang diimplementasikan meliputi:

1. Pesan pembuka.
2. Menu kategori FAQ.
3. Daftar pertanyaan berdasarkan kategori.
4. Navigasi halaman pada daftar pertanyaan.
5. Jawaban FAQ disertai sumber rujukan.
6. Tombol voting `Memuaskan` dan `Tidak memuaskan`.
7. Respons fallback untuk pertanyaan di luar cakupan.
8. Pesan penolakan untuk input selain teks.

Contoh tampilan antarmuka chatbot ditampilkan melalui beberapa tangkapan layar berikut.

**Gambar 4.2 Tampilan pesan pembuka chatbot**

[Sisipkan tangkapan layar pesan pembuka setelah pengguna memulai bot.]

**Gambar 4.3 Tampilan menu kategori FAQ**

[Sisipkan tangkapan layar menu kategori FAQ.]

**Gambar 4.4 Tampilan jawaban FAQ dan voting kepuasan**

[Sisipkan tangkapan layar jawaban FAQ yang memuat pertanyaan, jawaban, sumber, dan tombol voting.]

## 4.5 Penerapan Metode Pattern Matching

Metode pattern matching digunakan untuk mencocokkan pertanyaan pengguna dengan dataset FAQ. Prinsipnya sederhana: pola pertanyaan pengguna dibandingkan dengan pola yang tersedia pada dataset dan aturan pendukung. Tidak ada proses pelatihan model seperti pada machine learning. Yang dilakukan adalah pencocokan berbasis aturan.

Tahapan penerapan pattern matching pada sistem ini meliputi:

1. Normalisasi teks.
2. Tokenisasi.
3. Penghapusan stop word.
4. Perluasan sinonim sederhana.
5. Pencocokan terhadap FAQ dan pola tambahan.
6. Validasi konteks pertanyaan.
7. Perhitungan nilai relevansi.
8. Pemilihan jawaban atau respons fallback.

Tahap normalisasi menyeragamkan bentuk input pengguna. Dalam percakapan sehari-hari, satu istilah sering ditulis dalam beberapa bentuk. Misalnya, `drive-thru`, `drivethru`, dan `drive through` diarahkan ke bentuk `drive thru`.

Setelah normalisasi, input dipecah menjadi token. Kata yang terlalu umum, seperti `apa`, `bagaimana`, `kalau`, dan `saya`, diabaikan. Pencocokan lalu bertumpu pada kata yang lebih bermakna.

Perluasan sinonim digunakan secara terbatas. Kata `hilang`, `kehilangan`, `ilang`, `raib`, dan `lenyap`, misalnya, diperlakukan sebagai kelompok kata yang berdekatan. Cara ini membuat input tidak baku tetap bisa dikenali selama masih berada pada konteks FAQ.

Setelah itu sistem menghitung nilai relevansi antara input pengguna dan kandidat FAQ. Nilai ini dipakai untuk memilih jawaban. Nilai relevansi bukan akurasi machine learning, melainkan ukuran internal dalam proses pencocokan.

## 4.6 Peran Regex dalam Pattern Matching

Regex dipakai sebagai teknik pendukung. Metode utamanya tetap pattern matching. Regex membantu mengenali bentuk frasa yang sering muncul dalam pertanyaan pengguna.

Dalam penelitian ini, regex dipakai untuk normalisasi variasi penulisan dan deteksi pola frasa tertentu yang berhubungan dengan FAQ.

Contoh penggunaan regex dalam normalisasi ditunjukkan pada Tabel 4.3.

**Tabel 4.3 Contoh Normalisasi Menggunakan Regex**

| Variasi Penulisan | Bentuk yang Diseragamkan |
| --- | --- |
| `drive-thru`, `drivethru`, `drive through` | `drive thru` |
| `nopol`, `no polisi`, `nomor polisi` | `nomor polisi` |
| `5 tahun`, `5 tahunan`, `lima tahunan` | `lima tahunan` |
| `cabut berkas`, `pindah domisili` | konteks mutasi |
| `gesek rangka`, `gesek mesin` | konteks cek fisik |

Contoh pola pertanyaan yang dibantu oleh regex ditunjukkan pada Tabel 4.4.

**Tabel 4.4 Contoh Pola Pertanyaan yang Didukung Regex**

| Pola Pertanyaan | FAQ yang Dituju |
| --- | --- |
| STNK hilang | FAQ tentang STNK hilang |
| TNKB atau pelat hilang | FAQ tentang TNKB hilang |
| TNKB atau pelat rusak | FAQ tentang TNKB rusak |
| Pajak lima tahunan | FAQ tentang pajak lima tahunan |
| Pembayaran SIGNAL belum berubah | FAQ tentang kendala pembayaran SIGNAL |
| Balik nama warisan | FAQ tentang balik nama kendaraan warisan |

Contohnya, pertanyaan `Kalau STNK hilang bagaimana?` dikenali karena mengandung pola `STNK hilang`. Sistem membaca kata `STNK` dan `hilang` sebagai satu pola yang mengarah ke FAQ dokumen. Pemilihan jawaban akhir tetap mengikuti nilai relevansi pattern matching.

## 4.7 Respons Multi-Intent

Selain pertanyaan tunggal, sistem juga dirancang untuk menangani pesan yang mengandung lebih dari satu maksud pertanyaan. Kondisi ini disebut multi-intent. Contoh pertanyaan multi-intent adalah:

```text
Syarat balik nama apa saja dan mutasi kendaraan bagaimana?
```

Pada pertanyaan tersebut terdapat dua maksud, yaitu syarat balik nama dan mutasi kendaraan. Sistem memisahkan input menjadi beberapa bagian yang bermakna, kemudian mencocokkan setiap bagian dengan dataset FAQ. Jika lebih dari satu bagian memiliki kecocokan yang cukup, chatbot dapat mengirim lebih dari satu jawaban.

Jumlah jawaban multi-intent dibatasi agar percakapan tidak terlalu panjang.

## 4.8 Respons Fallback dan Pembatasan Domain

Respons fallback diberikan ketika sistem tidak menemukan FAQ yang cukup relevan atau ketika pertanyaan pengguna berada di luar cakupan layanan SAMSAT Bandung Timur. Bagian ini mencegah chatbot mengambil jawaban yang tidak sesuai hanya karena ada satu kata yang mirip.

Contoh pertanyaan yang berada di luar cakupan adalah:

```text
Saya mau bayar pajak motor sambil perpanjang paspor, bisa dilakukan di Samsat Bandung Timur?
```

Pertanyaan tersebut mengandung kata `pajak motor`, tetapi topik utamanya bercampur dengan `paspor`. Karena paspor bukan layanan SAMSAT, chatbot tidak mengambil jawaban dari dataset FAQ dan mengirim respons fallback.

Fallback juga diberikan ketika pertanyaan terlalu umum atau tidak memiliki kecocokan yang cukup dengan dataset. Ini menjaga batas jawaban chatbot tetap sesuai dengan ruang lingkup penelitian.

## 4.9 Penyimpanan Data Riset dan Voting Kepuasan

Data riset disimpan untuk kebutuhan evaluasi. Data tersebut terdiri dari data responden dan voting kepuasan jawaban.

Data responden diperoleh dari informasi dasar Telegram pengguna, seperti Telegram ID, username, nama, kode bahasa, waktu mulai, dan waktu terakhir aktif. Data ini dipakai untuk mencatat pengguna yang mencoba chatbot.

Voting kepuasan dicatat setelah jawaban FAQ dikirim. Pengguna dapat memilih `Memuaskan` atau `Tidak memuaskan`. Satu pengguna dihitung satu suara untuk satu FAQ. Jika pilihan diganti, suara lama diperbarui.

Persentase kepuasan dihitung dengan rumus:

```text
Memuaskan (%) = jumlah vote memuaskan / total vote * 100
Tidak memuaskan (%) = jumlah vote tidak memuaskan / total vote * 100
```

Voting kepuasan berbeda dari nilai relevansi internal. Nilai relevansi dipakai untuk memilih jawaban. Voting kepuasan mencatat penilaian pengguna terhadap jawaban yang diterima.

## 4.10 Pengujian Sistem

Pengujian dilakukan melalui interaksi langsung di Telegram. Bagian yang diuji meliputi menu kategori, pertanyaan bebas, pertanyaan di luar cakupan, input multi-intent, voting kepuasan, dan input selain teks.

Jenis pengujian yang dilakukan ditunjukkan pada Tabel 4.5.

**Tabel 4.5 Jenis Pengujian Sistem**

| Jenis Pengujian | Tujuan |
| --- | --- |
| Pengujian dataset | Memastikan jumlah dan struktur data FAQ sesuai kebutuhan |
| Pengujian pattern matching | Memastikan pertanyaan pengguna diarahkan ke FAQ yang tepat |
| Pengujian variasi kalimat | Memastikan perubahan susunan kata tetap dapat dikenali |
| Pengujian fallback | Memastikan pertanyaan di luar cakupan tidak dijawab secara keliru |
| Pengujian multi-intent | Memastikan satu pesan dapat menghasilkan lebih dari satu jawaban jika sesuai |
| Pengujian Telegram | Memastikan chatbot dapat digunakan oleh pengguna secara langsung |
| Pengujian voting | Memastikan penilaian pengguna dapat dicatat dan dihitung |

Pengujian menggunakan pendekatan black box. Penguji memberi input kepada chatbot, lalu membandingkan respons chatbot dengan output yang diharapkan.

## 4.11 Skenario Pengujian Pattern Matching

Skenario pengujian disusun berdasarkan kelas input yang mungkin muncul saat pengguna memakai chatbot. Dataset FAQ berjumlah 150 data. Skenario pengujian tidak harus sama jumlahnya dengan dataset, karena yang diuji adalah perilaku chatbot terhadap beberapa bentuk input: pertanyaan sesuai dataset, variasi kalimat, pertanyaan natural, multi-intent, input di luar cakupan, dan input selain teks.

Contoh skenario pengujian ditunjukkan pada Tabel 4.6.

**Tabel 4.6 Contoh Skenario Pengujian**

| No | Skenario | Contoh Input | Output yang Diharapkan |
| ---: | --- | --- | --- |
| 1 | Pertanyaan sesuai dataset | Apa syarat membayar pajak tahunan? | FAQ syarat pajak tahunan |
| 2 | Urutan kata berubah | Kalau STNK hilang bagaimana? | FAQ STNK hilang |
| 3 | Pertanyaan natural | Plat motor saya rusak karena kecelakaan | FAQ TNKB rusak |
| 4 | Istilah tidak baku | STNK ilang harus ngapain? | FAQ STNK hilang |
| 5 | Variasi istilah | Mau ganti plat lima tahunan bawa apa? | FAQ pajak lima tahunan |
| 6 | Multi-intent | Syarat balik nama dan mutasi apa saja? | Lebih dari satu FAQ sesuai konteks |
| 7 | Di luar cakupan | Bisa perpanjang paspor di Samsat? | Respons fallback |
| 8 | Input media | Pengguna mengirim foto | Pesan bahwa chatbot hanya mendukung teks |

Skenario pengujian juga memuat pertanyaan natural yang masih berhubungan dengan layanan SAMSAT, misalnya STNK hilang saat pajak menunggak, TNKB hilang karena banjir, pembayaran SIGNAL yang statusnya belum berubah, dan kendaraan warisan. Pertanyaan seperti ini dipakai untuk melihat apakah chatbot tetap mengenali maksud pengguna meskipun kalimatnya tidak sama dengan dataset.

## 4.12 Hasil Pengujian Chatbot

Hasil pada bagian ini diperoleh dari interaksi langsung dengan chatbot Telegram. Pengujian dilakukan dengan membuka chatbot, memilih menu kategori, mengajukan pertanyaan bebas, mengajukan pertanyaan di luar cakupan, memberi voting kepuasan, dan mengirim input selain teks.

Ringkasan hasil pengujian chatbot ditunjukkan pada Tabel 4.7.

**Tabel 4.7 Hasil Pengujian Chatbot**

| No | Fitur | Hasil yang Diharapkan | Status |
| ---: | --- | --- | --- |
| 1 | Pesan pembuka | Chatbot menampilkan menu awal | Berhasil |
| 2 | Menu kategori | Chatbot menampilkan kategori FAQ | Berhasil |
| 3 | Daftar pertanyaan | Chatbot menampilkan pertanyaan sesuai kategori | Berhasil |
| 4 | Pertanyaan bebas | Chatbot memberikan jawaban FAQ yang sesuai | Berhasil |
| 5 | Pertanyaan luar cakupan | Chatbot memberikan respons fallback | Berhasil |
| 6 | Voting kepuasan | Chatbot mencatat penilaian pengguna | Berhasil |
| 7 | Input media | Chatbot menolak input selain teks | Berhasil |
| 8 | Pembersihan chat | Chatbot membersihkan pesan yang dilacak | Berhasil |

Pada pengujian menu, chatbot menampilkan menu awal, kategori FAQ, dan daftar pertanyaan berdasarkan kategori. Ketika pengguna memilih pertanyaan dari menu, chatbot mengirim jawaban yang sesuai. Pertanyaan bebas juga dapat diproses selama masih berada dalam cakupan layanan SAMSAT Bandung Timur.

Contoh pengujian pertanyaan bebas ditunjukkan pada Tabel 4.8.

**Tabel 4.8 Contoh Hasil Pengujian Pertanyaan Bebas**

| No | Input Pengguna | Hasil Chatbot | Keterangan |
| ---: | --- | --- | --- |
| 1 | `Kalau STNK hilang bagaimana?` | Chatbot menampilkan FAQ tentang STNK hilang | Sesuai |
| 2 | `Mau ganti plat lima tahunan bawa apa?` | Chatbot menampilkan FAQ pajak lima tahunan/ganti plat | Sesuai |
| 3 | `Plat motor saya rusak karena kecelakaan` | Chatbot menampilkan FAQ TNKB atau pelat rusak | Sesuai |
| 4 | `Syarat balik nama dan mutasi apa saja?` | Chatbot menampilkan lebih dari satu jawaban sesuai intent | Sesuai |
| 5 | `Bisa perpanjang paspor di Samsat?` | Chatbot menampilkan respons fallback | Sesuai |

Chatbot tidak memaksakan jawaban ketika input berada di luar cakupan. Pada pertanyaan yang memuat topik di luar layanan SAMSAT, chatbot mengirim respons fallback.

Setelah jawaban dikirim, pengguna dapat memilih `Memuaskan` atau `Tidak memuaskan`. Sistem menghitung persentase voting dari pilihan tersebut. Data ini menjadi penilaian pengguna terhadap jawaban chatbot, bukan nilai relevansi internal pattern matching.

**Gambar 4.5 Contoh jawaban chatbot terhadap pertanyaan bebas**

[Sisipkan tangkapan layar jawaban chatbot untuk pertanyaan bebas.]

**Gambar 4.6 Contoh respons fallback**

[Sisipkan tangkapan layar respons fallback untuk pertanyaan di luar cakupan.]

## 4.13 Analisis Hasil Pengujian

Berdasarkan hasil pengujian, chatbot dapat mencocokkan pertanyaan pengguna dengan FAQ yang sesuai jika pertanyaan tersebut masih memiliki kedekatan pola dengan dataset. Pertanyaan tidak harus sama persis. Kata kunci dan pola yang terwakili oleh aturan pendukung sudah cukup untuk menghasilkan kecocokan.

Contoh pertanyaan:

```text
Kalau STNK hilang bagaimana?
```

Pertanyaan tersebut diarahkan ke FAQ tentang STNK hilang karena chatbot mengenali kata kunci `STNK` dan `hilang`, lalu mendeteksi pola frasa yang sesuai melalui regex pendukung. Jadi pencocokan tidak bergantung pada kalimat yang sama persis.

Regex membantu chatbot mengenali pola frasa yang sering muncul, seperti STNK hilang, TNKB rusak, pajak lima tahunan, pembayaran SIGNAL belum berubah, dan balik nama warisan. Namun, regex tetap menjadi pendukung. Keputusan akhir tetap mengikuti proses pattern matching melalui perhitungan nilai relevansi.

Respons fallback menjaga batas jawaban chatbot. Pertanyaan tentang paspor, ATM, SIM, tagihan listrik, atau layanan lain di luar SAMSAT tidak dipaksakan untuk dijawab dengan dataset FAQ.

Keterbatasan sistem ada pada dataset dan aturan yang disusun. Jika pengguna mengajukan pertanyaan valid dengan pola yang belum terwakili, chatbot masih dapat mengirim fallback. Dataset, custom pattern, sinonim, dan regex pendukung perlu diperbarui ketika ditemukan pola pertanyaan baru.

# BAB V KESIMPULAN DAN SARAN

## 5.1 Kesimpulan

Berdasarkan implementasi dan pengujian, kesimpulan penelitian ini adalah sebagai berikut.

1. Chatbot FAQ SAMSAT Bandung Timur berhasil diimplementasikan sebagai media tanya jawab berbasis Telegram untuk informasi layanan SAMSAT Bandung Timur.

2. Metode pattern matching diterapkan untuk mencocokkan pertanyaan pengguna dengan dataset FAQ. Prosesnya meliputi normalisasi teks, tokenisasi, penghapusan stop word, perluasan sinonim sederhana, custom pattern, regex pendukung, dan perhitungan nilai relevansi.

3. Dataset FAQ yang digunakan berjumlah 150 data dan dikelompokkan ke dalam kategori Layanan, Pajak, Dokumen, Balik Nama, Mutasi, Cek Fisik, SIGNAL, Samsat Keliling, Fasilitas, dan Pengaduan.

4. Regex dipakai untuk menyamakan variasi penulisan dan mengenali pola frasa tertentu. Regex tidak menggantikan pattern matching, tetapi mendukung pencocokan pada pertanyaan yang memiliki pola spesifik.

5. Chatbot dapat menangani pertanyaan bebas, pilihan menu, dan input multi-intent selama pertanyaan masih berada dalam cakupan layanan SAMSAT dan memiliki kecocokan yang cukup dengan dataset.

6. Respons fallback dapat digunakan untuk membatasi jawaban chatbot agar tidak menjawab pertanyaan di luar cakupan layanan SAMSAT Bandung Timur.

7. Pada pengujian chatbot, sistem menampilkan menu, menjawab pertanyaan dari kategori, memproses pertanyaan bebas, menangani multi-intent, memberikan respons fallback untuk pertanyaan di luar cakupan, menolak input selain teks, dan mencatat voting kepuasan pengguna.

8. Fitur voting `Memuaskan` dan `Tidak memuaskan` dapat digunakan untuk mencatat penilaian pengguna terhadap jawaban chatbot. Penilaian ini berbeda dari nilai relevansi internal yang digunakan pada proses pattern matching.

## 5.2 Keterbatasan Sistem

Sistem yang dikembangkan memiliki beberapa keterbatasan sebagai berikut.

1. Chatbot tidak menghasilkan jawaban baru di luar dataset FAQ yang telah disusun.

2. Sistem bergantung pada kelengkapan dataset, custom pattern, sinonim, dan regex pendukung.

3. Nilai relevansi internal hanya digunakan untuk memilih kandidat FAQ dan bukan ukuran akurasi statistik.

4. Perubahan dataset dan aturan pendukung masih memerlukan proses pembaruan sistem.

5. Sistem hanya mendukung input teks, sehingga input berupa gambar, video, dokumen, sticker, atau voice note tidak diproses.

6. Fitur pembersihan chat hanya dapat menghapus pesan yang dilacak oleh bot dan tetap mengikuti batasan layanan Telegram.

## 5.3 Saran

Berdasarkan keterbatasan tersebut, pengembangan berikutnya dapat diarahkan pada beberapa hal berikut.

1. Menambahkan fitur pengelolaan dataset agar pembaruan FAQ, jawaban, sumber, custom pattern, dan regex tidak selalu dilakukan melalui perubahan sistem.

2. Mencatat pertanyaan yang menghasilkan fallback agar pola pertanyaan baru dapat dievaluasi.

3. Memperluas daftar sinonim berdasarkan pertanyaan yang benar-benar muncul saat uji coba.

4. Menambahkan rekomendasi beberapa FAQ ketika beberapa kandidat jawaban memiliki nilai relevansi yang berdekatan.

5. Melakukan uji coba kepada lebih banyak responden agar hasil evaluasi kepuasan jawaban lebih kuat.

6. Melakukan validasi sumber data secara berkala agar jawaban tetap sesuai dengan informasi resmi terbaru.

7. Mengembangkan pendekatan hybrid apabila cakupan FAQ semakin luas, dengan tetap menjaga jawaban berasal dari data yang valid.

## 5.4 Penutup

Penelitian ini memperlihatkan bahwa pattern matching dapat dipakai untuk chatbot FAQ dengan ruang lingkup yang jelas. Pada kasus SAMSAT Bandung Timur, sistem dapat mencocokkan pertanyaan pengguna selama pola pertanyaan masih terwakili oleh dataset dan aturan pendukung. Regex membantu mengenali variasi frasa. Dataset tetap menjadi sumber jawaban.
