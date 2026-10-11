# Hezy

PWA untuk menyemak Indeks Pencemar Udara (IPU) di Malaysia dengan pantas.

- Production: https://hezy.vercel.app
- Keperluan produk: [docs/PRD.md](docs/PRD.md)
- Senarai task: [docs/TASKS.md](docs/TASKS.md)

## Pembangunan

Perlukan Node.js 22 ke atas.

```bash
npm install
npm run dev
```

| Skrip               | Fungsi                                       |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Pelayan pembangunan di http://localhost:3000 |
| `npm run build`     | Build production                             |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | Jana jenis laluan dan semak TypeScript       |
| `npm test`          | Ujian unit (Vitest)                          |
| `npm run format`    | Format kod dengan Prettier                   |

## Aliran kerja

Buat cabang `feat/*`, buka PR ke `main`. Vercel akan menghasilkan preview untuk setiap PR, dan gabungan ke `main` akan deploy ke production.
