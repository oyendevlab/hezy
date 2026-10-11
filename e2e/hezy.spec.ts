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
      page.getByRole("img", { name: /Graf IPU sejam hari ini/ }),
    ).toBeVisible();
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

test.describe("API", () => {
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
