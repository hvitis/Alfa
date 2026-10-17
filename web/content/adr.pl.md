# ADR 0001: Odtwarzacz offline na Raspberry Pi z jawnymi granicami sprzętu

**Status:** Zapisany na podstawie istniejącej implementacji  
**Zakres:** Aplikacja linuksowa w `app/`. Firmware Pico to osobna, przyszła implementacja.

## Kontekst

Radio ma mały wyświetlacz SPI, wzmacniacz I²S i pięć przycisków analogowych czytanych przez przetwornik ADC na I²C.
Musi wystartować bez sieci i bez sesji pulpitu. Dziecko może przytrzymać przycisk albo naciskać go wielokrotnie.
Ta sama aplikacja musi działać jako podgląd bez sprzętu na komputerze deweloperskim.

## Decyzja

Używamy aplikacji Pythona uruchamianej z wiersza poleceń, z jedną pętlą sterowania i asynchronicznym wątkiem dźwięku.
Dostęp do urządzeń zostaje za jawnymi interfejsami wyświetlacza, ADC, dźwięku i usługi.
Publicznym punktem wejścia jest `python -m app`.

`app.app` wczytuje `Settings`, wybiera polecenie, przygotowuje media, zajmuje zasoby przez `ExitStack` i uruchamia pętlę sterowania.
`PlayerSession` prowadzi nawigację i obsługę przycisków. Łączy bieżący obraz, opcjonalną animację postaci i stan rysowania litery.

## Wejście i stan

`ADS1x15` odczytuje napięcie klawiatury. Kalibracja zamienia to napięcie na nazwę przycisku.
`Debouncer` wymaga stabilnego naciśnięcia i zwolnienia, zanim przyjmie kolejne. `PressGuard` ogranicza powtórzenia.
Klawiatura SSH trafia do tych samych akcji odtwarzacza.

Pętla sterowania przekazuje przyjęte akcje do `PlayerSession`.
Lewo i prawo zmieniają wybrany obraz. Góra i dół sterują głośnością albo opcjonalnymi animacjami postaci.
Środek steruje odtwarzaniem albo uruchamia lekcję wybranej litery.
Usługa samodzielna działa dalej w bezczynności i ignoruje zwykłe polecenia zakończenia z sesji interaktywnej.

## Media i wyświetlacz

`app.media` przygotowuje obrazy Pillow i konwertuje nagrania przez FFmpeg.
Skróty treści i manifesty unikają powtórnej konwersji. Przygotowane media pozwalają wystartować bez oryginalnych plików źródłowych.

`LetterCatalog` dostarcza geometrię pociągnięć. `LetterLesson` i `CharacterAnimation` tworzą opcjonalne animowane klatki.
`WireFrames` i `AnimationPresenter` wykorzystują ponownie klatki RGB565 i odświeżają zmienione fragmenty wyświetlacza.
Wyświetlacz sprzętowy to `ST7789`. Symulacja wybiera `PreviewDisplay` i zapisuje PNG zamiast sięgać do GPIO albo SPI.

## Dźwięk

`StreamingAudioPlayer` wysyła krótkie bloki PCM do ALSA przez `aplay` w wątku roboczym.
Zmiana głośności w programie dotyczy bieżącego strumienia i nie uruchamia nagrania od nowa.
Domyślna głośność to 20%, a w obecnej konfiguracji maksimum można ustawić na 50%.
Symulacja nie wydaje dźwięku. Pliki audio pozostają materiałem dostarczonym przez użytkownika.

## Start i zakończenie

systemd pilnuje aplikacji przez powiadomienia gotowości i pulsu `ServiceWatchdog`.
Opcjonalna plansza startowa zwalnia wyświetlacz przez lokalne gniazdo Unix, zanim odtwarzacz przejmie swoje GPIO.
Sprzątanie zasobów zatrzymuje dźwięk i zwalnia wyświetlacz oraz ADC, gdy proces się kończy.
Aplikacja nie wyłącza Raspberry Pi po bezczynności.

## Konsekwencje

- Odtwarzacz działa offline i nie potrzebuje serwera WWW na Pi.
- Testy bez sprzętu ćwiczą pętlę sterowania, obsługę mediów i akcje odtwarzacza.
- Fizyczne okablowanie, wygląd wyświetlacza i głośność wymagają sprawdzenia na zmontowanym urządzeniu.
- Aplikacja linuksowa zależy od Raspberry Pi OS, ALSA i bibliotek urządzeń Pi.
- Widok okablowania Pico opisuje propozycję przypisania pinów. Nie oznacza, że aplikacja linuksowa działa na Pico.

## Alternatywy

Odtwarzacz w przeglądarce na Pi dokłada środowisko przeglądarki i stos wyświetlania do urządzenia z fizycznymi przyciskami.
Jedno synchroniczne wywołanie dźwięku blokuje obsługę sterowania na czas odtwarzania.
Osobny firmware Pico może użyć tych samych peryferiów, ale potrzebuje własnej obsługi mediów, czasu i dźwięku przez PIO.

## Mapa źródeł

| Odpowiedzialność | Źródło |
| --- | --- |
| Rozdzielanie poleceń i pętla sterowania | `app/app.py` |
| Konfiguracja | `app/config.py` |
| Stan odtwarzacza i akcje | `app/player.py` |
| Sterowniki ADC i wyświetlacza | `app/hardware.py` |
| Kalibracja, tłumienie drgań i ograniczenie powtórzeń | `app/buttons.py` |
| Konwersja mediów i manifesty | `app/media.py` |
| Wątek dźwięku | `app/audio.py` |
| Kodowanie i prezentacja klatek | `app/frames.py` |
| Lekcje liter i ścieżki | `app/letter_lesson.py`, `app/letter_paths.py` |
| Nadzór usługi i przekazanie planszy startowej | `app/service.py`, `app/splash.py`, `app/display_handoff.py` |
