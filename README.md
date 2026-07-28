# Implementasi Metode Pattern Matching pada Chatbot FAQ: Studi Kasus SAMSAT Bandung Timur

Proyek ini merupakan implementasi chatbot FAQ untuk **SAMSAT Bandung Timur** yang menjadi studi kasus dalam skripsi. Fokus utamanya adalah penerapan **metode pattern matching** untuk mencocokkan pertanyaan pengguna dengan dataset FAQ dan mengembalikan jawaban yang paling relevan.

Teknologi pendukung yang digunakan adalah **Cloudflare Workers** dan **Telegram webhook**.

Languages:

- [English Version](#english-version)
- [Versi Indonesia](#versi-indonesia)

Research and thesis notes:

- [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md)

---

## English Version

### Overview

This project is a Telegram chatbot for frequently asked questions about SAMSAT Bandung Timur. The system uses a **pattern matching method**, not generative AI. The bot compares the user's question with an FAQ dataset and returns the most relevant answer.

The bot runs on Cloudflare Workers, so it does not need to run on your Mac after deployment. Telegram sends user messages to the deployed Worker URL through a webhook.

Current live Worker URL:

```text
https://samsat-bandung-timur-bot.samsat.workers.dev
```

Webhook endpoint:

```text
https://samsat-bandung-timur-bot.samsat.workers.dev/webhook
```

### Features

- Telegram command support: `/start`, `/help`, and `/clear`
- Inline category menu and FAQ buttons per category
- Free-text FAQ matching using pattern matching
- Multi-intent matching for one message that contains more than one FAQ question
- Text-only input handling
- 150 curated FAQ entries for SAMSAT Bandung Timur
- Satisfaction voting UI on each FAQ response
- Main menu is shown again after each FAQ answer

### Clear Command

The bot supports:

```text
/clear
```

This command deletes the conversation messages that have been tracked by the bot. It includes user messages, bot replies, media messages that were rejected by the bot, and the `/clear` command message itself when Telegram allows it. The bot sends a fresh main menu immediately, then runs the old-message cleanup in the background so the opening text and menu stay visible.

Message IDs are stored in Cloudflare KV through the `MESSAGE_STORE` binding, so tracking can survive Worker runtime restarts. The bot stores up to 10000 tracked message IDs per chat and deletes only those known IDs in Telegram batches. This is safer than deleting a guessed numeric range because it protects the fresh main menu from being removed.

Important limitation: Telegram bots can only delete messages by `message_id`, and deletion is still limited by Telegram Bot API rules. The bot cannot delete messages that were sent before tracking was enabled, messages whose IDs were never received by the bot, or messages Telegram refuses to delete.

### Research Data CSV

The bot stores basic Telegram profile data for research after the user sends:

```text
/start
```

After the bot gives an FAQ answer, users can vote whether the answer is `Memuaskan` or `Tidak memuaskan`. The bot calculates the satisfaction percentage from user votes:

```text
Memuaskan (%) = jumlah vote memuaskan / total vote * 100
Tidak memuaskan (%) = jumlah vote tidak memuaskan / total vote * 100
```

Each Telegram user has one active vote per FAQ. If the same user changes their choice, the old vote is corrected instead of counted twice.

Exported fields:

```text
telegram_id
username
first_name
last_name
language_code
started_at
last_seen_at
```

Export CSV through the protected endpoint:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

For a readable terminal table, use:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.txt" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

For a browser-readable HTML table, download it first:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.html" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN" \
  -o research.html
open research.html
```

The research export endpoints require `ADMIN_EXPORT_TOKEN`. Do not share this token publicly.

Export FAQ satisfaction recap:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/satisfaction.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Readable versions are also available:

```text
/satisfaction.txt
/satisfaction.html
```

### Why It Can Run for Free

Telegram supports webhooks, so Telegram sends updates to a public HTTPS endpoint only when users interact with the bot.

Cloudflare Workers provides a free tier that is enough for a small FAQ chatbot. The project also does not use a paid database or a paid server. The FAQ data is bundled as a JSON file.

### Main Files

```text
src/index.ts
```

Main Worker entry point. It receives HTTP requests from Telegram, validates the webhook secret, processes messages or button callbacks, and sends replies through the Telegram Bot API.

```text
src/pattern-matcher.ts
```

Contains the pattern matching algorithm: normalization, multi-intent segmentation, stop-word removal, synonym expansion, custom patterns, relevance calculation, and FAQ ranking.

```text
src/data/faq-samsat-bandung-timur.json
```

The active 150-row FAQ dataset used by the bot. It stores the FAQ rows separately from the algorithm so the data is not hardcoded inside the matching logic. The `id` field is sequential from `1` to `150`, and the `source` field points to a topic-specific reference page instead of only a website homepage.

The active dataset is curated using these criteria:

- Prioritize questions related to core SAMSAT services, vehicle tax, documents, ownership transfer, mutation, physical check, SIGNAL, mobile SAMSAT, facilities, and complaints.
- Keep FAQ rows that have a clear answer and a `source` field.
- Keep the dataset focused on SAMSAT Bandung Timur and relevant West Java SAMSAT information.
- Remove lower-priority or duplicate-like entries so the bot focuses on the most important FAQ rows.

Active dataset distribution:

| Category | Rows |
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

```text
src/faq-data.ts
```

Loads the JSON dataset and validates that every FAQ category is valid.

```text
src/replies.ts
```

Builds Telegram reply messages, category menus, FAQ buttons, and fallback messages.

```text
test/pattern-matcher.test.ts
```

Unit tests for the dataset and pattern matching behavior.

### Environment Variables

Production uses three secret variables:

```env
BOT_TOKEN=your-telegram-botfather-token
WEBHOOK_SECRET=your-random-webhook-secret
ADMIN_EXPORT_TOKEN=your-random-csv-export-token
```

Explanation:

- `BOT_TOKEN`: token from BotFather. The Worker uses this to call Telegram API methods such as `sendMessage`.
- `WEBHOOK_SECRET`: secret used to verify incoming Telegram webhook requests.
- `ADMIN_EXPORT_TOKEN`: secret used to protect `/research.csv`, `/research.txt`, and `/research.html`.

Optional local testing variable:

```env
TELEGRAM_DRY_RUN=true
```

Do not use `TELEGRAM_DRY_RUN=true` in production because it prevents real Telegram replies from being sent.

### Where the Webhook URL Is Stored

The webhook URL is **not stored in `.env`** and is **not stored in the Worker code**.

The webhook URL is stored on **Telegram's server** after running `setWebhook`.

Example:

```sh
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

After this command succeeds, Telegram remembers that user messages for this bot must be sent to:

```text
$WORKER_URL/webhook
```

Check the currently registered webhook:

```sh
set -a
source .env
set +a

curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

If the Worker URL changes, the webhook must be set again.

### Pattern Matching Method

The chatbot is intentionally rule-based.

The core method is **Pattern Matching**, with Regex as a supporting technique. This implementation uses pattern matching through exact phrase comparison, partial phrase comparison, token overlap, order-insensitive token matching for custom patterns, synonym expansion, custom patterns, regex-assisted patterns, and relevance calculation.

Regex is developed in two parts. First, regex is used in `normalize()` to clean punctuation, remove non-alphanumeric characters, normalize spacing, and standardize domain terms such as `drive-thru/drivethru`, `nopol/nomor polisi`, `5 tahun/lima tahunan`, `cabut berkas`, and `gesek rangka`. Second, regex-assisted FAQ patterns are used to detect specific question forms such as `STNK hilang`, `pajak lima tahunan`, `syarat mutasi`, `cek fisik untuk mutasi`, `jadwal Samsat Keliling`, and `Drive Thru`. Regex is **not** the only matching method; it supports the rule-based pattern matching process.

The matcher also supports **multi-intent input**. If one user message contains more than one FAQ question, the system splits the text using punctuation and connector patterns such as `dan`, `lalu`, `terus`, `tapi`, and `kemudian`, then runs pattern matching for each meaningful segment. Each accepted segment must still pass the domain-context validation and a higher multi-intent relevance threshold before the bot sends more than one answer. The bot limits multi-intent replies to avoid making the Telegram chat too long.

### Overall Working Pattern

At a high level, the chatbot works as a Telegram-based request-response system:

1. The user sends `/start`, presses a menu button, or types a question in Telegram.
2. Telegram forwards the update to the Cloudflare Worker through the registered webhook URL.
3. The Worker validates the webhook secret to make sure the request really comes from Telegram.
4. The Worker identifies the input type:
   - command, such as `/start`, `/help`, or `/clear`
   - callback button, such as category, FAQ, pagination, or voting
   - free-text question from the user
   - unsupported media input
5. If the input is `/start`, the bot stores basic Telegram profile data for research and shows the main menu.
6. If the input is a menu or FAQ button, the bot returns the selected category page or selected FAQ answer.
7. If the input is a free-text question, the bot runs the pattern matching process against the 150-row FAQ dataset.
8. Before selecting an answer, the bot checks whether the question is still within the SAMSAT/vehicle-administration domain. Questions that mention SAMSAT but ask about non-administrative services, such as vehicle repair, key replacement, repainting, or workshop services, are rejected with fallback.
9. If the message contains more than one valid FAQ intent, the bot can return more than one answer, but the number is limited so the chat stays readable.
10. For each matched FAQ, the bot sends the selected question, answer, source, satisfaction voting buttons, and then shows the main menu again.
11. If the user votes `Memuaskan` or `Tidak memuaskan`, the Worker stores or updates the vote in Cloudflare KV and recalculates the satisfaction percentage.
12. If the user sends `/clear`, the bot deletes tracked messages according to Telegram Bot API limits and sends a fresh main menu.

In simple terms:

```text
Telegram user input
  -> Telegram webhook
  -> Cloudflare Worker
  -> command/callback/text routing
  -> pattern matching or fallback
  -> Telegram reply
  -> satisfaction voting and research storage
```

Matching flow:

1. Normalize user input into lowercase alphanumeric text.
2. Remove common stop words.
3. Expand simple synonyms, such as `alamat/lokasi`, `jam/jadwal/operasional`, and `bayar/pembayaran`.
4. Compare user input against FAQ questions, categories, custom patterns, and regex-assisted patterns.
5. Calculate the relevance value for each FAQ candidate.
6. Sort candidates by relevance value.
7. Return the best FAQ if the relevance value passes the minimum threshold.
8. Use the relevance value internally to decide whether the FAQ answer is relevant enough.

The pattern matching relevance value is an **internal relevance value**, not a statistical machine-learning accuracy value. The relevance value is calculated from exact/partial phrase matching, order-insensitive custom pattern matching, regex-assisted pattern matching, important token overlap, FAQ token coverage, known-query token coverage, synonym expansion, and a small domain-anchor bonus for SAMSAT-related terms.

The matcher also checks custom-pattern tokens without depending on word order. For example, `syarat bayar pajak`, `pajak bayar syaratnya`, and `bayar pajak apa syaratnya` can point to the same FAQ because the important tokens are still present even though the sentence order changes.

User-facing satisfaction percentage:

- `Memuaskan (%)`: percentage of users who voted that the answer was satisfying.
- `Tidak memuaskan (%)`: percentage of users who voted that the answer was not satisfying.

Example:

```text
User input:
syarat bayar pajak kendaraan
```

The matcher normalizes and tokenizes the input, then compares it with all 150 active FAQ entries. The FAQ question `Syarat bayar pajak` gets a high relevance value because it shares the important terms `syarat`, `bayar`, and `pajak`.

Bot response:

```text
Pertanyaan: Syarat bayar pajak

STNK dan KTP

Sumber: Referensi

Penilaian pengguna:
Belum ada suara.
Silakan nilai apakah jawaban ini memuaskan.
```

### Setup on a New Device or New Account

Use this section if you move the project to a new laptop, a new Cloudflare account, or a new Telegram bot.

1. Install the required tools:

   - Node.js
   - npm
   - Git, if using a Git repository
   - Telegram account
   - Cloudflare account

2. Check Node and npm:

   ```sh
   node --version
   npm --version
   ```

3. Clone the project:

   ```sh
   git clone https://github.com/0x94t3z/tebot.git
   cd tebot
   ```

4. Install dependencies:

   ```sh
   npm install
   ```

5. Create or retrieve a Telegram bot token:

   - Open Telegram.
   - Search for `@BotFather`.
   - Use `/newbot` for a new bot, or retrieve the token for an existing bot.
   - Save the token securely.

6. Generate a webhook secret:

   ```sh
   openssl rand -hex 32
   ```

7. Create `.env`:

   ```sh
   cp .dev.vars.example .env
   ```

8. Fill `.env`:

   ```env
   BOT_TOKEN=your-botfather-token
   WEBHOOK_SECRET=your-random-webhook-secret
   ADMIN_EXPORT_TOKEN=your-random-export-token
   ```

9. Log in to Cloudflare:

   ```sh
   npx wrangler login
   ```

10. If switching Cloudflare accounts:

   ```sh
   npx wrangler logout
   npx wrangler login
   ```

11. Check the Worker config:

   ```text
   wrangler.jsonc
   ```

   Important fields:

   ```jsonc
   {
     "name": "samsat-bandung-timur-bot",
     "main": "src/index.ts",
     "compatibility_date": "2026-06-21",
     "kv_namespaces": [
       {
         "binding": "MESSAGE_STORE",
         "id": "..."
       },
       {
         "binding": "RESEARCH_STORE",
         "id": "..."
       }
     ]
   }
   ```

   If you want a new Worker URL in the same Cloudflare account, change the `name` field before deploying:

   ```jsonc
   {
     "name": "samsat-bandung-timur-bot-v2"
   }
   ```

   If you keep the same `name` in the same Cloudflare account, Wrangler deploys to the same Worker route. If you use a different Cloudflare account, the same Worker name can still produce a different `workers.dev` URL because it belongs to that account.

   `MESSAGE_STORE` is used by `/clear` to store tracked Telegram `message_id` values. If you move to a different Cloudflare account, create a new KV namespace:

   ```sh
   npx wrangler kv namespace create MESSAGE_STORE
   ```

   Then replace the `id` in `wrangler.jsonc` with the new namespace ID.

   `RESEARCH_STORE` is used by `/start` and `/research.csv` to store/export research profile records. If you move to a different Cloudflare account, create another KV namespace:

   ```sh
   npx wrangler kv namespace create RESEARCH_STORE
   ```

   Then replace the `RESEARCH_STORE` `id` in `wrangler.jsonc`.

12. Run checks:

   ```sh
   npm run typecheck
   npm test
   npx wrangler deploy --dry-run
   ```

13. Deploy:

   ```sh
   npx wrangler deploy --secrets-file .env
   ```

14. Copy the deployed Worker URL from the Wrangler output.

15. Set Telegram webhook:

   ```sh
   set -a
   source .env
   set +a

   export WORKER_URL="https://your-worker-url.workers.dev"

   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
     -d "url=$WORKER_URL/webhook" \
     -d "secret_token=$WEBHOOK_SECRET"
   ```

   This replaces the active webhook for that Telegram bot. Telegram will send future bot updates to the new Worker URL.

   Check the active webhook:

   ```sh
   curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   ```

16. Test the bot in Telegram:

   ```text
   /start
   syarat bayar pajak kendaraan
   stnk hilang
   alamat samsat bandung timur
   apa itu pattern matching
   ```

### Deployment

Login:

```sh
npx wrangler login
```

Deploy:

```sh
npx wrangler deploy --secrets-file .env
```

Set webhook:

```sh
set -a
source .env
set +a

export WORKER_URL="https://samsat-bandung-timur-bot.samsat.workers.dev"

curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

Check webhook:

```sh
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

### Updating FAQ Data

Edit:

```text
src/data/faq-samsat-bandung-timur.json
```

This is the active 150-row dataset used by the bot. Keep `id` values sequential from `1` to `150` when replacing the dataset.

For detailed maintenance steps when a lecturer or tester finds a new valid question pattern, see [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md#jika-dosen-menguji-pertanyaan-baru). That document explains when to update the dataset, add custom patterns, add supporting regex, and add regression tests.

Then run:

```sh
npm run typecheck
npm test
npx wrangler deploy --secrets-file .env
```

### Testing

Run automated checks before deploying:

```sh
npm run typecheck
npm test
```

The test suite validates the FAQ dataset, pattern matching behavior, fallback behavior, multi-intent handling, and Telegram reply formatting. Respondent trials should still be performed through the Telegram bot because Telegram is the implementation medium.

Check pattern matching relevance value for one question:

```sh
npm run relevance -- "Kalau STNK hilang bagaimana?"
```

This command prints normalization, removed stop words, base tokens, expanded synonym tokens, multi-intent segments, context checks, matched FAQ ID, category, internal relevance value, and matched terms. The relevance value is for debugging/research explanation only; it is not shown to Telegram users.

For thesis-focused explanations about 150 FAQ rows versus 209 test cases, black box testing, random-question limitations, and respondent trials, see [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md).

### Troubleshooting

Check Worker health:

```sh
curl https://samsat-bandung-timur-bot.samsat.workers.dev/health
```

Check bot identity:

```sh
set -a
source .env
set +a

curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"
```

Check webhook:

```sh
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Watch live Worker logs:

```sh
npx wrangler tail samsat-bandung-timur-bot --format pretty
```

If the log shows `POST /webhook - Ok`, Telegram successfully reached the Worker.

### Files That Are Safe or Secret

Safe to share:

```text
src/
test/
README.md
package.json
package-lock.json
tsconfig.json
wrangler.jsonc
.dev.vars.example
```

Do not share:

```text
.env
.dev.vars
.env.test-local
```

These files may contain `BOT_TOKEN` and `WEBHOOK_SECRET`.

### Thesis Notes

For presentation answers, black box testing notes, 150 FAQ rows versus 209 test cases, and maintenance steps when new question patterns appear, see [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md).

---

## Versi Indonesia

### Gambaran Umum

Project ini adalah chatbot Telegram untuk menjawab pertanyaan FAQ seputar SAMSAT Bandung Timur. Chatbot ini memakai **metode pattern matching berbasis aturan**, bukan AI generatif. Sistem mencocokkan pertanyaan user dengan dataset FAQ, lalu mengirim jawaban yang paling sesuai.

Bot berjalan di Cloudflare Workers, jadi setelah deploy bot tidak berjalan di Mac. Telegram mengirim pesan user ke URL Worker melalui webhook.

URL Worker saat ini:

```text
https://samsat-bandung-timur-bot.samsat.workers.dev
```

Endpoint webhook:

```text
https://samsat-bandung-timur-bot.samsat.workers.dev/webhook
```

### Fitur

- Command Telegram: `/start`, `/help`, dan `/clear`
- Menu kategori dengan inline button
- Tombol FAQ per kategori, dibatasi 7 pertanyaan per halaman
- Navigasi berikutnya/sebelumnya untuk kategori yang memiliki lebih dari 7 pertanyaan
- Navigasi tombol memperbarui pesan menu yang sama, bukan mengirim chat baru
- Pencarian pertanyaan bebas dengan pattern matching
- Pencarian multi-intent untuk satu pesan yang berisi lebih dari satu pertanyaan FAQ
- Input hanya teks; media seperti foto, video, sticker, voice note, dan file ditolak dengan pesan instruksi singkat
- 150 data FAQ terkurasi untuk SAMSAT Bandung Timur
- Menu utama ditampilkan kembali setelah setiap jawaban FAQ
- UI voting kepuasan pada setiap jawaban FAQ
- 10 kategori aktif FAQ:
  - Layanan
  - Pajak
  - Dokumen
  - Balik Nama
  - Mutasi
  - Cek Fisik
  - SIGNAL
  - Samsat Keliling
  - Fasilitas
  - Pengaduan
- Validasi webhook secret dengan `X-Telegram-Bot-Api-Secret-Token`
- Mode dry-run lokal untuk testing webhook tanpa mengirim pesan Telegram sungguhan
- Pencatatan profil riset otomatis setelah `/start`
- Export CSV terproteksi untuk data profil Telegram dan rekap kepuasan FAQ

### Rancangan Sistem

#### Tujuan Sistem

Sistem dirancang untuk membantu pengguna memperoleh informasi FAQ seputar SAMSAT Bandung Timur melalui chatbot Telegram. Chatbot menerima pertanyaan dalam bentuk teks, mencocokkannya dengan dataset FAQ menggunakan metode pattern matching, lalu mengembalikan jawaban yang paling relevan. Setelah jawaban diberikan, user dapat menilai apakah jawaban tersebut memuaskan atau tidak memuaskan melalui tombol voting.

#### Aktor Sistem

| Aktor | Peran |
| --- | --- |
| User Telegram | Mengirim pertanyaan, memilih kategori FAQ, memilih pertanyaan dari menu, dan memberi voting kepuasan terhadap jawaban |
| Chatbot Telegram | Menampilkan menu, menerima input, mengirim jawaban, dan menampilkan UI voting |
| Cloudflare Worker | Menjalankan backend chatbot, menerima webhook Telegram, memproses pattern matching, menyimpan data riset, dan memanggil Telegram Bot API |
| Admin/Peneliti | Mengelola token, deploy Worker, memperbarui dataset FAQ, dan mengekspor data riset |

#### Tech Stack

| Komponen | Teknologi | Fungsi |
| --- | --- | --- |
| Platform chat | Telegram Bot API | Media interaksi user dengan chatbot |
| Bot management | BotFather | Membuat bot dan mendapatkan `BOT_TOKEN` |
| Backend | Cloudflare Workers | Menjalankan logic chatbot secara serverless melalui endpoint HTTPS |
| Runtime | TypeScript | Bahasa utama untuk implementasi backend |
| Deployment | Wrangler | CLI untuk deploy dan konfigurasi Cloudflare Workers |
| Penyimpanan data dinamis | Cloudflare KV | Menyimpan profil riset, vote kepuasan, dan message ID untuk `/clear` |
| Dataset FAQ | JSON | Menyimpan data FAQ agar terpisah dari logic algoritma |
| Testing | Vitest | Unit test dataset, tampilan pesan, dan perilaku pattern matching |
| Type checking | TypeScript Compiler | Memastikan tipe data aman sebelum deploy |

#### Arsitektur Sistem

```text
User Telegram
    |
    | pesan teks / callback button
    v
Telegram Bot API
    |
    | webhook POST /webhook
    v
Cloudflare Worker
    |
    | validasi secret webhook
    | routing command/callback/input teks
    | pattern matching terhadap dataset FAQ
    | simpan data riset dan vote ke KV
    v
Telegram Bot API
    |
    | sendMessage / editMessageText / deleteMessages
    v
User Telegram
```

#### Alur Utama Sistem

1. User membuka bot dan mengirim `/start`.
2. Bot menyimpan profil dasar user ke `RESEARCH_STORE`.
3. Bot menampilkan pesan pembuka dan menu kategori FAQ.
4. User dapat memilih kategori, memilih pertanyaan dari tombol, atau mengetik pertanyaan bebas.
5. Jika user mengetik pertanyaan bebas, sistem menjalankan proses pattern matching.
6. Jika satu pesan berisi beberapa pertanyaan, sistem memecah pesan menjadi beberapa segmen intent yang bermakna.
7. Sistem memilih FAQ dengan nilai relevansi tertinggi jika melewati batas minimum.
8. Bot mengirim satu atau beberapa jawaban, sumber referensi, dan tombol voting kepuasan untuk masing-masing jawaban.
9. Bot menampilkan kembali menu utama agar user dapat melanjutkan pencarian.
10. Jika user memilih voting, sistem menyimpan atau memperbarui vote user.
11. Bot memperbarui tampilan hasil voting dalam bentuk persentase memuaskan dan tidak memuaskan.

#### Pola Cara Kerja Keseluruhan

Secara umum, chatbot bekerja sebagai sistem tanya jawab berbasis Telegram:

1. User mengirim `/start`, menekan tombol menu, atau mengetik pertanyaan di Telegram.
2. Telegram meneruskan update tersebut ke Cloudflare Worker melalui URL webhook yang sudah didaftarkan.
3. Cloudflare Worker memvalidasi webhook secret untuk memastikan request berasal dari Telegram.
4. Worker mengidentifikasi jenis input:
   - command seperti `/start`, `/help`, atau `/clear`
   - callback button seperti kategori, FAQ, pagination, atau voting
   - pertanyaan bebas dalam bentuk teks
   - input media yang tidak didukung
5. Jika input berupa `/start`, bot menyimpan profil dasar Telegram user untuk kebutuhan riset dan menampilkan menu utama.
6. Jika input berasal dari tombol menu atau tombol FAQ, bot menampilkan halaman kategori atau jawaban FAQ yang dipilih.
7. Jika input berupa pertanyaan bebas, bot menjalankan proses pattern matching terhadap 150 data FAQ aktif.
8. Sebelum memilih jawaban, bot memeriksa apakah pertanyaan masih berada dalam domain SAMSAT atau administrasi kendaraan. Pertanyaan yang menyebut SAMSAT tetapi membahas layanan non-administrasi, seperti perbaikan kendaraan, pembuatan kunci, pengecatan kendaraan, atau layanan bengkel, akan diarahkan ke fallback.
9. Jika satu pesan berisi lebih dari satu intent FAQ yang valid, bot dapat mengirim lebih dari satu jawaban, tetapi jumlahnya dibatasi agar chat tetap mudah dibaca.
10. Untuk setiap FAQ yang cocok, bot mengirim pertanyaan terpilih, jawaban, sumber, tombol voting kepuasan, lalu menampilkan kembali menu utama.
11. Jika user memilih `Memuaskan` atau `Tidak memuaskan`, Worker menyimpan atau memperbarui voting di Cloudflare KV dan menghitung ulang persentase kepuasan.
12. Jika user mengirim `/clear`, bot menghapus pesan yang terlacak sesuai batasan Telegram Bot API dan mengirim menu utama baru.

Ringkasnya:

```text
Input user di Telegram
  -> webhook Telegram
  -> Cloudflare Worker
  -> routing command/callback/teks
  -> pattern matching atau fallback
  -> balasan Telegram
  -> voting kepuasan dan penyimpanan data riset
```

#### Flow Pattern Matching

```text
Input user
  -> normalisasi teks
  -> segmentasi multi-intent jika pesan memuat lebih dari satu pertanyaan
  -> tokenisasi
  -> penghapusan stop word
  -> perluasan sinonim
  -> validasi konteks domain SAMSAT
  -> pencocokan terhadap pertanyaan, kategori, custom pattern, dan regex pattern FAQ
  -> perhitungan nilai relevansi
  -> pemeringkatan kandidat FAQ
  -> jawaban terbaik atau fallback
```

Regex dikembangkan untuk dua kebutuhan. Pertama, regex preprocessing di fungsi `normalize()` membersihkan tanda baca, karakter non-alfanumerik, spasi, dan menyamakan variasi istilah seperti `drive-thru/drivethru`, `nopol/nomor polisi`, `5 tahun/lima tahunan`, `cabut berkas`, dan `gesek rangka`. Kedua, regex pattern membantu mendeteksi bentuk pertanyaan spesifik seperti `STNK hilang`, `pajak lima tahunan`, `syarat mutasi`, `cek fisik untuk mutasi`, `jadwal Samsat Keliling`, dan `Drive Thru`. Regex tetap berperan sebagai pendukung, sedangkan metode utama tetap pattern matching berbasis aturan melalui pencocokan frasa, token, pencocokan token tanpa bergantung urutan kata, sinonim, custom pattern, regex pattern, dan perhitungan nilai relevansi.

Matcher juga mendukung **input multi-intent**. Jika satu pesan user berisi lebih dari satu pertanyaan FAQ, sistem memecah teks dengan pola tanda baca dan connector seperti `dan`, `lalu`, `terus`, `tapi`, dan `kemudian`, lalu menjalankan pattern matching pada setiap segmen yang bermakna. Setiap segmen tetap harus lolos validasi konteks domain dan batas nilai relevansi multi-intent yang lebih tinggi sebelum bot mengirim lebih dari satu jawaban. Jumlah jawaban multi-intent dibatasi agar chat Telegram tetap ringkas.

#### Flow Voting Kepuasan Jawaban

```text
Jawaban FAQ dikirim
  -> bot menampilkan tombol Memuaskan / Tidak memuaskan
  -> user memilih salah satu tombol
  -> callback vote:FAQ_ID:s atau vote:FAQ_ID:d diterima Worker
  -> Worker mengecek vote lama user untuk FAQ tersebut
  -> jika vote berubah, total lama dikurangi dan total baru ditambah
  -> hasil voting disimpan ke RESEARCH_STORE
  -> pesan jawaban di-update dengan persentase voting terbaru
  -> bot menampilkan kembali menu utama
```

Rumus persentase kepuasan:

```text
Memuaskan (%) = jumlah vote memuaskan / total vote * 100
Tidak memuaskan (%) = jumlah vote tidak memuaskan / total vote * 100
```

Satu user hanya memiliki satu vote aktif untuk satu FAQ. Jika user menekan tombol yang berbeda pada FAQ yang sama, sistem memperbarui pilihan tersebut dan tidak menghitungnya sebagai suara ganda.

#### Rancangan Database

Project ini tidak menggunakan database relasional seperti MySQL atau PostgreSQL. Penyimpanan data dinamis menggunakan **Cloudflare KV**, yaitu database key-value. Dataset FAQ disimpan sebagai file JSON karena data FAQ bersifat relatif statis dan perlu mudah diperbarui tanpa mengubah logic algoritma.

Dataset aktif untuk bot berisi **150 FAQ terkurasi** di satu file JSON. Field `id` dibuat berurutan dari `1` sampai `150` agar data mudah dibaca, tidak ambigu, dan sesuai dengan jumlah dataset aktif.

Kriteria kurasi dataset aktif:

- Memprioritaskan pertanyaan yang berkaitan dengan layanan inti SAMSAT, pajak kendaraan, dokumen kendaraan, balik nama, mutasi, cek fisik, SIGNAL, Samsat Keliling, fasilitas, dan pengaduan.
- Mempertahankan data FAQ yang memiliki jawaban jelas dan field `source`.
- Menjaga fokus data pada SAMSAT Bandung Timur dan informasi SAMSAT Jawa Barat yang masih relevan.
- Mengeluarkan data yang prioritasnya lebih rendah atau mirip duplikat agar dataset aktif tetap fokus pada FAQ penting.

Distribusi dataset aktif:

| Kategori | Jumlah |
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

##### Dataset FAQ

Lokasi file:

```text
src/data/faq-samsat-bandung-timur.json
```

Struktur data:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | number | ID unik FAQ |
| `category` | string | Kategori FAQ |
| `question` | string | Pertanyaan FAQ |
| `answer` | string | Jawaban FAQ |
| `source` | string | Sumber referensi jawaban |

Contoh struktur:

```json
{
  "id": 64,
  "category": "Pajak",
  "question": "Apa syarat membayar pajak tahunan",
  "answer": "STNK dan KTP asli sesuai identitas pemilik kendaraan.",
  "source": "Referensi"
}
```

##### KV Namespace

| Binding | Fungsi |
| --- | --- |
| `MESSAGE_STORE` | Menyimpan daftar `message_id` Telegram agar command `/clear` dapat menghapus chat yang dilacak |
| `RESEARCH_STORE` | Menyimpan profil user riset, total voting kepuasan, dan pilihan voting terakhir user |

##### Struktur Key-Value

| Key | Value | Fungsi |
| --- | --- | --- |
| `chat:{chatId}:message_ids` | `number[]` | Menyimpan daftar message ID yang dapat dibersihkan oleh `/clear` |
| `research:user:{telegramId}` | `ResearchUserRecord` | Menyimpan profil dasar user Telegram untuk kebutuhan riset |
| `research:faq_stats:{faqId}` | `SatisfactionStats` | Menyimpan total vote memuaskan dan tidak memuaskan per FAQ |
| `research:faq_vote:{faqId}:{telegramId}` | `SatisfactionVoteRecord` | Menyimpan pilihan terakhir satu user untuk satu FAQ |

##### Struktur `ResearchUserRecord`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `telegram_id` | number | ID Telegram user |
| `username` | string | Username Telegram jika tersedia |
| `first_name` | string | Nama depan Telegram |
| `last_name` | string | Nama belakang Telegram |
| `language_code` | string | Kode bahasa dari Telegram |
| `started_at` | string | Waktu pertama user menjalankan `/start` |
| `last_seen_at` | string | Waktu terakhir user berinteraksi setelah terdaftar |

Contoh:

```json
{
  "telegram_id": 5565698191,
  "username": "Kingkha1933",
  "first_name": "Khang",
  "last_name": "Skuyy",
  "language_code": "id",
  "started_at": "2026-06-21T09:56:48.858Z",
  "last_seen_at": "2026-06-21T09:59:40.990Z"
}
```

##### Struktur `SatisfactionStats`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `satisfied` | number | Jumlah vote memuaskan |
| `dissatisfied` | number | Jumlah vote tidak memuaskan |

Contoh:

```json
{
  "satisfied": 8,
  "dissatisfied": 2
}
```

##### Struktur `SatisfactionVoteRecord`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `faq_id` | number | ID FAQ yang dinilai |
| `telegram_id` | number | ID Telegram user yang memberi vote |
| `choice` | string | `satisfied` atau `dissatisfied` |
| `updated_at` | string | Waktu vote dibuat atau diperbarui |

Contoh:

```json
{
  "faq_id": 64,
  "telegram_id": 5565698191,
  "choice": "satisfied",
  "updated_at": "2026-06-21T10:05:00.000Z"
}
```

#### Endpoint Sistem

| Endpoint | Method | Akses | Fungsi |
| --- | --- | --- | --- |
| `/` | GET | Publik | Health check dasar Worker |
| `/health` | GET | Publik | Health check Worker |
| `/webhook` | POST | Telegram + secret | Menerima update dari Telegram |
| `/research.csv` | GET | Admin token | Export profil user riset dalam CSV |
| `/research.txt` | GET | Admin token | Export profil user riset dalam tabel teks |
| `/research.html` | GET | Admin token | Export profil user riset dalam HTML |
| `/satisfaction.csv` | GET | Admin token | Export rekap voting kepuasan FAQ dalam CSV |
| `/satisfaction.txt` | GET | Admin token | Export rekap voting kepuasan FAQ dalam tabel teks |
| `/satisfaction.html` | GET | Admin token | Export rekap voting kepuasan FAQ dalam HTML |

#### Keamanan Sistem

- Webhook divalidasi memakai header `X-Telegram-Bot-Api-Secret-Token`.
- Endpoint export riset dilindungi dengan `Authorization: Bearer $ADMIN_EXPORT_TOKEN`.
- Token rahasia disimpan di `.env` atau secret Cloudflare, bukan di source code.
- Input selain teks ditolak agar chatbot hanya memproses pertanyaan tertulis.
- Chatbot hanya menjawab pertanyaan yang memiliki konteks domain SAMSAT atau administrasi kendaraan.

#### Batasan Sistem

- Chatbot tidak menggunakan AI generatif, sehingga jawaban terbatas pada dataset FAQ.
- Jika pertanyaan tidak cocok dengan dataset atau berada di luar konteks SAMSAT, bot menampilkan fallback.
- Regex digunakan untuk preprocessing dan pendeteksian pola spesifik, tetapi bukan satu-satunya metode pencocokan.
- Penghapusan chat dengan `/clear` mengikuti batasan Telegram Bot API dan hanya dapat menghapus pesan yang dilacak oleh bot.
- Data FAQ diperbarui melalui file JSON, sehingga perubahan dataset perlu dilakukan di repository lalu dideploy ulang.

#### Output Sistem dan Data Riset

Data yang dapat digunakan untuk kebutuhan analisis penelitian:

| Output | Sumber | Fungsi |
| --- | --- | --- |
| Data FAQ aktif | `src/data/faq-samsat-bandung-timur.json` | Objek utama pencocokan pattern matching |
| Hasil pencocokan | Log Worker dan perilaku bot | Melihat FAQ yang dipilih dari input user |
| Profil responden | `/research.csv` | Mendata user yang mencoba bot |
| Rekap kepuasan jawaban | `/satisfaction.csv` | Mengukur persentase jawaban yang dinilai memuaskan atau tidak memuaskan |
| Unit test | `test/` | Membuktikan dataset dan matcher berjalan sesuai ekspektasi |

### Command Clear

Bot mendukung:

```text
/clear
```

Command ini menghapus pesan percakapan yang sudah dilacak oleh bot. Ini mencakup pesan user, balasan bot, pesan media yang ditolak oleh bot, dan pesan `/clear` itu sendiri jika Telegram mengizinkan. Bot langsung mengirim menu utama baru, lalu membersihkan pesan lama di background agar kata pembuka dan menu tetap terlihat.

Message ID disimpan di Cloudflare KV melalui binding `MESSAGE_STORE`, sehingga data pelacakan tetap tersedia meskipun runtime Worker restart. Bot menyimpan sampai 10000 message ID yang terlacak per chat dan hanya menghapus ID yang memang diketahui oleh bot secara batch di Telegram. Cara ini lebih aman daripada menghapus berdasarkan tebakan rentang angka karena menu utama baru tidak ikut terhapus.

Batasan penting: bot Telegram hanya bisa menghapus pesan berdasarkan `message_id`, dan penghapusan tetap mengikuti aturan Telegram Bot API. Bot tidak bisa menghapus pesan yang dikirim sebelum tracking aktif, pesan yang ID-nya tidak pernah diterima bot, atau pesan yang ditolak oleh Telegram.

### CSV Data Riset

Bot menyimpan data profil Telegram dasar untuk kebutuhan riset setelah user mengirim:

```text
/start
```

Setelah bot memberikan jawaban FAQ, user dapat memilih apakah jawaban tersebut `Memuaskan` atau `Tidak memuaskan`. Bot menghitung persentase kepuasan dari voting user:

```text
Memuaskan (%) = jumlah vote memuaskan / total vote * 100
Tidak memuaskan (%) = jumlah vote tidak memuaskan / total vote * 100
```

Setiap user Telegram memiliki satu vote aktif per FAQ. Jika user yang sama mengganti pilihan, vote lama dikoreksi dan tidak dihitung dobel.

Field export:

```text
telegram_id
username
first_name
last_name
language_code
started_at
last_seen_at
```

Export rekap kepuasan FAQ:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/satisfaction.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Versi yang mudah dibaca juga tersedia:

```text
/satisfaction.txt
/satisfaction.html
```

Export CSV melalui endpoint terproteksi:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.csv" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Untuk tabel yang lebih mudah dibaca di terminal, gunakan:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.txt" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN"
```

Untuk tabel HTML yang bisa dibuka di browser, download dulu filenya:

```sh
curl "https://samsat-bandung-timur-bot.samsat.workers.dev/research.html" \
  -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN" \
  -o research.html
open research.html
```

Endpoint export data riset membutuhkan `ADMIN_EXPORT_TOKEN`. Jangan membagikan token ini ke publik.

### Kenapa Bisa Berjalan Gratis

Telegram mendukung webhook, jadi Telegram hanya mengirim update ke endpoint HTTPS publik saat user berinteraksi dengan bot.

Cloudflare Workers memiliki free tier yang cukup untuk chatbot FAQ skala kecil. Project ini juga tidak memakai database berbayar atau server berbayar. Data FAQ dibundel sebagai file JSON.

### File Utama

```text
src/index.ts
```

File utama Cloudflare Worker. File ini menerima request dari Telegram, memvalidasi webhook secret, memproses pesan atau tombol, dan mengirim balasan melalui Telegram Bot API.

```text
src/pattern-matcher.ts
```

Berisi algoritma pattern matching: normalisasi teks, segmentasi multi-intent, penghapusan stop word, perluasan sinonim, custom pattern, perhitungan nilai relevansi, dan pemeringkatan FAQ.

```text
src/data/faq-samsat-bandung-timur.json
```

Dataset FAQ aktif berisi 150 data terkurasi dengan ID berurutan `1-150`. Data disimpan terpisah dari algoritma agar tidak hardcoded di logic pencocokan. Field `source` diarahkan ke halaman referensi yang spesifik sesuai topik, bukan hanya halaman utama website.

```text
src/faq-data.ts
```

Memuat dataset JSON dan memvalidasi bahwa setiap kategori FAQ valid.

```text
src/replies.ts
```

Membentuk pesan balasan Telegram, menu kategori, tombol FAQ, dan pesan fallback.

```text
test/pattern-matcher.test.ts
```

Unit test untuk dataset dan perilaku pattern matching.

### Environment Variables

Production memakai tiga secret variable:

```env
BOT_TOKEN=token-dari-botfather
WEBHOOK_SECRET=secret-random
ADMIN_EXPORT_TOKEN=token-random-export-csv
```

Penjelasan:

- `BOT_TOKEN`: token dari BotFather. Worker memakai token ini untuk memanggil Telegram API seperti `sendMessage`.
- `WEBHOOK_SECRET`: secret untuk memverifikasi request webhook yang masuk dari Telegram.
- `ADMIN_EXPORT_TOKEN`: secret untuk melindungi endpoint `/research.csv`, `/research.txt`, dan `/research.html`.

Variabel opsional untuk testing lokal:

```env
TELEGRAM_DRY_RUN=true
```

Jangan gunakan `TELEGRAM_DRY_RUN=true` di production karena bot tidak akan benar-benar mengirim balasan Telegram.

### Di Mana URL Webhook Disimpan?

URL webhook **tidak disimpan di `.env`** dan **tidak disimpan di kode Worker**.

URL webhook disimpan di **server Telegram** setelah menjalankan `setWebhook`.

Contoh:

```sh
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

Setelah command berhasil, Telegram menyimpan bahwa pesan user untuk bot ini harus dikirim ke:

```text
$WORKER_URL/webhook
```

Cek webhook yang sedang aktif:

```sh
set -a
source .env
set +a

curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Jika URL Worker berubah, webhook harus diset ulang.

### Metode Pattern Matching

Chatbot ini sengaja dibuat rule-based.

Metode utama sistem adalah **Pattern Matching**, dengan Regex sebagai teknik pendukung. Implementasi ini memakai pattern matching melalui pencocokan frasa persis, pencocokan frasa sebagian, overlap token, pencocokan token tanpa bergantung urutan kata pada custom pattern, perluasan sinonim, custom pattern, regex-assisted pattern, dan perhitungan nilai relevansi.

Regex dikembangkan dalam dua bagian. Pertama, regex pada `normalize()` dipakai untuk membersihkan tanda baca, menghapus karakter non-alfanumerik, merapikan spasi, dan menyamakan variasi istilah seperti `drive-thru/drivethru`, `nopol/nomor polisi`, `5 tahun/lima tahunan`, `cabut berkas`, dan `gesek rangka`. Kedua, regex pattern dipakai untuk mendeteksi pola pertanyaan spesifik seperti `STNK hilang`, `pajak lima tahunan`, `syarat mutasi`, `cek fisik untuk mutasi`, `jadwal Samsat Keliling`, dan `Drive Thru`. Regex **bukan satu-satunya metode pencocokan**, tetapi memperkuat proses pattern matching berbasis aturan.

Matcher juga mendukung **input multi-intent**. Jika satu pesan user berisi lebih dari satu pertanyaan FAQ, sistem memecah teks memakai pola tanda baca dan connector seperti `dan`, `lalu`, `terus`, `tapi`, dan `kemudian`, lalu menjalankan pattern matching pada setiap segmen yang bermakna. Setiap segmen tetap harus lolos validasi konteks domain dan batas nilai relevansi multi-intent yang lebih tinggi sebelum bot mengirim lebih dari satu jawaban.

Alur pencocokan:

1. Input user dinormalisasi menjadi teks lowercase alphanumeric.
2. Jika pesan berisi beberapa pertanyaan, teks dipecah menjadi beberapa segmen intent.
3. Stop word umum dihapus.
4. Sinonim sederhana diperluas, seperti `alamat/lokasi`, `jam/jadwal/operasional`, dan `bayar/pembayaran`.
5. Input user dibandingkan dengan pertanyaan FAQ, kategori, custom pattern, dan regex pattern.
6. Setiap kandidat FAQ dihitung nilai relevansinya.
7. Kandidat diurutkan berdasarkan nilai relevansi.
8. FAQ terbaik dikembalikan jika nilai relevansinya melewati batas minimum.
9. Nilai relevansi dipakai secara internal untuk menentukan apakah jawaban FAQ cukup relevan.

Nilai pattern matching adalah **nilai relevansi internal**, bukan nilai akurasi statistik seperti pada evaluasi machine learning. Nilai relevansi dihitung dari kecocokan frasa persis/sebagian, custom pattern tanpa bergantung urutan kata, regex pattern, overlap kata penting, cakupan token FAQ, cakupan token input yang dikenal dataset, perluasan sinonim, dan bonus kecil untuk istilah domain SAMSAT.

Matcher juga mengecek token custom pattern tanpa bergantung pada urutan kata. Contohnya, `syarat bayar pajak`, `pajak bayar syaratnya`, dan `bayar pajak apa syaratnya` tetap dapat diarahkan ke FAQ yang sama karena token pentingnya masih sama walaupun susunan kalimat user berubah.

Persentase kepuasan yang terlihat oleh user:

- `Memuaskan (%)`: persentase user yang menilai jawaban memuaskan.
- `Tidak memuaskan (%)`: persentase user yang menilai jawaban tidak memuaskan.

Contoh:

```text
Input user:
syarat bayar pajak kendaraan
```

Matcher menormalisasi dan memecah input menjadi token, lalu membandingkannya dengan 150 FAQ aktif. Pertanyaan FAQ `Syarat bayar pajak` mendapat nilai relevansi tinggi karena memiliki kata penting yang sama: `syarat`, `bayar`, dan `pajak`.

Balasan bot:

```text
Pertanyaan: Syarat bayar pajak

STNK dan KTP

Sumber: Referensi

Penilaian pengguna:
Belum ada suara.
Silakan nilai apakah jawaban ini memuaskan.
```

### Setup di Device Baru atau Account Baru

Gunakan bagian ini jika project dipindahkan ke laptop baru, Cloudflare account baru, atau Telegram bot baru.

1. Install aplikasi yang dibutuhkan:

   - Node.js
   - npm
   - Git, jika memakai repository Git
   - Telegram account
   - Cloudflare account

2. Cek Node dan npm:

   ```sh
   node --version
   npm --version
   ```

3. Clone project:

   ```sh
   git clone https://github.com/0x94t3z/tebot.git
   cd tebot
   ```

4. Install dependency:

   ```sh
   npm install
   ```

5. Buat atau ambil token bot Telegram:

   - Buka Telegram.
   - Cari `@BotFather`.
   - Gunakan `/newbot` untuk bot baru, atau ambil token bot lama.
   - Simpan token secara aman.

6. Generate webhook secret:

   ```sh
   openssl rand -hex 32
   ```

7. Buat `.env`:

   ```sh
   cp .dev.vars.example .env
   ```

8. Isi `.env`:

   ```env
   BOT_TOKEN=token-dari-botfather
   WEBHOOK_SECRET=secret-random
   ADMIN_EXPORT_TOKEN=token-random-export
   ```

9. Login ke Cloudflare:

   ```sh
   npx wrangler login
   ```

10. Jika pindah Cloudflare account:

   ```sh
   npx wrangler logout
   npx wrangler login
   ```

11. Cek konfigurasi Worker:

   ```text
   wrangler.jsonc
   ```

   Bagian penting:

   ```jsonc
   {
     "name": "samsat-bandung-timur-bot",
     "main": "src/index.ts",
     "compatibility_date": "2026-06-21",
     "kv_namespaces": [
       {
         "binding": "MESSAGE_STORE",
         "id": "..."
       },
       {
         "binding": "RESEARCH_STORE",
         "id": "..."
       }
     ]
   }
   ```

   Jika ingin URL Worker baru di Cloudflare account yang sama, ubah field `name` sebelum deploy:

   ```jsonc
   {
     "name": "samsat-bandung-timur-bot-v2"
   }
   ```

   Jika `name` tetap sama di Cloudflare account yang sama, Wrangler akan deploy ke Worker route yang sama. Jika memakai Cloudflare account berbeda, nama Worker yang sama tetap bisa menghasilkan URL `workers.dev` berbeda karena URL tersebut milik account itu.

   `MESSAGE_STORE` dipakai oleh `/clear` untuk menyimpan `message_id` Telegram yang sudah dilacak. Jika pindah ke Cloudflare account lain, buat KV namespace baru:

   ```sh
   npx wrangler kv namespace create MESSAGE_STORE
   ```

   Lalu ganti `id` di `wrangler.jsonc` dengan namespace ID yang baru.

   `RESEARCH_STORE` dipakai oleh `/start` dan `/research.csv` untuk menyimpan/export data profil riset. Jika pindah ke Cloudflare account lain, buat KV namespace lain:

   ```sh
   npx wrangler kv namespace create RESEARCH_STORE
   ```

   Lalu ganti `id` `RESEARCH_STORE` di `wrangler.jsonc`.

12. Jalankan pengecekan:

   ```sh
   npm run typecheck
   npm test
   npx wrangler deploy --dry-run
   ```

13. Deploy:

   ```sh
   npx wrangler deploy --secrets-file .env
   ```

14. Copy URL Worker dari output Wrangler.

15. Set webhook Telegram:

   ```sh
   set -a
   source .env
   set +a

   export WORKER_URL="https://your-worker-url.workers.dev"

   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
     -d "url=$WORKER_URL/webhook" \
     -d "secret_token=$WEBHOOK_SECRET"
   ```

   Ini mengganti webhook aktif untuk bot Telegram tersebut. Setelah itu Telegram akan mengirim update bot ke URL Worker yang baru.

   Cek webhook aktif:

   ```sh
   curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   ```

16. Test bot di Telegram:

   ```text
   /start
   syarat bayar pajak kendaraan
   stnk hilang
   alamat samsat bandung timur
   apa itu pattern matching
   ```

### Deployment

Login:

```sh
npx wrangler login
```

Deploy:

```sh
npx wrangler deploy --secrets-file .env
```

Set webhook:

```sh
set -a
source .env
set +a

export WORKER_URL="https://samsat-bandung-timur-bot.samsat.workers.dev"

curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

Cek webhook:

```sh
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

### Update Data FAQ

Edit:

```text
src/data/faq-samsat-bandung-timur.json
```

File ini adalah dataset aktif 150 data yang dipakai bot. Pastikan field `id` tetap berurutan dari `1` sampai `150` jika dataset diganti.

Untuk langkah detail jika dosen atau penguji menemukan pola pertanyaan valid baru, lihat [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md#jika-dosen-menguji-pertanyaan-baru). Dokumen tersebut menjelaskan kapan harus update dataset, tambah custom pattern, tambah regex pendukung, dan tambah regression test.

Lalu jalankan:

```sh
npm run typecheck
npm test
npx wrangler deploy --secrets-file .env
```

### Pengujian

Jalankan pengecekan otomatis sebelum deploy:

```sh
npm run typecheck
npm test
```

Test suite memvalidasi dataset FAQ, perilaku pattern matching, fallback, multi-intent, dan format balasan Telegram. Uji coba responden tetap dilakukan melalui Telegram bot karena Telegram adalah media implementasi chatbot.

Cek nilai relevansi pattern matching untuk satu pertanyaan:

```sh
npm run relevance -- "Kalau STNK hilang bagaimana?"
```

Command ini menampilkan normalisasi, stop word yang dibuang, base token, token hasil sinonim, segmentasi multi-intent, pengecekan konteks, ID FAQ yang cocok, kategori, nilai relevansi internal, dan matched terms. Nilai relevansi ini hanya untuk debug dan penjelasan penelitian; nilai relevansi tidak ditampilkan kepada user Telegram.

Untuk penjelasan Tugas Akhir tentang 150 data FAQ vs 209 test case, black box testing, batasan pertanyaan random, dan uji coba responden, lihat [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md).

### Troubleshooting

Cek health Worker:

```sh
curl https://samsat-bandung-timur-bot.samsat.workers.dev/health
```

Cek identitas bot:

```sh
set -a
source .env
set +a

curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"
```

Cek webhook:

```sh
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Lihat live log Worker:

```sh
npx wrangler tail samsat-bandung-timur-bot --format pretty
```

Jika log menunjukkan `POST /webhook - Ok`, berarti Telegram berhasil mengirim update ke Worker.

### File Aman dan File Rahasia

Aman dibagikan:

```text
src/
test/
README.md
package.json
package-lock.json
tsconfig.json
wrangler.jsonc
.dev.vars.example
```

Jangan dibagikan:

```text
.env
.dev.vars
.env.test-local
```

File tersebut dapat berisi `BOT_TOKEN` dan `WEBHOOK_SECRET`.

### Catatan Tugas Akhir

Penjelasan untuk bimbingan, black box testing, 150 data FAQ vs 209 test case, batasan pertanyaan random, maintenance pattern baru, dan jawaban singkat presentasi tersedia di [Catatan Penyusunan Tugas Akhir](docs/tugas-akhir.md).
