[English](README.md) · **Polski**

# Alfa

![Alfa: odtwarzacz Raspberry Pi i nauka polskiego alfabetu bez sieci](.github/social-preview.png)

[![CI](https://github.com/hvitis/Alfa/actions/workflows/ci.yml/badge.svg)](https://github.com/hvitis/Alfa/actions/workflows/ci.yml)
[![Licencja kodu: MIT](https://img.shields.io/badge/code-MIT-green)](LICENSE)

Odtwarzacz Raspberry Pi z małym ekranem, pięcioma przyciskami i lekcjami polskich liter. Działa bez sieci.

[Prezentacja w przeglądarce](https://hvitis.github.io/Alfa/) · [Najnowszy pakiet](https://github.com/hvitis/Alfa/releases/latest) · [Instrukcja sprzętu](docs/HARDWARE-GUIDE.md)

Prezentacja i pakiet będą dostępne po pierwszym wdrożeniu i wydaniu z tagiem.
Oryginalny kod i dokumentacja techniczna mają licencję MIT. Grafiki postaci i nagrania wymagają osobnego przeglądu praw przed upublicznieniem repozytorium.
Zobacz [informacje o zasobach](THIRD_PARTY_NOTICES.md) i [listę czynności przed publikacją](docs/PUBLISHING.md).

## Galeria

| Interaktywna prezentacja |
| --- |
| ![Prezentacja z zakładkami projektu](docs/images/showcase.png) |

Folder [CAD](design/) zawiera osobne projekty obudów i instrukcje ich budowania.

## Specyfikacja

<!-- specifications:start -->
| Specification | Value |
| --- | --- |
| Code and documentation license | MIT |
| Runtime | Python 3.11+ |
| Validation toolchain | Python 3.12, Node.js 22, Chromium |
| Active controller | Raspberry Pi 3, Raspberry Pi OS Bookworm or newer |
| Display | ST7789, 240 × 320, SPI |
| Audio | MAX98357A, I²S, 48 kHz stereo PCM |
| Button input | Five-button keypad, ADS1115 or ADS1015, I²C |
| Divider | 2 × 10 kΩ |
| Backlight | BCM GPIO24 |
| Polish alphabet | 32 letters |
| Initial volume / cap | 20% / 50% |
| Static showcase | HTML, CSS, JavaScript; no backend |
<!-- specifications:end -->

Tabela używa tych samych nazw co wersja angielska, aby automatycznie wykrywać różnice między dokumentami.

## Funkcje

- <!-- feature:offline-player --> **Odtwarzacz bez sieci:** Pięć przycisków służy do zmiany obrazów, odtwarzania nagrań i regulacji głośności.
- <!-- feature:letter-lessons --> **Nauka liter:** Animacja rysuje 32 polskie litery, kreska po kresce. Istniejące grafiki postaci mają osobne informacje o prawach.
- <!-- feature:hardware-simulation --> **Symulacja sprzętu:** Komputer zapisuje podgląd ekranu bez urządzeń GPIO, SPI i I²C.
- <!-- feature:static-showcase --> **Prezentacja statyczna:** Zakładki Plywood, 3DPrint, Hardware i Software zawierają modele 3D, połączenia kontrolerów, ADR i diagram Mermaid.
- <!-- feature:verified-distribution --> **Sprawdzany pakiet:** Pakiet zawiera neutralny obraz demonstracyjny, sumy kontrolne, raporty walidacji i zestawienie elektroniki.
- <!-- feature:enclosure-research --> **Projekty obudów:** Oba projekty ze sklejki można obejrzeć w prezentacji statycznej. Generowanie CAD ma osobne instrukcje.

## Szybki start

Użyj Pythona 3.11 lub nowszego. Zainstaluj FFmpeg do konwersji dźwięku.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m app --simulate player --once --no-audio
```

Symulator zapisuje `.state/preview/current.png`. Repozytorium korzysta z istniejących przygotowanych multimediów.
Pakiet wydania zawiera neutralny obraz demonstracyjny.
Połączenia, kalibrację przycisków, sprawdzanie głośnika i instalację usługi opisuje [instrukcja sprzętu](docs/HARDWARE-GUIDE.md).

Zainstaluj narzędzia programistyczne i uruchom lokalną prezentację:

```bash
make install
make check
make serve
```

Otwórz `http://127.0.0.1:8000`. Testy przeglądarki wymagają Node.js 22.
Plik [BUILD-GUIDE.md](docs/BUILD-GUIDE.md) opisuje wymagania Linuksa i środowisko.

## Automatyczna walidacja

`make check` sprawdza konfigurację, testy Pythona, składnię JavaScript, dane przeglądarki 3D i zgodność dokumentacji dwujęzycznej.
CI eksportuje prezentację i sprawdza ją w Chromium, w katalogu głównym oraz podkatalogu repozytorium, na ekranie komputera i telefonu.
Testy obejmują oba modele ze sklejki, pustą zakładkę 3DPrint, połączenia obu kontrolerów, ADR, diagram Mermaid i lokalne zasoby.
`make build` uruchamia również symulator z pakietu i sprawdza zawartość archiwum oraz sumy SHA-256.

Połączenia fizyczne, głośność akustyczna, dopasowanie obudowy i prawa do multimediów wymagają osobnego przeglądu.
Automatyzacja oprogramowania nie potwierdza tych właściwości.

## Budowanie i publikacja

```bash
make smoke
make build
```

Pakiet powstaje jako `output/Alfa-Build-Kit.zip`. Raporty trafiają do `output/reports/`.
Pakiet zawiera aplikację Python, instrukcję połączeń, neutralny obraz i prezentację statyczną z siatkami modeli 3D.
Nie zawiera grafik postaci, nagrań, starszej przeglądarki ani plików produkcyjnych CAD. Źródła strony i generator są w [web/](web/README.md).
Przeczytaj [zawartość wydania](docs/RELEASE-CONTENTS.md), [opis automatyzacji](docs/PIPELINE.md) i [kroki publikacji](docs/PUBLISHING.md).

CI sprawdza pull requesty. GitHub Pages wdraża stronę po poprawnych testach na `main`.
Wydanie wymaga tagu SemVer wskazującego rzeczywisty commit z gałęzi `main`.

## Współpraca i licencje

Plik [CONTRIBUTING.md](docs/CONTRIBUTING.md) opisuje pracę nad kodem.
Problemy bezpieczeństwa zgłaszaj zgodnie z [SECURITY.md](SECURITY.md).
[Licencja MIT](LICENSE) obejmuje oryginalny kod i dokumentację techniczną.
Plik [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) opisuje wyłączenia dotyczące zasobów i informacje o zależnościach.
