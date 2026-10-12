import AxeBuilder from "@axe-core/playwright";
import {
  KLANG,
  OFFICIAL_SHAH_ALAM,
  SHAH_ALAM,
  expect,
  fakeReading,
  seedLocation,
  test,
} from "./fixtures";

test.describe("aliran utama", () => {
  test("log ralat: terima laporan sah, tolak input rosak", async ({
    request,
  }) => {
    // Jangan cemari log production dengan laporan ujian.
    if (!process.env.E2E_BASE_URL) {
      const ok = await request.post("/api/log", {
        data: {
          kind: "error",
          message: "TypeError: ujian E2E",
          path: "/trend",
        },
      });
      expect(ok.status()).toBe(204);
    }
    expect(
      (await request.post("/api/log", { data: { message: "" } })).status(),
    ).toBe(400);
    expect(
      (
        await request.post("/api/log", {
          data: { message: "x".repeat(5000) },
        })
      ).status(),
    ).toBe(413);
    expect(
      (await request.get("/api/log/summary")).status(),
    ).toBeGreaterThanOrEqual(401);
  });

  test("penilaian ketepatan memerlukan rahsia", async ({ request }) => {
    const res = await request.get("/api/accuracy/run");
    expect([401, 503]).toContain(res.status());
  });

  test("pengumpul sejarah memerlukan rahsia", async ({ request }) => {
    const res = await request.get("/api/history/collect?back=0");
    expect([401, 503]).toContain(res.status());
  });

  test("pengguna baharu: pengenalan 3 skrin, pilih kawasan dan nampak IPU", async ({
    page,
  }) => {
    await page.goto("/");
    const onboarding = page.getByTestId("onboarding");
    await expect(
      page.getByRole("heading", { name: "Apa itu IPU?" }),
    ).toBeVisible();
    await expect(onboarding.getByText("101–200")).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Seterusnya" }).click();

    await expect(
      page.getByRole("heading", { name: "Di mana anda berada?" }),
    ).toBeFocused();
    // Seterusnya dilumpuhkan sehingga lokasi dipilih.
    await expect(
      page.getByRole("button", { name: "Seterusnya" }),
    ).toBeDisabled();
    await page.getByLabel("Cari kawasan atau negeri").fill("shah");
    await page.getByRole("button", { name: /Shah Alam/ }).click();

    await expect(
      page.getByRole("heading", { name: "Dapatkan amaran jerebu" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mula guna Hezy" }).click();

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

  test("pengenalan boleh dilangkau dan tidak dipaparkan semula", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Langkau" }).click();
    await expect(
      page.getByRole("heading", { name: "Selamat datang ke Hezy" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Selamat datang ke Hezy" }),
    ).toBeVisible();
    await expect(page.getByTestId("onboarding")).toHaveCount(0);
  });

  test("pengguna sedia ada (ada lokasi) tidak nampak pengenalan", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/");
    await expect(
      page.locator("h1[data-ipu-headline]").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByTestId("onboarding")).toHaveCount(0);
  });

  test("trend memaparkan masa terbaik untuk keluar", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/trend");
    await expect(page.getByText("MASA TERBAIK UNTUK KELUAR")).toBeVisible();
    await expect(page.getByText("8 – 10 malam")).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Graf IPU hari ini, jam demi jam" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ramalan 3 hari" }),
    ).toBeVisible();
    await expect(page.getByText("Esok")).toBeVisible();
  });

  test("graf trend boleh dileret dan dikawal dengan papan kekunci", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/trend");
    const chart = page.getByRole("slider", {
      name: "Graf IPU hari ini, jam demi jam",
    });
    // Lalai: jam semasa (10 pagi, anggaran model 156).
    await expect(chart).toHaveAttribute(
      "aria-valuetext",
      "10 pagi: IPU 156, Tidak Sihat · Anggaran model",
    );
    await expect(page.getByText("KINI", { exact: true })).toBeVisible();

    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(chart).toHaveAttribute(
      "aria-valuetext",
      "11 pagi: IPU 160, Tidak Sihat · Ramalan model",
    );
    await page.keyboard.press("End");
    await expect(chart).toHaveAttribute("aria-valuetext", /^11 malam: IPU 80/);

    // Fokus beralih → kembali ke jam semasa.
    await chart.blur();
    await expect(chart).toHaveAttribute("aria-valuetext", /^10 pagi/);

    // Tekan dan seret ke hujung kiri → tengah malam; lepas → kembali ke jam semasa.
    const box = (await chart.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 3, y, { steps: 5 });
    await expect(chart).toHaveAttribute(
      "aria-valuetext",
      /^12 tengah malam: IPU 70/,
    );
    await expect(page.getByText("JAM LAIN", { exact: true })).toBeVisible();
    await page.mouse.up();
    await expect(chart).toHaveAttribute("aria-valuetext", /^10 pagi/);
    await expect(page.getByText("KINI", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Kembali ke jam semasa" }),
    ).toHaveCount(0);
  });

  test("menambah dan membuang lokasi kegemaran", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Senarai" }).click();
    await page
      .getByRole("button", { name: "+ Tambah lokasi kegemaran" })
      .click();
    await page.getByLabel("Cari kawasan atau negeri").fill("kuching");
    await page.getByRole("button", { name: /Kuching/ }).click();

    await expect(page.getByText("KEGEMARAN (1/5)")).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Senarai" }).click();
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

test.describe("pengepala tetap", () => {
  test("kekal di atas semasa menatal dan memaparkan IPU ringkas", async ({
    page,
    isMobile,
  }) => {
    await seedLocation(page);
    // Skrin pendek supaya nombor IPU besar boleh ditatal keluar.
    await page.setViewportSize(
      isMobile ? { width: 412, height: 380 } : { width: 1280, height: 520 },
    );
    await page.goto("/");
    const header = page.getByTestId("home-header").filter({ visible: true });
    await expect(header).toHaveAttribute("data-compact", "false");
    await expect(
      page.getByRole("heading", { name: /^IPU 156/ }).filter({ visible: true }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(header).toHaveAttribute("data-compact", "true");
    const box = (await header.boundingBox())!;
    expect(box.y).toBeLessThanOrEqual(1);
    await expect(
      header.getByRole("button", { name: /Shah Alam — tukar lokasi/ }),
    ).toBeVisible();
  });
});

test.describe("kedudukan kad putih", () => {
  test("rehat: kandungan muat di atas navigasi; ditolak ke atas berhenti ~124 px", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Kad putih elastik untuk telefon");
    await seedLocation(page);
    await page.goto("/");
    const link = page.getByRole("link", { name: "Lihat trend jam demi jam" });
    await expect(link).toBeVisible();
    const card = page.getByTestId("elastic-card");
    const navTop = await page
      .locator("[data-bottom-nav]")
      .evaluate((el) => el.getBoundingClientRect().top);
    const linkBottom = await link.evaluate(
      (el) => el.getBoundingClientRect().bottom,
    );
    expect(linkBottom).toBeLessThanOrEqual(navTop);
    expect(navTop - linkBottom).toBeLessThan(40);

    await page.evaluate(() => window.scrollTo(0, 5000));
    await expect
      .poll(() => card.evaluate((el) => el.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(123);
    expect(
      await card.evaluate((el) => el.getBoundingClientRect().top),
    ).toBeLessThanOrEqual(126);
  });
});

test.describe("butang lihat trend", () => {
  test("kad graf mini membawa ke Trend (telefon)", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      !isMobile,
      "Kad Lihat trend untuk telefon; desktop ada graf penuh",
    );
    await seedLocation(page);
    await page.goto("/");
    const link = page.getByRole("link", { name: "Lihat trend jam demi jam" });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(/\/trend$/);
  });
});

test.describe("langit hidup", () => {
  test("Utama memaparkan langit WebGL (tiada menara KL)", async ({ page }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({
        json: {
          ...fakeReading(OFFICIAL_SHAH_ALAM),
          weather: {
            time: "2026-10-11T10:00",
            temperature: 31,
            code: 2,
            cloud: 40,
            visibilityKm: 6,
            isDay: true,
            precipitation: 0,
            sunrise: "2026-10-11T06:57",
            sunset: "2026-10-11T19:01",
          },
        },
      }),
    );
    await page.goto("/");
    const sky = page.getByTestId("sky").filter({ visible: true });
    await expect(sky).toHaveCount(1);
    // Satu konteks WebGL sahaja (telefon atau panorama desktop).
    await expect(page.getByTestId("sky")).toHaveCount(1);
    await expect(sky).toHaveClass(/opacity-100/);

    // Kad bacaan: label IPU, sumber, cuaca (jerebu diutamakan bila IPU > 100).
    await expect(
      page.getByText("Rasmi · APIMS").filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Cuaca: 31°, Berjerebu" }).filter({
        visible: true,
      }),
    ).toBeVisible();
  });
});

test.describe("pintasan dan lencana", () => {
  test("Lokasi: Peta dahulu (tab kiri), Senarai melalui #senarai", async ({
    page,
  }) => {
    await seedLocation(page, [SHAH_ALAM]);
    await page.goto("/lokasi");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveText(["Peta", "Senarai"]);
    await expect(page.getByRole("tab", { name: "Peta" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("region", { name: "Peta stesen APIMS" }),
    ).toBeVisible();

    await page.goto("/lokasi#senarai");
    await page.reload();
    await expect(page.getByRole("tab", { name: "Senarai" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Kegemaran yang sama dengan lokasi semasa ditanda "SEMASA".
    await expect(page.getByText("SEMASA", { exact: true })).toHaveCount(1);
  });

  test("menu lokasi: tukar ke kegemaran, Escape, dan Tambah bandar", async ({
    page,
  }) => {
    await seedLocation(page, [SHAH_ALAM, KLANG]);
    await page.goto("/");
    const chip = page
      .getByRole("button", { name: /Shah Alam — tukar lokasi/ })
      .first();
    await chip.click();
    const menu = page.getByRole("dialog", { name: "TUKAR LOKASI" });
    await expect(menu).toBeVisible();
    // Lokasi semasa ditanda; kegemaran yang sama tidak diulang.
    await expect(menu.getByRole("button", { name: /Shah Alam/ })).toHaveCount(
      1,
    );
    await expect(menu.getByRole("button", { name: /Shah Alam/ })).toBeFocused();
    const axe = await new AxeBuilder({ page })
      .include("[data-testid=location-menu]")
      .analyze();
    expect(axe.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(chip).toBeFocused();

    await chip.click();
    await menu.getByRole("button", { name: /Klang/ }).click();
    await expect(menu).toBeHidden();
    await expect(
      page.getByRole("button", { name: /Klang — tukar lokasi/ }).first(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Klang — tukar lokasi/ })
      .first()
      .click();
    await menu.getByRole("button", { name: "Tambah bandar" }).click();
    await expect(page).toHaveURL(/\/lokasi#tambah$/);
    await expect(page.getByRole("tab", { name: "Senarai" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("Trend: cip lokasi membuka menu yang sama", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/trend");
    await page
      .getByRole("button", { name: /Shah Alam — tukar lokasi/ })
      .click();
    const menu = page.getByRole("dialog", { name: "TUKAR LOKASI" });
    await expect(menu.getByText("Tiada lokasi kegemaran lagi.")).toBeVisible();
    await expect(
      menu.getByRole("button", { name: "Guna lokasi saya" }),
    ).toBeVisible();
  });

  test("lencana ikon menunjukkan IPU bila melebihi ambang", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const calls: (number | null)[] = [];
      (window as unknown as { badgeCalls: typeof calls }).badgeCalls = calls;
      Object.assign(navigator, {
        setAppBadge: async (n: number) => void calls.push(n),
        clearAppBadge: async () => void calls.push(null),
      });
    });
    await seedLocation(page);
    await page.goto("/");
    // Bacaan tiruan: IPU 156 > ambang lalai 100.
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { badgeCalls: unknown[] }).badgeCalls,
        ),
      )
      .toEqual([156]);
  });
});

test.describe("rutin amaran", () => {
  test("butang notifikasi ujian: dihantar, kemudian had kadar", async ({
    page,
  }) => {
    test.skip(
      !!process.env.E2E_BASE_URL,
      "Kunci VAPID ujian hanya dalam binaan tempatan",
    );
    await seedLocation(page);
    // Peranti sudah melanggan (langganan rekaan).
    await page.addInitScript(() => {
      const subscription = { endpoint: "https://push.example/hezy-ujian" };
      const registration = {
        pushManager: { getSubscription: async () => subscription },
      };
      Object.defineProperty(navigator.serviceWorker, "getRegistration", {
        value: async () => registration,
      });
    });
    const bodies: unknown[] = [];
    await page.route("**/api/push/test", async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill(
        bodies.length === 1
          ? { json: { ok: true } }
          : {
              status: 429,
              json: { error: "Tunggu", retryAfter: 42 },
            },
      );
    });
    await page.goto("/tetapan");
    const button = page.getByRole("button", {
      name: "Hantar notifikasi ujian",
    });
    await expect(button).toBeVisible();
    await button.click();
    await expect(
      page.getByText(
        "Dihantar. Notifikasi sepatutnya muncul dalam beberapa saat.",
      ),
    ).toBeVisible();
    expect(bodies[0]).toEqual({ endpoint: "https://push.example/hezy-ujian" });
    await button.click();
    await expect(
      page.getByText("Tunggu 42 saat sebelum menghantar lagi."),
    ).toBeVisible();
    // Status amaran tidak berubah.
    await expect(
      page.getByRole("switch", { name: /Amaran bila IPU/ }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("API notifikasi ujian menolak endpoint tidak sah", async ({
    request,
  }) => {
    const res = await request.post("/api/push/test", {
      data: { endpoint: "http://bukan-https.example" },
    });
    // 503 bila kunci VAPID peribadi tiada (binaan tempatan), 400 di production.
    expect([400, 503]).toContain(res.status());
  });

  test("ringkasan pagi, amaran ramalan dan waktu senyap disimpan", async ({
    page,
  }) => {
    test.skip(
      !!process.env.E2E_BASE_URL,
      "Kunci VAPID ujian hanya dalam binaan tempatan",
    );
    await seedLocation(page);
    await page.goto("/tetapan");
    const routine = page.getByRole("group", { name: "Rutin amaran" });
    await expect(routine).toBeVisible();
    const morning = routine.getByRole("checkbox", {
      name: /Ringkasan pagi \(7 pagi\)/,
    });
    const forecast = routine.getByRole("checkbox", {
      name: /Amaran ramalan esok \(8 malam\)/,
    });
    const quiet = routine.getByRole("checkbox", { name: /Waktu senyap/ });
    await expect(morning).not.toBeChecked();
    await expect(forecast).toBeChecked();
    await expect(quiet).toBeChecked();

    // Susun atur: setiap pilihan bermula di tepi kiri kumpulan, bertindan menegak.
    const group = (await routine.boundingBox())!;
    const boxes = await Promise.all(
      [morning, forecast, quiet].map(async (c) => (await c.boundingBox())!),
    );
    for (const b of boxes) expect(b.x - group.x).toBeLessThan(24);
    expect(boxes[0].y).toBeLessThan(boxes[1].y);
    expect(boxes[1].y).toBeLessThan(boxes[2].y);
    await routine.screenshot({
      path: test.info().outputPath("rutin-amaran.png"),
    });

    await morning.check();
    await routine
      .getByRole("combobox", { name: "Waktu senyap bermula" })
      .selectOption("22");
    await routine
      .getByRole("combobox", { name: "Waktu senyap tamat" })
      .selectOption("7");
    await page.reload();
    await expect(morning).toBeChecked();
    await expect(
      routine.getByRole("combobox", { name: "Waktu senyap bermula" }),
    ).toHaveValue("22");
    await expect(
      routine.getByRole("combobox", { name: "Waktu senyap tamat" }),
    ).toHaveValue("7");
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hezy:prefs:v1") ?? "{}"),
    );
    expect(saved).toMatchObject({
      morningSummary: true,
      forecastAlert: true,
      quietHours: { start: 22, end: 7 },
    });

    await quiet.uncheck();
    await expect(
      routine.getByRole("combobox", { name: "Waktu senyap bermula" }),
    ).toHaveCount(0);
  });
});

test.describe("arah angin", () => {
  test("Utama dan peta memaparkan angin dan asal jerebu", async ({ page }) => {
    const reading = {
      ...fakeReading(OFFICIAL_SHAH_ALAM),
      wind: {
        direction: 225,
        speed: 18,
        compass: "barat-daya",
        source: "sumatera",
        hotspots: 1234,
      },
    };
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: reading }),
    );
    await page.goto("/");
    await expect(
      page
        .getByText("Angin dari barat daya (arah Sumatera) · 18 km/j")
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByText("titik panas di hulu angin · 2 hari", { exact: false })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    await expect(
      page.getByText("Angin dari barat daya (arah Sumatera) · 18 km/j"),
    ).toBeVisible();
    const fires = page.getByRole("checkbox", { name: "Titik panas (3)" });
    await expect(fires).toBeChecked();
    await expect(page.locator(".leaflet-container canvas")).toHaveCount(1);
    await fires.uncheck();
    await expect(page.locator(".leaflet-container canvas")).toHaveCount(0);
  });
});

test.describe("kongsi imej kad", () => {
  test("helaian kongsi memaparkan pratonton dan memuat turun imej", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: fakeReading(OFFICIAL_SHAH_ALAM) }),
    );
    await page.goto("/");
    // Pelayar ujian tiada Web Share: kongsi fail jatuh ke muat turun.
    await page.evaluate(() => {
      Object.defineProperty(navigator, "canShare", { value: undefined });
    });
    await page
      .getByRole("button", { name: "Kongsi status" })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Kongsi IPU terkini" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("img")).toHaveJSProperty("complete", true);
    expect(
      await dialog
        .getByRole("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBe(1080);

    const axe = await new AxeBuilder({ page })
      .include("dialog[open]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);

    const share = dialog.getByRole("button", { name: "Untuk Status (9:16)" });
    await expect(share).toBeEnabled();
    const download = page.waitForEvent("download");
    await share.click();
    expect((await download).suggestedFilename()).toBe(
      "hezy-shah-alam-story.png",
    );
    await expect(
      dialog.getByText("Imej dimuat turun dan pautan disalin."),
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Salin pautan" }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(
      /IPU Shah Alam: 172 \(Tidak Sihat\).*\/kongsi\?n=Shah\+Alam/,
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("imej kad: dua format dan parameter tidak sah ditolak", async ({
    request,
  }) => {
    const base = "/kongsi/kad?n=Klang&i=146&s=apims&h=80,90,146&k=2&t=10:00";
    const square = await request.get(`${base}&f=square`);
    expect(square.status()).toBe(200);
    expect(square.headers()["content-type"]).toBe("image/png");
    const story = await request.get(`${base}&f=story`);
    expect(story.status()).toBe(200);
    expect((await story.body()).length).toBeGreaterThan(10_000);
    expect((await request.get("/kongsi/kad?n=Klang&i=abc")).status()).toBe(400);
  });
});

test.describe("muat semula", () => {
  /** Kira permintaan /api/aqi (menggantikan tiruan lalai). */
  async function countAqi(page: import("@playwright/test").Page) {
    const counter = { n: 0 };
    await page.route("**/api/aqi?**", (route) => {
      counter.n++;
      return route.fulfill({ json: fakeReading() });
    });
    return counter;
  }

  test("tarik ke bawah dan lepas memuat semula bacaan", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Gerak isyarat sentuh untuk telefon");
    await seedLocation(page);
    // Rekod getaran (Android) tanpa menggetarkan apa-apa.
    await page.addInitScript(() => {
      const w = window as unknown as { hezyVibrations: number };
      w.hezyVibrations = 0;
      navigator.vibrate = () => {
        w.hezyVibrations++;
        return true;
      };
    });
    const vibrations = () =>
      page.evaluate(
        () => (window as unknown as { hezyVibrations: number }).hezyVibrations,
      );
    const calls = await countAqi(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /^IPU \d+/ }).filter({ visible: true }),
    ).toBeVisible();
    expect(calls.n).toBe(1);

    const cdp = await page.context().newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", y?: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: y === undefined ? [] : [{ x: 200, y }],
      });
    await touch("touchStart", 120);
    for (let y = 140; y <= 320; y += 20) await touch("touchMove", y);
    await expect(page.getByTestId("pull-indicator")).toHaveAttribute(
      "data-state",
      "pulling",
    );
    // Kad putih turun dengan rintangan (dihadkan) sementara langit kekal di tempatnya.
    const offset = () =>
      page
        .getByTestId("elastic-card")
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    const pulled = await offset();
    expect(pulled).toBeGreaterThan(64);
    expect(pulled).toBeLessThanOrEqual(140);
    // Satu getaran ringan bila melepasi ambang, bukan setiap gerakan.
    expect(await vibrations()).toBe(1);
    await expect(page.getByTestId("sky")).toHaveCount(1);
    expect(
      await page
        .getByTestId("sky")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBe(0);
    await touch("touchEnd");
    await expect.poll(() => calls.n).toBe(2);
    await expect(page.getByTestId("pull-indicator")).toHaveAttribute(
      "data-state",
      "idle",
    );
    await expect.poll(offset).toBeCloseTo(0, 0);

    // Tarikan pendek tidak memuat semula.
    await touch("touchStart", 120);
    await touch("touchMove", 160);
    await touch("touchEnd");
    await page.waitForTimeout(300);
    expect(calls.n).toBe(2);
    expect(await vibrations()).toBe(1);
  });

  test("desktop: butang Muat semula dan pintasan R", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Butang muat semula untuk desktop");
    await seedLocation(page);
    const calls = await countAqi(page);
    await page.goto("/");
    const button = page.getByRole("button", { name: "Muat semula" });
    await expect(button).toBeVisible();
    await expect.poll(() => calls.n).toBe(1);
    await button.click();
    await expect.poll(() => calls.n).toBe(2);
    await expect(button).toBeEnabled();
    await page.keyboard.press("r");
    await expect.poll(() => calls.n).toBe(3);
  });
});

test.describe("susun dan leret kegemaran", () => {
  const order = (page: import("@playwright/test").Page) =>
    page
      .getByTestId("favourite-list")
      .locator(":scope > li")
      .evaluateAll((els) =>
        els.map((el) =>
          el
            .querySelector("button[aria-label^='Susun semula']")
            ?.getAttribute("aria-label")
            ?.split(",")[0]
            .replace("Susun semula ", ""),
        ),
      );

  test("papan kekunci: anak panah memindah kegemaran dan diumumkan", async ({
    page,
  }) => {
    await seedLocation(page, [SHAH_ALAM, KLANG]);
    await page.goto("/lokasi#senarai");
    await expect.poll(() => order(page)).toEqual(["Shah Alam", "Klang"]);
    const handle = page.getByRole("button", {
      name: /^Susun semula Shah Alam/,
    });
    await handle.focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => order(page)).toEqual(["Klang", "Shah Alam"]);
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Shah Alam dipindah ke kedudukan 2 daripada 2" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: /^Susun semula Shah Alam/ }),
    ).toBeFocused();
    // Kekal selepas muat semula.
    await page.reload();
    await expect.poll(() => order(page)).toEqual(["Klang", "Shah Alam"]);
  });

  test("seret pemegang untuk susun semula (tetikus)", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Seret tetikus untuk desktop");
    await seedLocation(page, [SHAH_ALAM, KLANG]);
    await page.goto("/lokasi#senarai");
    const handles = page.getByTestId("reorder-handle");
    await expect(handles).toHaveCount(2);
    const from = (await handles.nth(0).boundingBox())!;
    const to = (await handles.nth(1).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    await expect.poll(() => order(page)).toEqual(["Klang", "Shah Alam"]);
  });

  test("leret ke kiri untuk buang (sentuh)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Gerak isyarat sentuh untuk telefon");
    await seedLocation(page, [SHAH_ALAM, KLANG]);
    await page.goto("/lokasi#senarai");
    const row = page.getByTestId("swipe-row").nth(1);
    await expect(row).toContainText("Klang");
    const box = (await row.boundingBox())!;
    const y = box.y + box.height / 2;
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x?: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: x === undefined ? [] : [{ x, y }],
      });
    // Leretan pendek: kembali ke tempat asal.
    await touch("touchStart", box.x + box.width - 30);
    await touch("touchMove", box.x + box.width - 70);
    await touch("touchEnd");
    await expect(page.getByTestId("swipe-row")).toHaveCount(2);
    // Biar baris melantun semula dahulu (seperti jari pengguna diangkat).
    await page.waitForTimeout(300);
    // Leretan panjang: dibuang.
    await touch("touchStart", box.x + box.width - 20);
    for (let x = box.x + box.width - 40; x > box.x + 60; x -= 30)
      await touch("touchMove", x);
    await touch("touchEnd");
    await expect(page.getByTestId("swipe-row")).toHaveCount(1);
    await expect(page.getByTestId("swipe-row")).toContainText("Shah Alam");
  });
});

test.describe("navigasi", () => {
  test("ikon Phosphor terisi untuk halaman aktif sahaja", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/trend");
    const nav = page
      .getByRole("navigation", { name: "Navigasi utama" })
      .filter({ visible: true });
    const active = nav.getByRole("link", { name: "Trend" });
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(active.locator("svg")).toHaveAttribute("data-active", "true");
    await expect(nav.locator('svg[data-active="true"]')).toHaveCount(1);
    await nav.getByRole("link", { name: "Lokasi" }).click();
    await expect(
      nav.getByRole("link", { name: "Lokasi" }).locator("svg"),
    ).toHaveAttribute("data-active", "true");
    await expect(nav.locator('svg[data-active="true"]')).toHaveCount(1);
    await page.screenshot({ path: "test-results/navigasi.png" });
  });
});

test.describe("skrin pembuka iOS", () => {
  test("pautan apple-touch-startup-image untuk setiap saiz dan tema", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const links = page.locator('link[rel="apple-touch-startup-image"]');
    await expect(links).toHaveCount(32);
    const dark = page.locator(
      'link[rel="apple-touch-startup-image"][href="/splash/splash-1179x2556-dark.png"]',
    );
    await expect(dark).toHaveAttribute("media", /prefers-color-scheme: dark/);
    const res = await request.get("/splash/splash-1179x2556-dark.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("peralihan skrin", () => {
  test("tab memudar, masuk lebih dalam menggelongsor; bar navigasi kekal", async ({
    page,
  }) => {
    await seedLocation(page);
    // Rekod jenis peralihan yang diminta React kepada pelayar.
    await page.addInitScript(() => {
      const w = window as unknown as { hezyVt: string[][] };
      w.hezyVt = [];
      const original = document.startViewTransition?.bind(document);
      if (!original) return;
      document.startViewTransition = ((arg: unknown) => {
        const types =
          arg && typeof arg === "object" && "types" in arg
            ? [...((arg as { types: Iterable<string> }).types ?? [])]
            : [];
        w.hezyVt.push(types);
        return original(arg as never);
      }) as typeof document.startViewTransition;
    });
    const types = () =>
      page.evaluate(() => (window as unknown as { hezyVt: string[][] }).hezyVt);
    await page.goto("/tetapan");
    const nav = page
      .getByRole("navigation", { name: "Navigasi utama" })
      .filter({ visible: true });
    await nav.getByRole("link", { name: "Lokasi" }).click();
    await expect(page).toHaveURL(/\/lokasi$/);
    await expect.poll(types).toContainEqual(["nav-tab"]);
    await page.getByRole("link", { name: /IPU mengikut negeri/ }).click();
    await expect(page).toHaveURL(/\/negeri$/);
    await expect.poll(types).toContainEqual(["nav-forward"]);
    await page
      .getByRole("navigation", { name: "Laluan" })
      .getByRole("link", { name: "Lokasi" })
      .click();
    await expect(page).toHaveURL(/\/lokasi$/);
    await expect.poll(types).toContainEqual(["nav-back"]);
    expect(
      await page
        .locator("[data-bottom-nav]")
        .evaluate((el) => getComputedStyle(el).viewTransitionName),
    ).toBe("bottom-nav");
  });
});

test.describe("rangka muat", () => {
  test("Utama memaparkan rangka bentuk baharu semasa bacaan dimuat", async ({
    page,
    isMobile,
  }) => {
    await seedLocation(page);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route("**/api/aqi?**", async (route) => {
      await gate;
      await route.fulfill({ json: fakeReading() });
    });
    await page.goto("/");
    const skeleton = page
      .getByTestId("headline-skeleton")
      .filter({ visible: true });
    await expect(skeleton).toBeVisible();
    if (isMobile) {
      await expect(page.getByTestId("trend-link-skeleton")).toBeVisible();
      await page.screenshot({ path: "test-results/rangka-telefon.png" });
    }
    release();
    await expect(skeleton).toBeHidden();
    await expect(
      page.locator("h1[data-ipu-headline]").filter({ visible: true }),
    ).toHaveText("156");
    await expect(page.getByTestId("trend-link-skeleton")).toHaveCount(0);
  });
});

test.describe("nombor IPU beranimasi", () => {
  test("dikira dari nilai lama ke nilai baharu bila bacaan berubah", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Muat semula melalui pintasan R (desktop)");
    await seedLocation(page);
    let n = 0;
    await page.route("**/api/aqi?**", (route) => {
      n++;
      const reading = fakeReading();
      if (n > 1)
        reading.current = {
          ...reading.current,
          ipu: 60,
          category: "sederhana",
          label: "Sederhana",
        };
      return route.fulfill({ json: reading });
    });
    await page.goto("/");
    const headline = page
      .locator("h1[data-ipu-headline]")
      .filter({ visible: true });
    // Paparan pertama: terus nilai sebenar, tiada kiraan dari 0.
    await expect(headline).toHaveText("156");
    await expect(
      page.getByRole("button", { name: "Muat semula" }),
    ).toBeEnabled();
    const seen = new Set<string>();
    await page.exposeFunction("hezySeen", (v: string) => seen.add(v));
    await headline.evaluate((el) => {
      new MutationObserver(() =>
        (window as unknown as { hezySeen: (v: string) => void }).hezySeen(
          el.textContent ?? "",
        ),
      ).observe(el, { subtree: true, characterData: true, childList: true });
    });
    await page.keyboard.press("r");
    await expect(headline).toHaveText("60");
    await expect(headline).toHaveAttribute("aria-label", /IPU 60/);
    // Nilai pertengahan dipaparkan semasa kiraan.
    expect([...seen].some((v) => +v > 60 && +v < 156)).toBe(true);
  });

  test("prefers-reduced-motion: terus ke nilai baharu", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Muat semula melalui pintasan R (desktop)");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedLocation(page);
    let n = 0;
    await page.route("**/api/aqi?**", (route) => {
      n++;
      const reading = fakeReading();
      if (n > 1)
        reading.current = {
          ...reading.current,
          ipu: 60,
          category: "sederhana",
          label: "Sederhana",
        };
      return route.fulfill({ json: reading });
    });
    await page.goto("/");
    const headline = page
      .locator("h1[data-ipu-headline]")
      .filter({ visible: true });
    await expect(headline).toHaveText("156");
    await expect(
      page.getByRole("button", { name: "Muat semula" }),
    ).toBeEnabled();
    const seen = new Set<string>();
    await page.exposeFunction("hezySeen", (v: string) => seen.add(v));
    await headline.evaluate((el) => {
      new MutationObserver(() =>
        (window as unknown as { hezySeen: (v: string) => void }).hezySeen(
          el.textContent ?? "",
        ),
      ).observe(el, { subtree: true, characterData: true, childList: true });
    });
    await page.keyboard.press("r");
    await expect(headline).toHaveText("60");
    expect([...seen].filter((v) => v !== "60")).toEqual([]);
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
        .getByText("Stesen Shah Alam · 5.6 km", { exact: false })
        .filter({ visible: true }),
    ).toBeVisible();
    // Butiran di sebalik ⓘ: sumber penuh, pencemar dan anggaran model.
    const info = page
      .getByRole("button", { name: "Butiran sumber bacaan" })
      .filter({ visible: true });
    await expect(info).toHaveAttribute("aria-expanded", "false");
    await info.click();
    await expect(info).toHaveAttribute("aria-expanded", "true");
    const details = page.locator(
      `[id="${await info.getAttribute("aria-controls")}"]`,
    );
    await expect(details).toContainText(
      "IPU rasmi APIMS (Jabatan Alam Sekitar)",
    );
    await expect(details).toContainText("PM2.5");
    await expect(details).toContainText("Anggaran model156");
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
        .getByRole("button", { name: /Klang — tukar lokasi/ })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("pin dihimpunkan bila dizum keluar; klik himpunan menzum masuk", async ({
    page,
  }) => {
    // Tanpa lokasi semasa: peta bermula pada zum 5 (seluruh Malaysia).
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    // Zum 5: ketiga-tiga stesen satu himpunan, berwarna ikut IPU terburuk.
    const all = page.locator('[title="3 stesen, IPU tertinggi 146"]');
    await expect(all).toBeVisible();
    await expect(page.locator('[title="Klang, IPU 146"]')).toHaveCount(0);
    await all.click();
    // Dizum masuk ke kawasan himpunan: setiap stesen kini pin sendiri.
    await expect(page.locator('[title="Seri Manjung, IPU N/A"]')).toBeVisible();
    await expect(page.locator('[title="Klang, IPU 146"]')).toBeVisible();
    await expect(page.locator('[title^="3 stesen"]')).toHaveCount(0);
    await expect(page.locator('[title="Shah Alam, IPU 72"]')).toBeVisible();
  });

  test("kad stesen sebagai helaian di atas peta; Tutup dan Escape", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    const pin = page.locator('[title="Klang, IPU 146"]');
    await pin.click();
    const sheet = page.getByTestId("map-sheet");
    await expect(sheet.getByRole("heading", { name: "Klang" })).toBeVisible();
    // Helaian berada di dalam kawasan peta (bukan di bawahnya).
    const mapBox = (await page
      .getByRole("region", { name: "Peta stesen APIMS" })
      .boundingBox())!;
    // Tunggu animasi naik selesai sebelum mengukur.
    await expect
      .poll(async () => {
        const box = (await sheet.boundingBox())!;
        return box.y + box.height;
      })
      .toBeLessThanOrEqual(mapBox.y + mapBox.height + 1);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await pin.click();
    await page.getByRole("button", { name: "Tutup" }).click();
    await expect(sheet).toHaveCount(0);
  });

  test("lapisan sensor tambahan WAQI tanpa pendua APIMS", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("tab", { name: "Peta" }).click();
    const toggle = page.getByRole("checkbox", { name: "Sensor (1)" });
    await expect(toggle).toBeChecked();
    const pin = page.locator('[title="Jalan Anggun 3P, AQI 88"]');
    await expect(pin).toBeVisible();
    await expect(page.locator('[title^="Klang, Selangor"]')).toHaveCount(0);

    // Sensor ini ~5 km dari stesen Shah Alam (pin rasmi di atas): zum masuk dahulu.
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await pin.click();
    await expect(
      page.getByRole("heading", { name: "Jalan Anggun 3P" }),
    ).toBeVisible();
    await expect(
      page.getByText("Sensor tambahan WAQI · skala AQI AS"),
    ).toBeVisible();

    await toggle.uncheck();
    await expect(pin).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Jalan Anggun 3P" }),
    ).toHaveCount(0);
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
      page.getByRole("slider", { name: "Graf IPU hari ini, jam demi jam" }),
    ).toHaveAccessibleDescription(/Tertinggi 172/);
  });

  test("ramalan yang dibetulkan dilabel dengan jelas", async ({ page }) => {
    const reading = fakeReading(OFFICIAL_SHAH_ALAM) as ReturnType<
      typeof fakeReading
    > & { correction: unknown };
    reading.correction = {
      offsetPm25: 80.3,
      matchedHours: 6,
      anchorTime: "2026-10-11T10:00",
      anchorIpu: 172,
    };
    reading.today = reading.today.map((h) =>
      h.forecast ? { ...h, corrected: true } : h,
    );
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: reading }),
    );
    await page.goto("/trend");
    await expect(
      page.getByText("Jam akan datang: ramalan dibetulkan dengan APIMS"),
    ).toBeVisible();
    await expect(
      page.getByText(/dibetulkan dengan bacaan itu: \+80/),
    ).toBeVisible();
    const chart = page.getByRole("slider", {
      name: "Graf IPU hari ini, jam demi jam",
    });
    await chart.focus();
    await page.keyboard.press("End");
    await expect(chart).toHaveAttribute(
      "aria-valuetext",
      /· Ramalan dibetulkan$/,
    );
  });

  test("heatmap sejarah 12 minggu dengan legenda APIMS", async ({ page }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: fakeReading(OFFICIAL_SHAH_ALAM) }),
    );
    await page.goto("/trend");
    await expect(
      page.getByRole("heading", { name: "Sejarah 12 minggu" }),
    ).toBeVisible();
    const grid = page.getByRole("group", {
      name: "Heatmap IPU harian, 12 minggu",
    });
    await expect(grid.getByRole("button")).toHaveCount(84);
    // Lalai: hari ini.
    const today = grid.getByRole("button", { name: /^Isn 12 Okt/ });
    await expect(today).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Isn 12 Okt (setakat ini)")).toBeVisible();
    await expect(page.getByText("Purata 133 · 13 jam data")).toBeVisible();

    await grid
      .getByRole("button", { name: "Jum 9 Okt: maks 99, Sederhana" })
      .click();
    await expect(page.getByText("Purata 79 · 24 jam data")).toBeVisible();

    // Papan kekunci: anak panah ke atas = hari sebelumnya.
    await page.keyboard.press("ArrowUp");
    await expect(
      grid.getByRole("button", { name: /^Kha 8 Okt/ }),
    ).toBeFocused();

    await expect(
      page.getByRole("list", { name: "Petunjuk warna (kategori IPU APIMS)" }),
    ).toContainText("Sangat Tidak Sihat 201–300");
    await expect(
      page.getByText("Data dikumpul sejak Sel 6 Okt (7 hari)."),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("#sejarah-ipu")
      .include('[aria-labelledby="sejarah-ipu"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("ketepatan ±N dipaparkan di Utama, graf dan Tetapan", async ({
    page,
  }) => {
    const reading = {
      ...fakeReading(),
      accuracy: {
        estimate: 24,
        forecast: 19,
        forecastRaw: 50,
        days: 4,
        scope: "station",
      },
    };
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: reading }),
    );
    await page.goto("/");
    await page
      .getByRole("button", { name: "Butiran sumber bacaan" })
      .filter({ visible: true })
      .click();
    await expect(
      page
        .getByText(/biasanya ±24 berbanding bacaan rasmi/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await page.goto("/trend");
    await expect(
      page.getByText(/ramalan model \(biasanya ±19\)/),
    ).toBeVisible();
    await page.goto("/tetapan");
    await expect(page.getByText("±22 IPU", { exact: true })).toBeVisible();
    await expect(
      page.getByText("±18 IPU (model asal ±47)", { exact: true }),
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

test.describe("Bahasa Inggeris", () => {
  test("bahasa boleh ditukar ke English dan kekal selepas muat semula", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.route("**/api/aqi?**", (route) =>
      route.fulfill({ json: fakeReading(OFFICIAL_SHAH_ALAM) }),
    );
    await page.goto("/tetapan");
    await page.getByText("English", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: "API 172, Unhealthy" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("Avoid exercising outdoors today.")
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .filter({ visible: true })
        .getByRole("link", { name: "Trend" }),
    ).toBeVisible();

    await page.goto("/trend");
    await expect(page.getByText("Today, hour by hour")).toBeVisible();

    await page.goto("/tetapan");
    await page.getByText("Bahasa Melayu", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tetapan" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ms");
  });
});

test.describe("pasang di iPhone", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("Utama memaparkan banner pasang yang boleh ditutup", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/");
    const banner = page
      .getByRole("region", { name: "Pasang Hezy di skrin utama" })
      .filter({ visible: true });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Cara pasang" }).click();
    await expect(banner.getByText("Tatal ke bawah dan pilih")).toBeVisible();
    await banner.getByRole("button", { name: "Tutup banner pasang" }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /^IPU \d+/ }).filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Pasang Hezy di skrin utama" }),
    ).toHaveCount(0);
  });

  test("Tetapan memaparkan panduan langkah demi langkah", async ({ page }) => {
    await page.goto("/tetapan");
    const button = page.getByRole("button", { name: "Cara pasang" });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText("Tatal ke bawah dan pilih")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tutup panduan" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("privasi", () => {
  test("halaman Privasi dari Tetapan, tanpa pelanggaran axe", async ({
    page,
  }) => {
    await seedLocation(page);
    await page.goto("/tetapan");
    await page.getByRole("link", { name: "Privasi dan data anda" }).click();
    await expect(page).toHaveURL(/\/privasi$/);
    await expect(
      page.getByRole("heading", { name: "Privasi dan data anda" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Log ralat" }),
    ).toBeVisible();
    // Tajuk dokumen dikemas kini selepas peralihan skrin selesai.
    await expect(page).toHaveTitle(/Privasi/);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe("halaman negeri dan kongsi dalam English", () => {
  test("ikut bahasa pengguna selepas hidrasi", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "hezy:prefs:v1",
        JSON.stringify({ lang: "en", theme: "system", profile: "umum" }),
      ),
    );
    await page.goto("/negeri");
    await expect(
      page.getByRole("heading", { name: "API by state", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("FEDERAL TERRITORIES")).toBeVisible();
    await page.goto("/negeri/selangor");
    await expect(
      page.getByRole("heading", { name: "Selangor API today" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "All states" })).toBeVisible();
    await page.goto("/kongsi?n=Klang&i=146&s=apims");
    await expect(
      page.getByRole("heading", { name: "Shared haze status" }),
    ).toBeVisible();
    await expect(page.getByText("Unhealthy", { exact: true })).toBeVisible();
  });
});

test.describe("halaman negeri", () => {
  test("indeks menyenaraikan 16 negeri dan wilayah", async ({ page }) => {
    await page.goto("/negeri");
    await expect(
      page.getByRole("heading", { name: "IPU mengikut negeri" }),
    ).toBeVisible();
    await expect(page.locator('a[href^="/negeri/"]')).toHaveCount(16);
    // Susunan ikut peta: Perlis di atas, Johor, kemudian Sarawak dan Sabah; wilayah berasingan.
    const negeri = page.getByRole("region", { name: "NEGERI" });
    const names = await negeri
      .locator('a[href^="/negeri/"] [data-name]')
      .allTextContents();
    expect(names).toEqual([
      "Perlis",
      "Kedah",
      "Kelantan",
      "Pulau Pinang",
      "Terengganu",
      "Perak",
      "Pahang",
      "Selangor",
      "Negeri Sembilan",
      "Melaka",
      "Johor",
      "Sarawak",
      "Sabah",
    ]);
    await expect(
      page
        .getByRole("region", { name: "WILAYAH PERSEKUTUAN" })
        .locator('a[href^="/negeri/"]'),
    ).toHaveCount(3);
  });

  test("Lokasi mempunyai butang ke IPU mengikut negeri", async ({ page }) => {
    await seedLocation(page);
    await page.goto("/lokasi");
    await page.getByRole("link", { name: /IPU mengikut negeri/ }).click();
    await expect(page).toHaveURL(/\/negeri$/);
    await page.getByRole("link", { name: /^Selangor/ }).click();
    await expect(page).toHaveURL(/\/negeri\/selangor$/);
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
    expect(xml).toContain("https://hezy.my/negeri/selangor");
    expect(xml).toContain("https://hezy.my/negeri/labuan");
  });
});

test.describe("bandingkan lokasi", () => {
  test("desktop membandingkan lokasi semasa dan kegemaran", async ({
    page,
    isMobile,
  }) => {
    await seedLocation(page, [KLANG]);
    await page.goto("/trend");
    if (isMobile) {
      await expect(
        page.getByRole("heading", { name: "Ramalan 3 hari" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Bandingkan lokasi" }),
      ).toHaveCount(0);
      return;
    }
    await expect(
      page.getByRole("heading", { name: "Bandingkan lokasi" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Shah Alam", pressed: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Klang", pressed: true }),
    ).toBeVisible();
    const compare = page.getByRole("slider", {
      name: "Graf perbandingan IPU hari ini",
    });
    await expect(compare).toBeVisible();
    await expect(compare).toHaveAttribute("aria-valuetext", "10 pagi");
    await compare.focus();
    await page.keyboard.press("ArrowRight");
    await expect(compare).toHaveAttribute("aria-valuetext", "11 pagi");
    await page.getByRole("button", { name: "Klang", pressed: true }).click();
    await expect(
      page.getByRole("button", { name: "Klang", pressed: false }),
    ).toBeVisible();
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
    expect(manifest.shortcuts.map((x: { url: string }) => x.url)).toEqual([
      "/trend",
      "/lokasi",
      "/tetapan",
    ]);
    for (const shortcut of manifest.shortcuts) {
      const icon = await request.get(shortcut.icons[0].src);
      expect(icon.headers()["content-type"]).toBe("image/png");
    }
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
