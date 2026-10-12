import AxeBuilder from "@axe-core/playwright";
import {
  OFFICIAL_SHAH_ALAM,
  expect,
  fakeReading,
  seedLocation,
  test,
} from "./fixtures";

test.describe("aliran utama", () => {
  test("pengguna baharu memilih kawasan dan nampak IPU", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Selamat datang ke Hezy" }),
    ).toBeVisible();

    await page.getByLabel("Cari kawasan atau negeri").fill("shah");
    await page.getByRole("button", { name: /Shah Alam/ }).click();

    await expect(
      page.getByRole("heading", { name: "IPU 156, Tidak Sihat" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Elak bersenam di luar hari ini.")
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Naik 12 dalam 3 jam").filter({ visible: true }),
    ).toBeVisible();
  });

  test("trend memaparkan masa terbaik untuk keluar", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/trend");
    await expect(page.getByText("MASA TERBAIK UNTUK KELUAR")).toBeVisible();
    await expect(page.getByText("8 – 10 malam")).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Graf IPU hari ini/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ramalan 3 hari" }),
    ).toBeVisible();
    await expect(page.getByText("Esok")).toBeVisible();
  });

  test("menambah dan membuang lokasi kegemaran", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page
      .getByRole("button", { name: "+ Tambah lokasi kegemaran" })
      .click();
    await page.getByLabel("Cari kawasan atau negeri").fill("kuching");
    await page.getByRole("button", { name: /Kuching/ }).click();

    await expect(page.getByText("KEGEMARAN (1/5)")).toBeVisible();
    await page.reload();
    await expect(page.getByText("KEGEMARAN (1/5)")).toBeVisible();

    await page
      .getByRole("button", { name: "Buang Kuching daripada kegemaran" })
      .click();
    await expect(page.getByText("KEGEMARAN (0/5)")).toBeVisible();
  });

  test("profil kesihatan mengubah nasihat", async ({ page, isMobile }) => {
    test.skip(isMobile, "Kad nasihat penuh hanya pada desktop");
    await seedLocation(page);
    await page.goto("/tetapan");
    await page.getByLabel("Asma / paru-paru").check();
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Nasihat · Asma / paru-paru" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Hadkan aktiviti luar dan sentiasa bawa inhaler")
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("tema gelap kekal selepas muat semula tanpa kelipan", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/tetapan");
    await page.getByText("Gelap", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("ralat API dipaparkan dengan butang cuba lagi", async ({ page }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({
        status: 502,
        json: {
          error: "Data kualiti udara tidak dapat diambil. Cuba lagi sebentar.",
        },
      }),
    );
    await page.goto("/trend");
    await expect(
      page.getByText("Data kualiti udara tidak dapat diambil.", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cuba lagi" })).toBeVisible();
  });
});

test.describe("bacaan rasmi APIMS", () => {
  test("IPU rasmi stesen terdekat diutamakan berbanding anggaran", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: fakeReading(OFFICIAL_SHAH_ALAM) }),
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "IPU 172, Tidak Sihat" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Rasmi APIMS · Stesen Shah Alam (5.6 km)", { exact: false })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Anggaran model: 156", { exact: false })
        .filter({ visible: true }),
    ).toBeVisible();
  });
});

test.describe("peta stesen", () => {
  test("memaparkan stesen APIMS dan memilih stesen sebagai lokasi semasa", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    await expect(
      page.getByRole("region", { name: "Peta stesen APIMS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "STESEN TERDEKAT" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Klang.*146/ }).click();
    await expect(page.getByRole("heading", { name: "Klang" })).toBeVisible();
    await page.getByRole("button", { name: "Jadikan lokasi semasa" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page
        .getByRole("link", { name: /Klang/ })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("tiada pelanggaran kebolehcapaian pada tab Peta", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    await expect(
      page.getByRole("heading", { name: "STESEN TERDEKAT" }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      ),
    ).toEqual([]);
  });
});

test.describe("trend rasmi APIMS", () => {
  test("jam lepas menggunakan bacaan rasmi, jam akan datang ramalan", async ({
    page,
  }) => {
    await seedLocation(page);
    const reading = fakeReading(OFFICIAL_SHAH_ALAM);
    reading.today = reading.today.map((h) =>
      h.forecast ? h : { ...h, officialIpu: 172 },
    );
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: reading }),
    );
    await page.goto("/trend");
    await expect(page.getByText("Jam lepas: bacaan rasmi APIMS")).toBeVisible();
    await expect(
      page.getByText("Jam akan datang: ramalan model"),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Tertinggi 172/ }),
    ).toBeVisible();
  });

  test("kembali ke anggaran model bila tiada sejarah rasmi", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/trend");
    await expect(page.getByText("Jam lepas: anggaran model")).toBeVisible();
  });
});

test.describe("status sekolah", () => {
  test.beforeEach(async ({ page }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: fakeReading(OFFICIAL_SHAH_ALAM) }),
    );
  });

  test("dipaparkan untuk profil Kanak-kanak ikut panduan KPM", async ({
    page,
  }) => {
    await page.goto("/tetapan");
    await page.getByRole("radio", { name: "Kanak-kanak" }).check();
    await page.goto("/");
    const card = page
      .getByRole("region", { name: "Aktiviti luar dihentikan" })
      .filter({ visible: true });
    await expect(card).toBeVisible();
    await expect(card).toContainText("IPU rasmi 172");
    await page.goto("/trend");
    await expect(
      page.getByRole("heading", { name: "Aktiviti luar dihentikan" }),
    ).toBeVisible();
  });

  test("tersembunyi untuk profil Umum kecuali dipilih di Tetapan", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "IPU 172, Tidak Sihat" }),
    ).toBeVisible();
    await expect(page.getByText("STATUS SEKOLAH")).toHaveCount(0);

    await page.goto("/tetapan");
    await page.getByLabel(/Papar status sekolah/).check();
    await page.goto("/");
    await expect(
      page.getByText("STATUS SEKOLAH").filter({ visible: true }),
    ).toBeVisible();
  });
});

test.describe("halaman negeri", () => {
  test("indeks menyenaraikan 16 negeri dan wilayah", async ({ page }) => {
    await page.goto("/negeri");
    await expect(
      page.getByRole("heading", { name: "IPU mengikut negeri" }),
    ).toBeVisible();
    await expect(page.locator('a[href^="/negeri/"]')).toHaveCount(16);
  });

  test("halaman Selangor memaparkan jadual stesen atau notis", async ({
    page,
  }) => {
    await page.goto("/negeri/selangor");
    await expect(page).toHaveTitle("IPU Selangor hari ini · Hezy");
    await expect(
      page.getByRole("heading", { name: "IPU Selangor hari ini" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("table", { name: "IPU rasmi stesen APIMS di Selangor" })
        .or(page.getByText("Data APIMS tidak dapat diambil", { exact: false })),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("sitemap merangkumi halaman negeri", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("https://hezy.vercel.app/negeri/selangor");
    expect(xml).toContain("https://hezy.vercel.app/negeri/labuan");
  });
});

test.describe("API", () => {
  test("kongsi: halaman mempunyai kad Open Graph dan imej PNG", async ({
    page,
    request,
  }) => {
    await page.goto("/kongsi?n=Shah%20Alam&i=172&s=apims");
    await expect(
      page.getByRole("heading", { name: "Status jerebu yang dikongsi" }),
    ).toBeVisible();
    await expect(
      page.getByText("IPU rasmi APIMS (JAS)", { exact: false }),
    ).toBeVisible();
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/kongsi/og?n=Shah+Alam&i=172&s=apims");
    await expect(page).toHaveTitle("IPU Shah Alam: 172 (Tidak Sihat) · Hezy");

    const image = await request.get("/kongsi/og?n=Shah%20Alam&i=172&s=apims");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
  });

  test("kongsi: pautan tidak sah tidak memaparkan kandungan sewenang-wenangnya", async ({
    page,
  }) => {
    await page.goto("/kongsi?n=%3Cscript%3E&i=9999");
    await expect(page.getByText("Pautan kongsi ini tidak sah.")).toBeVisible();
  });

  test("push: menolak langganan tidak sah", async ({ request }) => {
    const res = await request.post("/api/push/subscribe", {
      data: {
        subscription: { endpoint: "http://bukan-https" },
        lat: 3.07,
        lon: 101.52,
      },
    });
    expect(res.status()).toBe(400);
    const bad = await request.post("/api/push/unsubscribe", {
      data: { endpoint: 42 },
    });
    expect(bad.status()).toBe(400);
  });

  test("push: semakan berkala memerlukan rahsia", async ({ request }) => {
    const res = await request.get("/api/push/check");
    // 401 bila CRON_SECRET dikonfigurasi, 503 bila belum (cth. dalam CI).
    expect([401, 503]).toContain(res.status());
  });

  test("menolak koordinat di luar Malaysia", async ({ request }) => {
    const res = await request.get("/api/aqi?lat=13.75&lon=100.5");
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({
      error: "Lokasi berada di luar Malaysia.",
    });
  });

  test("manifest PWA sah", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({
      short_name: "Hezy",
      display: "standalone",
      start_url: "/",
    });
    expect(
      manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable"),
    ).toBe(true);
  });
});

test.describe("luar talian", () => {
  test.use({ serviceWorkers: "allow" });

  test("aplikasi dibuka semula tanpa internet dengan bacaan tersimpan", async ({
    page,
    context,
  }) => {
    await seedLocation(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^IPU \d+/ })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener("controllerchange", resolve),
        );
      }
    });

    await context.setOffline(true);
    await expect(
      page.getByText("Luar talian · Memaparkan bacaan terakhir yang disimpan"),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: /^IPU \d+/ })).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe("kebolehcapaian (axe, WCAG 2.1 AA)", () => {
  for (const path of ["/", "/trend", "/lokasi", "/tetapan"]) {
    test(`tiada pelanggaran pada ${path}`, async ({ page }) => {
      await seedLocation(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      expect(summary).toEqual([]);
    });
  }
});

test.describe("kebolehcapaian mod gelap", () => {
  test.use({ colorScheme: "dark" });

  for (const path of ["/", "/trend", "/lokasi", "/tetapan"]) {
    test(`tiada pelanggaran pada ${path}`, async ({ page }) => {
      await seedLocation(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      expect(summary).toEqual([]);
    });
  }
});
