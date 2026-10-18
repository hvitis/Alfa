const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./viewer-Dodxuo-b.js","./rolldown-runtime-vfrPO-fZ.js","./software-B6OGHqkZ.js","./_baseFor-D6HAxaEF.js","./src-BEUDH-Cj.js","./chunk-ABZYJK2D-USw8E6Xu.js","./chunk-S3R3BYOJ-LAdrH1lo.js","./math-Bi_r_ZWc.js","./dist-CwHWZ2rq.js","./chunk-JA3XYJ7Z-CX4dsyIk.js","./chunk-HN2XXSSU-Cl71PWKS.js","./chunk-CVBHYZKI-Bazvy0g1.js","./chunk-ATLVNIR6-BHcZw4sU.js","./chunk-JZLCHNYA-DeyLbGYQ.js","./chunk-QXUST7PY-CK1Z6iwd.js","./line-DNfIX2Jo.js","./path-fybaL0A-.js","./array-BifhSqXX.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`<h1>ADR 0001: An offline Raspberry Pi player with explicit hardware boundaries</h1>
<p><strong>Status:</strong> Recorded from the existing implementation<br>
<strong>Scope:</strong> The Linux application in <code>app/</code>. Pico firmware is a separate future implementation.</p>
<h2>Context</h2>
<p>The radio uses a small SPI display, an I²S amplifier, and five analog buttons read through an I²C ADC.
It must start without a network connection or desktop session. A child can hold or repeatedly press a button.
The same application must support a hardware-free preview on a development computer.</p>
<h2>Decision</h2>
<p>Use a Python command-line application with a single control loop and an asynchronous audio worker.
Keep device access behind explicit display, ADC, audio, and service interfaces.
The public entry point is <code>python -m app</code>.</p>
<p><code>app.app</code> loads <code>Settings</code>, selects the command, prepares media, acquires resources through <code>ExitStack</code>, and runs the control loop.
<code>PlayerSession</code> owns navigation and button actions. It combines the current image, optional character animation, and letter drawing state.</p>
<h2>Input and state</h2>
<p><code>ADS1x15</code> reads keypad voltage. Calibration maps that voltage to a button name.
<code>Debouncer</code> requires a stable press and a release before another press. <code>PressGuard</code> limits repeated actions.
SSH keyboard input maps to the same player actions.</p>
<p>The control loop passes accepted actions to <code>PlayerSession</code>.
Left and right change the selected image. Up and down control volume or optional character animations.
Center controls playback or starts the selected letter lesson.
The standalone service continues running while idle and ignores normal interactive quit controls.</p>
<h2>Media and display</h2>
<p><code>app.media</code> prepares images with Pillow and converts recordings with FFmpeg.
Content hashes and manifests avoid repeated conversions. Prepared media supports startup without the original source images.</p>
<p><code>LetterCatalog</code> supplies stroke geometry. <code>LetterLesson</code> and <code>CharacterAnimation</code> produce optional animated frames.
<code>WireFrames</code> and <code>AnimationPresenter</code> reuse RGB565 frames and update changed display regions.
The hardware display uses <code>ST7789</code>. Simulation selects <code>PreviewDisplay</code> and saves a PNG instead of accessing GPIO or SPI.</p>
<h2>Audio</h2>
<p><code>StreamingAudioPlayer</code> sends short PCM blocks to ALSA through <code>aplay</code> in a worker thread.
Software volume changes affect the current stream without restarting the recording.
The default volume is 20%, with a configurable 50% maximum in the current configuration.
Simulation produces no sound. Audio files remain user-supplied inputs.</p>
<h2>Startup and shutdown</h2>
<p>systemd supervises the app through <code>ServiceWatchdog</code> readiness and heartbeat notifications.
An optional early boot splash releases the display through a local Unix socket before the player claims its GPIOs.
Resource cleanup stops audio and releases the display and ADC when the process exits.
The app does not shut down the Raspberry Pi after inactivity.</p>
<h2>Consequences</h2>
<ul>
<li>The player runs offline and requires no web server on the Pi.</li>
<li>Hardware-free tests exercise the control loop, media handling, and player actions.</li>
<li>Physical wiring, display appearance, and acoustic volume require checks on the assembled device.</li>
<li>The Linux app depends on Raspberry Pi OS, ALSA, and Pi device libraries.</li>
<li>The Pico wiring view documents a proposed pin assignment. It does not imply that the Linux app runs on a Pico.</li>
</ul>
<h2>Alternatives</h2>
<p>A browser-based player on the Pi adds a browser runtime and display stack to a device with physical controls.
A single synchronous audio call blocks control handling during playback.
Separate Pico firmware can use the same peripherals, but needs its own media handling, timing, and PIO audio implementation.</p>
<h2>Source map</h2>
<table>
<thead>
<tr>
<th>Responsibility</th>
<th>Source</th>
</tr>
</thead>
<tbody>
<tr>
<td>Command dispatch and control loop</td>
<td><code>app/app.py</code></td>
</tr>
<tr>
<td>Configuration</td>
<td><code>app/config.py</code></td>
</tr>
<tr>
<td>Player state and actions</td>
<td><code>app/player.py</code></td>
</tr>
<tr>
<td>ADC and display drivers</td>
<td><code>app/hardware.py</code></td>
</tr>
<tr>
<td>Calibration, debounce, and press guard</td>
<td><code>app/buttons.py</code></td>
</tr>
<tr>
<td>Media conversion and manifests</td>
<td><code>app/media.py</code></td>
</tr>
<tr>
<td>Audio worker</td>
<td><code>app/audio.py</code></td>
</tr>
<tr>
<td>Frame encoding and presentation</td>
<td><code>app/frames.py</code></td>
</tr>
<tr>
<td>Letter lessons and paths</td>
<td><code>app/letter_lesson.py</code>, <code>app/letter_paths.py</code></td>
</tr>
<tr>
<td>Service supervision and splash handoff</td>
<td><code>app/service.py</code>, <code>app/splash.py</code>, <code>app/display_handoff.py</code></td>
</tr>
</tbody>
</table>
`,t=`<h1>ADR 0001: Odtwarzacz offline na Raspberry Pi z jawnymi granicami sprzętu</h1>
<p><strong>Status:</strong> Zapisany na podstawie istniejącej implementacji<br>
<strong>Zakres:</strong> Aplikacja linuksowa w <code>app/</code>. Firmware Pico to osobna, przyszła implementacja.</p>
<h2>Kontekst</h2>
<p>Radio ma mały wyświetlacz SPI, wzmacniacz I²S i pięć przycisków analogowych czytanych przez przetwornik ADC na I²C.
Musi wystartować bez sieci i bez sesji pulpitu. Dziecko może przytrzymać przycisk albo naciskać go wielokrotnie.
Ta sama aplikacja musi działać jako podgląd bez sprzętu na komputerze deweloperskim.</p>
<h2>Decyzja</h2>
<p>Używamy aplikacji Pythona uruchamianej z wiersza poleceń, z jedną pętlą sterowania i asynchronicznym wątkiem dźwięku.
Dostęp do urządzeń zostaje za jawnymi interfejsami wyświetlacza, ADC, dźwięku i usługi.
Publicznym punktem wejścia jest <code>python -m app</code>.</p>
<p><code>app.app</code> wczytuje <code>Settings</code>, wybiera polecenie, przygotowuje media, zajmuje zasoby przez <code>ExitStack</code> i uruchamia pętlę sterowania.
<code>PlayerSession</code> prowadzi nawigację i obsługę przycisków. Łączy bieżący obraz, opcjonalną animację postaci i stan rysowania litery.</p>
<h2>Wejście i stan</h2>
<p><code>ADS1x15</code> odczytuje napięcie klawiatury. Kalibracja zamienia to napięcie na nazwę przycisku.
<code>Debouncer</code> wymaga stabilnego naciśnięcia i zwolnienia, zanim przyjmie kolejne. <code>PressGuard</code> ogranicza powtórzenia.
Klawiatura SSH trafia do tych samych akcji odtwarzacza.</p>
<p>Pętla sterowania przekazuje przyjęte akcje do <code>PlayerSession</code>.
Lewo i prawo zmieniają wybrany obraz. Góra i dół sterują głośnością albo opcjonalnymi animacjami postaci.
Środek steruje odtwarzaniem albo uruchamia lekcję wybranej litery.
Usługa samodzielna działa dalej w bezczynności i ignoruje zwykłe polecenia zakończenia z sesji interaktywnej.</p>
<h2>Media i wyświetlacz</h2>
<p><code>app.media</code> przygotowuje obrazy Pillow i konwertuje nagrania przez FFmpeg.
Skróty treści i manifesty unikają powtórnej konwersji. Przygotowane media pozwalają wystartować bez oryginalnych plików źródłowych.</p>
<p><code>LetterCatalog</code> dostarcza geometrię pociągnięć. <code>LetterLesson</code> i <code>CharacterAnimation</code> tworzą opcjonalne animowane klatki.
<code>WireFrames</code> i <code>AnimationPresenter</code> wykorzystują ponownie klatki RGB565 i odświeżają zmienione fragmenty wyświetlacza.
Wyświetlacz sprzętowy to <code>ST7789</code>. Symulacja wybiera <code>PreviewDisplay</code> i zapisuje PNG zamiast sięgać do GPIO albo SPI.</p>
<h2>Dźwięk</h2>
<p><code>StreamingAudioPlayer</code> wysyła krótkie bloki PCM do ALSA przez <code>aplay</code> w wątku roboczym.
Zmiana głośności w programie dotyczy bieżącego strumienia i nie uruchamia nagrania od nowa.
Domyślna głośność to 20%, a w obecnej konfiguracji maksimum można ustawić na 50%.
Symulacja nie wydaje dźwięku. Pliki audio pozostają materiałem dostarczonym przez użytkownika.</p>
<h2>Start i zakończenie</h2>
<p>systemd pilnuje aplikacji przez powiadomienia gotowości i pulsu <code>ServiceWatchdog</code>.
Opcjonalna plansza startowa zwalnia wyświetlacz przez lokalne gniazdo Unix, zanim odtwarzacz przejmie swoje GPIO.
Sprzątanie zasobów zatrzymuje dźwięk i zwalnia wyświetlacz oraz ADC, gdy proces się kończy.
Aplikacja nie wyłącza Raspberry Pi po bezczynności.</p>
<h2>Konsekwencje</h2>
<ul>
<li>Odtwarzacz działa offline i nie potrzebuje serwera WWW na Pi.</li>
<li>Testy bez sprzętu ćwiczą pętlę sterowania, obsługę mediów i akcje odtwarzacza.</li>
<li>Fizyczne okablowanie, wygląd wyświetlacza i głośność wymagają sprawdzenia na zmontowanym urządzeniu.</li>
<li>Aplikacja linuksowa zależy od Raspberry Pi OS, ALSA i bibliotek urządzeń Pi.</li>
<li>Widok okablowania Pico opisuje propozycję przypisania pinów. Nie oznacza, że aplikacja linuksowa działa na Pico.</li>
</ul>
<h2>Alternatywy</h2>
<p>Odtwarzacz w przeglądarce na Pi dokłada środowisko przeglądarki i stos wyświetlania do urządzenia z fizycznymi przyciskami.
Jedno synchroniczne wywołanie dźwięku blokuje obsługę sterowania na czas odtwarzania.
Osobny firmware Pico może użyć tych samych peryferiów, ale potrzebuje własnej obsługi mediów, czasu i dźwięku przez PIO.</p>
<h2>Mapa źródeł</h2>
<table>
<thead>
<tr>
<th>Odpowiedzialność</th>
<th>Źródło</th>
</tr>
</thead>
<tbody>
<tr>
<td>Rozdzielanie poleceń i pętla sterowania</td>
<td><code>app/app.py</code></td>
</tr>
<tr>
<td>Konfiguracja</td>
<td><code>app/config.py</code></td>
</tr>
<tr>
<td>Stan odtwarzacza i akcje</td>
<td><code>app/player.py</code></td>
</tr>
<tr>
<td>Sterowniki ADC i wyświetlacza</td>
<td><code>app/hardware.py</code></td>
</tr>
<tr>
<td>Kalibracja, tłumienie drgań i ograniczenie powtórzeń</td>
<td><code>app/buttons.py</code></td>
</tr>
<tr>
<td>Konwersja mediów i manifesty</td>
<td><code>app/media.py</code></td>
</tr>
<tr>
<td>Wątek dźwięku</td>
<td><code>app/audio.py</code></td>
</tr>
<tr>
<td>Kodowanie i prezentacja klatek</td>
<td><code>app/frames.py</code></td>
</tr>
<tr>
<td>Lekcje liter i ścieżki</td>
<td><code>app/letter_lesson.py</code>, <code>app/letter_paths.py</code></td>
</tr>
<tr>
<td>Nadzór usługi i przekazanie planszy startowej</td>
<td><code>app/service.py</code>, <code>app/splash.py</code>, <code>app/display_handoff.py</code></td>
</tr>
</tbody>
</table>
`,n=`<h1><span class="id">AL-ADR-0001</span>: Segregate display output into a class C Output Guard process</h1>
<blockquote>
<p><strong>TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY</strong></p>
<p>This is a fictional worked example of an architecture decision record.
It is not a real record, it does not describe a real product, and it is not evidence of conformity with any regulation or standard.</p>
</blockquote>
<h2>Read this first</h2>
<h3>Purpose of this document</h3>
<p>This document teaches how to write an architecture decision record (ADR) for software in a medical device.
It shows the sections that Regulation (EU) 2017/745 (MDR), IEC 62304, and ISO 14971 add to an ordinary software ADR.
Use it for training sessions, workshops, and self-study.</p>
<h3>About Alfa and the fictional Alfa-L</h3>
<ul>
<li>Alfa is an open-source hobby project: a small offline radio that helps children learn letters.</li>
<li>Alfa is not a medical device. It has no medical intended purpose and makes no medical claims.
It is not intended for the diagnosis, prevention, monitoring, treatment, or alleviation of any disease, injury, or disability.</li>
<li>Alfa holds no licence, certificate, CE marking, registration, notified body assessment, or regulatory approval of any kind.</li>
<li>Alfa-L does not exist. It was invented for this exercise.
Nobody manufactures, sells, supplies, places on the market, or puts into service any device described here.</li>
<li>Alfa's original code and technical documentation, including this example, are published under the MIT License.
That license provides them &quot;as is&quot;, without warranty of any kind. See <a href="https://github.com/hvitis/Alfa/blob/main/LICENSE">LICENSE</a>.</li>
<li>The real Alfa architecture is in <a href="adr.md">ADR 0001</a>.</li>
</ul>
<h3>What is fictional</h3>
<ul>
<li>Everything about Alfa-L is invented: its intended purpose, classification, hazards, requirements, test results, document IDs, roles, dates, and records.</li>
<li>No review, test, or approval took place. The approval and revision tables show the format only. Nobody signed anything.</li>
<li>Organisation types such as &quot;notified body&quot; are generic. No real organisation reviewed or endorsed this document.</li>
</ul>
<h3>Limits of use</h3>
<ul>
<li>This document is not legal, regulatory, clinical, or medical advice.</li>
<li>Its summaries of regulations and standards come from public sources. They may be incomplete, out of date, or wrong. Check the official texts.</li>
<li>Do not submit this document, or any part of it, as real technical documentation.
Do not cite it as evidence that any device, including Alfa, is safe, effective, or conforms to any requirement.</li>
<li>A real ADR needs its own intended purpose, risk analysis, verification evidence, and review by qualified people.</li>
<li>If you copy or adapt this example, keep this notice and the &quot;TEACHING MATERIAL&quot; marking.</li>
</ul>
<h3>How to read this example</h3>
<table>
<thead>
<tr>
<th>Section</th>
<th>What it teaches</th>
</tr>
</thead>
<tbody>
<tr>
<td>Document control</td>
<td>Every design record has an ID, version, status, owner, and links to related records (ISO 13485 document control).</td>
</tr>
<tr>
<td>1. Decision summary</td>
<td>State the decision first, in a few sentences.</td>
</tr>
<tr>
<td>2. Context</td>
<td>Describe the intended purpose, the classification, and the problem that forces a decision.</td>
</tr>
<tr>
<td>3–4. Drivers and requirements</td>
<td>Trace every driver and requirement to its source. Write each requirement as one testable &quot;shall&quot; statement.</td>
</tr>
<tr>
<td>5. Considered options</td>
<td>Compare real alternatives against the drivers, and record why each one lost.</td>
</tr>
<tr>
<td>6. Decision outcome</td>
<td>Add the medical device content: software items and safety classes, interfaces, segregation, SOUP, risk controls, and security.</td>
</tr>
<tr>
<td>7–10. Consequences to revisit triggers</td>
<td>Record the costs, how the decision is verified, who does what next, and what would reopen the decision.</td>
</tr>
<tr>
<td>11–14. Related decisions to revision history</td>
<td>Link the decision log, references, approvals, and changes.</td>
</tr>
</tbody>
</table>
<h2>Document control</h2>
<table>
<thead>
<tr>
<th>Field</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Document classification</td>
<td>TEACHING MATERIAL. Not a medical device. For educational purposes only.</td>
</tr>
<tr>
<td>Document ID</td>
<td><span class="id">AL-ADR-0001</span>, version 1.0 (fictional)</td>
</tr>
<tr>
<td>Status</td>
<td>Accepted (fictional)</td>
</tr>
<tr>
<td>Effective date</td>
<td>2026-10-12 (fictional)</td>
</tr>
<tr>
<td>Product</td>
<td>Alfa-L home speech-practice device, software 1.x</td>
</tr>
<tr>
<td>Owner</td>
<td>Software Architect</td>
</tr>
<tr>
<td>Document type</td>
<td>Design and development output (ISO 13485 §7.3.4), part of the software architecture (IEC 62304 §5.3)</td>
</tr>
<tr>
<td>Technical documentation</td>
<td>MDR Annex II §3 (design information) and §6.1(b) (software verification and validation)</td>
</tr>
<tr>
<td>Supersedes</td>
<td>Alfa ADR 0001, for the Alfa-L product line only</td>
</tr>
<tr>
<td>Depends on</td>
<td><span class="id">AL-ADR-0002</span>, <span class="id">AL-ADR-0003</span></td>
</tr>
</tbody>
</table>
<h2>1. Decision summary</h2>
<p>Alfa-L runs as two processes.
The <strong>Output Guard</strong> is the only process that can write to the display, and it checks every frame against the flash limit.
The <strong>Practice App</strong> keeps the existing Alfa code and has no access to the display hardware.
This limits IEC 62304 class C work to one small software item instead of the whole application.</p>
<h2>2. Context</h2>
<h3>2.1 Intended purpose and users</h3>
<p>Alfa-L supports home practice of Polish speech sounds by children aged 3 to 7 with a diagnosed speech sound disorder.
A speech-language therapist selects the exercises and directs the therapy (intended purpose <span class="id">IP-001</span>).
Alfa-L records the child's attempts and computes a practice score for each sound.
The therapist uses the score to decide when to move to the next sound.
Alfa-L does not diagnose.</p>
<table>
<thead>
<tr>
<th>User group</th>
<th>Profile</th>
<th>Main tasks</th>
</tr>
</thead>
<tbody>
<tr>
<td>Child</td>
<td>3–7 years, cannot read, may hold or mash buttons</td>
<td>Practise sounds with five buttons</td>
</tr>
<tr>
<td>Caregiver</td>
<td>Lay person</td>
<td>Charge the device, start practice, report problems</td>
</tr>
<tr>
<td>Therapist</td>
<td>Speech-language therapist</td>
<td>Set the exercise plan, read scores on the device</td>
</tr>
</tbody>
</table>
<h3>2.2 Regulatory classification</h3>
<ul>
<li><strong>MDR class IIa</strong> under Annex VIII Rule 11: the practice score is information used to take therapeutic decisions.
A wrong decision delays therapy but cannot cause a serious deterioration of health, so classes IIb and III do not apply.</li>
<li>Without the score, Alfa-L would be class I under Rule 13. Product decision <span class="id">PD-003</span> keeps the score.</li>
<li>Conformity assessment follows Annex IX with a notified body.</li>
<li>The IEC 62304 software system class is C because of <span class="id">HAZ-02</span> (section 6.3).</li>
</ul>
<h3>2.3 Problem</h3>
<p>Consumer Alfa is one Python process of about 2,500 lines.
It reads the buttons, plays audio, renders lessons and animations, and drives the ST7789 display.
The boot splash is a second program that also writes to the display.</p>
<p>The display shows animations at up to 20 frames per second.
A defect anywhere in the process could make the screen flash and contribute to <span class="id">HAZ-02</span>, a photosensitive seizure.
A seizure is a serious injury, so software that can cause one is class C.
The current artwork stays well below the flash limit. The hazard comes from defects, not from the content.</p>
<p>IEC 62304 §4.3 allows a software item a lower class than its system only when the manufacturer documents how the item is segregated.
Nothing segregates items inside one process, so today every line would be class C.
Class C adds detailed design for every unit and interface (§5.4.2–§5.4.4) and additional unit acceptance criteria (§5.5.4).</p>
<h2>3. Decision drivers</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Driver</th>
<th>Source</th>
</tr>
</thead>
<tbody>
<tr>
<td>DD-1</td>
<td>Control <span class="id">HAZ-02</span> with a measure whose effectiveness can be verified, also under a single fault</td>
<td>ISO 14971 §7.1, §7.2; MDR Annex I GSPR 4 and 17.1</td>
</tr>
<tr>
<td>DD-2</td>
<td>Keep the class C scope as small as possible</td>
<td>IEC 62304 §4.3, §5.3.5</td>
</tr>
<tr>
<td>DD-3</td>
<td>Reuse the existing Alfa code and its tests</td>
<td>Software development plan <span class="id">SDP-001</span></td>
</tr>
<tr>
<td>DD-4</td>
<td>Stay offline with a short SOUP list and a small attack surface</td>
<td><span class="id">AL-ADR-0003</span>; GSPR 17.2, 17.4; IEC 81001-5-1</td>
</tr>
<tr>
<td>DD-5</td>
<td>Respond to a child's press within 150 ms</td>
<td><span class="id">SRS-021</span>; IEC 62366-1 use specification</td>
</tr>
<tr>
<td>DD-6</td>
<td>Keep the validated Raspberry Pi 3 hardware and its unit cost</td>
<td>Product requirements <span class="id">PRS-001</span></td>
</tr>
</tbody>
</table>
<h2>4. Requirements in scope</h2>
<p>Each requirement states one testable property, traces to its source, and names its verification.</p>
<table>
<thead>
<tr>
<th>ID</th>
<th>Requirement</th>
<th>Traces to</th>
<th>Verification</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SRS-010</span></td>
<td>The software shall not enable any network interface.</td>
<td><span class="id">AL-ADR-0003</span>, <span class="id">SEC-01</span></td>
<td>Inspection and test <span class="id">VER-SYS-010</span></td>
</tr>
<tr>
<td><span class="id">SRS-021</span></td>
<td>The device shall give audible or visible feedback within 150 ms of a button press, at the 95th percentile.</td>
<td><span class="id">UN-004</span>, DD-5</td>
<td>Test <span class="id">VER-SYS-021</span></td>
</tr>
<tr>
<td><span class="id">SRS-030</span></td>
<td>The display shall show no more than three flashes in any one-second period. A flash is a pair of opposing luminance changes of at least 20 cd/m² where the darker image is below 160 cd/m², or a transition to or from saturated red. Only flashes that cover more than 25 % of the screen count (ITU-R BT.1702).</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-03</span></td>
<td>Test <span class="id">VER-SW-030</span></td>
</tr>
<tr>
<td><span class="id">SRS-031</span></td>
<td>When a new frame would exceed the <span class="id">SRS-030</span> limit, the Output Guard shall keep the last compliant frame on the display.</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-03</span></td>
<td>Test <span class="id">VER-SW-031</span></td>
</tr>
<tr>
<td><span class="id">SRS-032</span></td>
<td>Only the Output Guard shall have access to the SPI display device and the display control lines.</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-04</span></td>
<td>Inspection and test <span class="id">VER-SW-032</span></td>
</tr>
<tr>
<td><span class="id">SRS-033</span></td>
<td>The Output Guard shall add no more than 10 ms per frame, at the 95th percentile.</td>
<td><span class="id">SRS-021</span></td>
<td>Test <span class="id">VER-SW-033</span></td>
</tr>
</tbody>
</table>
<h2>5. Considered options</h2>
<ul>
<li><strong>A. Single process.</strong> Keep consumer Alfa unchanged and add the flash limiter inside it.</li>
<li><strong>B. Output Guard process.</strong> Move the display driver and a flash limiter into a separate process that alone owns the display.</li>
<li><strong>C. RP2040 co-processor.</strong> Put a Raspberry Pi Pico between the Pi and the display. Its firmware enforces the limit.</li>
<li><strong>D. Tablet app.</strong> Rebuild Alfa-L as an app for an off-the-shelf tablet.</li>
</ul>
<table>
<thead>
<tr>
<th>Driver</th>
<th>A. Single process</th>
<th>B. Output Guard process</th>
<th>C. RP2040 co-processor</th>
<th>D. Tablet app</th>
</tr>
</thead>
<tbody>
<tr>
<td>DD-1 <span class="id">HAZ-02</span> control</td>
<td>Weak: the limiter shares memory with all other code</td>
<td>Good: the operating system enforces the boundary</td>
<td>Best: separate hardware</td>
<td>Weak: the operating system can draw over the app</td>
</tr>
<tr>
<td>DD-2 Class C scope</td>
<td>Whole app, about 2,500 lines</td>
<td>Output Guard, estimated 400 lines</td>
<td>New firmware, estimated 600 lines</td>
<td>Whole app</td>
</tr>
<tr>
<td>DD-3 Reuse</td>
<td>Complete</td>
<td>High: only the display driver moves</td>
<td>Medium: new firmware and protocol</td>
<td>None</td>
</tr>
<tr>
<td>DD-4 Offline, short SOUP list</td>
<td>Good</td>
<td>Good</td>
<td>Good, adds the Pico SDK</td>
<td>Poor: network, store updates, large OS</td>
</tr>
<tr>
<td>DD-5 150 ms response</td>
<td>Good</td>
<td>Good, under 10 ms added</td>
<td>Good</td>
<td>Good</td>
</tr>
<tr>
<td>DD-6 Hardware and cost</td>
<td>No change</td>
<td>No change</td>
<td>Extra board and a second firmware release process</td>
<td>New platform</td>
</tr>
</tbody>
</table>
<p>Why the other options lost:</p>
<ul>
<li><strong>A</strong> fails DD-2. Every change anywhere in the app would need class C evidence.</li>
<li><strong>C</strong> gives the strongest control but adds a second safety-critical product with its own toolchain and release process. It is the fallback if the notified body rejects process segregation (section 10).</li>
<li><strong>D</strong> depends on an operating system the manufacturer does not control and on network updates. With headphones connected, the hardware sound limit of <span class="id">AL-ADR-0002</span> no longer applies.</li>
</ul>
<h2>6. Decision outcome</h2>
<p>Chosen option: <strong>B. Output Guard process</strong>.
It is the only option that controls <span class="id">HAZ-02</span> behind a boundary enforced by the operating system, keeps class C work to one small item, and reuses the existing code.</p>
<h3>6.1 Architecture</h3>
<pre><code class="language-mermaid">flowchart TB
  subgraph APP[&quot;Practice App · class B&quot;]
    IN[&quot;SI-02 Input&quot;] --&gt; CTRL[&quot;SI-01 Control and session&quot;]
    LES[&quot;SI-03 Exercises and lessons&quot;] --&gt; CTRL
    CTRL --&gt; AUD[&quot;SI-04 Audio&quot;]
    CTRL --&gt; REC[&quot;SI-05 Recording and scoring&quot;]
    REC --&gt; STORE[&quot;SI-06 Data store&quot;]
  end
  subgraph GUARD[&quot;Output Guard · class C&quot;]
    VAL[&quot;Validate and compose&quot;] --&gt; LIM[&quot;Flash limiter&quot;] --&gt; DRV[&quot;ST7789 driver&quot;]
  end
  KEY[&quot;Keypad → ADS1115&quot;] -- &quot;IF-04 I²C&quot; --&gt; IN
  CTRL -- &quot;IF-01 frames · Unix socket&quot; --&gt; VAL
  AUD -- &quot;IF-05 I²S&quot; --&gt; AMP[&quot;MAX98357A · gain fixed in hardware&quot;]
  MIC[&quot;USB microphone&quot;] -- &quot;IF-06&quot; --&gt; REC
  DRV -- &quot;IF-03 SPI · exclusive&quot; --&gt; LCD[&quot;ST7789 display&quot;]
</code></pre>
<h3>6.2 Software items</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Software item</th>
<th>Responsibility</th>
<th>Origin in consumer Alfa</th>
<th>Process</th>
<th>Class</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SI-01</span></td>
<td>Control and session</td>
<td>Control loop, button actions, screen state</td>
<td><code>app/app.py</code>, <code>app/player.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-02</span></td>
<td>Input</td>
<td>ADC reading, calibration, <code>Debouncer</code>, <code>PressGuard</code></td>
<td><code>app/buttons.py</code>, <code>ADS1x15</code> in <code>app/hardware.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-03</span></td>
<td>Exercises and lessons</td>
<td>Letter lessons, animations, prepared media</td>
<td><code>app/letter_lesson.py</code>, <code>app/letter_paths.py</code>, <code>app/frames.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-04</span></td>
<td>Audio</td>
<td>Playback and the software volume cap</td>
<td><code>app/audio.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-05</span></td>
<td>Recording and scoring</td>
<td>Record attempts and compute a score for each sound</td>
<td>New (<span class="id">AL-ADR-0004</span>)</td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-06</span></td>
<td>Data store</td>
<td>Practice log, recordings, deletion after 14 days</td>
<td>New</td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-07</span></td>
<td>Output Guard</td>
<td>Frame validation, flash limiter, ST7789 driver, boot image, its own watchdog</td>
<td><code>ST7789</code> in <code>app/hardware.py</code> and <code>app/splash.py</code>; replaces <code>app/display_handoff.py</code>; the limiter is new</td>
<td>Output Guard</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SI-08</span></td>
<td>App supervision</td>
<td>Readiness and watchdog for the Practice App</td>
<td><code>app/service.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
</tbody>
</table>
<p>Items in the Practice App inherit class B.
None is classified A, because nothing segregates items inside one Python process.
<span class="id">HAZ-03</span> makes the Practice App class B.
<span class="id">HAZ-01</span> does not raise it, because <span class="id">AL-ADR-0002</span> limits the sound pressure in hardware.</p>
<h3>6.3 Software safety classification</h3>
<table>
<thead>
<tr>
<th>Hazard</th>
<th>Harm</th>
<th>Severity</th>
<th>Software contribution</th>
<th>External risk control</th>
<th>Effect on classes</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">HAZ-01</span> Excessive sound pressure</td>
<td>Noise-induced hearing loss</td>
<td>Serious</td>
<td>The Practice App sends audio samples</td>
<td><span class="id">RCM-01</span>, hardware gain limit</td>
<td>None: at full digital scale the level stays acceptable</td>
</tr>
<tr>
<td><span class="id">HAZ-02</span> Flashing images</td>
<td>Photosensitive seizure</td>
<td>Serious</td>
<td>Any code that produces frames</td>
<td>None</td>
<td><span class="id">SI-07</span> is class C; the other items are segregated from it</td>
</tr>
<tr>
<td><span class="id">HAZ-03</span> Wrong practice score</td>
<td>Delayed or prolonged therapy</td>
<td>Non-serious</td>
<td><span class="id">SI-05</span></td>
<td><span class="id">RCM-06</span>, therapist review (partial)</td>
<td>Practice App is class B</td>
</tr>
<tr>
<td><span class="id">HAZ-04</span> Device stops responding</td>
<td>Missed practice session</td>
<td>No injury</td>
<td>Any item</td>
<td>None needed</td>
<td>None</td>
</tr>
</tbody>
</table>
<h3>6.4 Interfaces</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Interface</th>
<th>Between</th>
<th>Mechanism</th>
<th>Contract</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">IF-01</span></td>
<td>Frame submission</td>
<td>Practice App → Output Guard</td>
<td>Unix domain socket <code>/run/alfa/frame.sock</code>, <code>SOCK_SEQPACKET</code></td>
<td>Sequence number, region (x, y, width, height), RGB565 pixels, <span class="id">CRC-32</span>. The Guard rejects malformed messages.</td>
</tr>
<tr>
<td><span class="id">IF-02</span></td>
<td>Frame status</td>
<td>Output Guard → Practice App</td>
<td>Same socket</td>
<td><code>SHOWN</code>, <code>HELD</code>, or <code>REJECTED</code> for each sequence number</td>
</tr>
<tr>
<td><span class="id">IF-03</span></td>
<td>Display bus</td>
<td>Output Guard → ST7789</td>
<td>SPI0, GPIO 24, 25, and 27</td>
<td>Output Guard only</td>
</tr>
<tr>
<td><span class="id">IF-04</span></td>
<td>Buttons</td>
<td>Keypad → Practice App</td>
<td>ADS1115 on I²C bus 1</td>
<td>Unchanged</td>
</tr>
<tr>
<td><span class="id">IF-05</span></td>
<td>Speaker</td>
<td>Practice App → MAX98357A</td>
<td>ALSA, I²S</td>
<td>Unchanged; gain fixed in hardware</td>
</tr>
<tr>
<td><span class="id">IF-06</span></td>
<td>Microphone</td>
<td>USB microphone → Practice App</td>
<td>ALSA capture</td>
<td>New</td>
</tr>
</tbody>
</table>
<p>The Practice App already sends changed rectangles (<code>AnimationPresenter</code>, <code>ST7789.show_region</code>).
The Output Guard composes each rectangle into its own copy of the full frame and analyses that frame before it reaches the panel.</p>
<h3>6.5 Segregation (IEC 62304 §5.3.5)</h3>
<ul>
<li>The two processes run as different Linux users, <code>alfa-app</code> and <code>alfa-guard</code>.</li>
<li>udev rules give <code>/dev/spidev0.0</code> and <code>/dev/gpiochip0</code> to the <code>alfa-guard</code> group only.
The Practice App needs neither: its buttons use I²C, and it sends frames through <span class="id">IF-01</span>.</li>
<li>The Output Guard trusts nothing it receives.
It checks the size and CRC, composes the frame, and analyses it before writing to the panel.</li>
<li>systemd limits the Practice App's memory and CPU, so the App cannot starve the Guard.</li>
<li>If the Guard stops, the ST7789 keeps its last image. A static image is the safe state for <span class="id">HAZ-02</span>.
systemd restarts the Guard within 2 s.</li>
<li>Assumption: Linux process isolation and file permissions work as specified (<span class="id">SOUP-01</span>).
Each release reviews the kernel's published anomalies.</li>
</ul>
<h3>6.6 SOUP (IEC 62304 §5.3.3, §5.3.4, §8.1.2)</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>SOUP item and version</th>
<th>Used by</th>
<th>Required function or performance</th>
<th>Highest class of a using item</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SOUP-01</span></td>
<td>Raspberry Pi OS Lite 12 (Bookworm), Linux 6.6</td>
<td>All</td>
<td>Process isolation, file permissions, SPI, I²C, and I²S drivers</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-02</span></td>
<td>systemd 252</td>
<td>All</td>
<td>Restart a failed service within 2 s; enforce resource limits</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-03</span></td>
<td>CPython 3.11</td>
<td>All</td>
<td>Interpreter</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-04</span></td>
<td>NumPy 1.26</td>
<td><span class="id">SI-07</span></td>
<td>Analyse a 240 × 320 frame in under 5 ms on the Raspberry Pi 3</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-05</span></td>
<td>spidev 3.8, gpiozero 2.0 with lgpio</td>
<td><span class="id">SI-07</span></td>
<td>SPI writes and display control lines</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-06</span></td>
<td>Pillow 12</td>
<td><span class="id">SI-01</span>, <span class="id">SI-03</span></td>
<td>Image composition</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SOUP-07</span></td>
<td>smbus2 0.6</td>
<td><span class="id">SI-02</span></td>
<td>I²C reads from the ADC</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SOUP-08</span></td>
<td>alsa-utils 1.2 (<code>aplay</code>, <code>arecord</code>)</td>
<td><span class="id">SI-04</span>, <span class="id">SI-05</span></td>
<td>48 kHz PCM playback and capture without underruns at a 100 ms buffer</td>
<td>B</td>
</tr>
</tbody>
</table>
<p>FFmpeg is not on the device.
Media is prepared at build time with the existing <code>--prepared-only</code> mode.
FFmpeg is therefore a validated build tool (ISO 13485 §4.1.6), not SOUP.</p>
<h3>6.7 Risk control measures</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Hazard</th>
<th>Measure</th>
<th>GSPR 4 priority</th>
<th>Implemented in</th>
<th>Verification</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">RCM-01</span></td>
<td><span class="id">HAZ-01</span></td>
<td>Amplifier gain fixed at its lowest setting. At full digital scale the level is at most 75 dB(A) at 10 cm.</td>
<td>1. Safe design</td>
<td>Hardware (<span class="id">AL-ADR-0002</span>)</td>
<td><span class="id">VER-HW-003</span></td>
</tr>
<tr>
<td><span class="id">RCM-02</span></td>
<td><span class="id">HAZ-01</span></td>
<td>Software volume cap. Kept for comfort and not credited as a risk control.</td>
<td>Not credited</td>
<td><span class="id">SI-04</span></td>
<td><span class="id">VER-SW-014</span></td>
</tr>
<tr>
<td><span class="id">RCM-03</span></td>
<td><span class="id">HAZ-02</span></td>
<td>The flash limiter holds the last compliant frame</td>
<td>2. Protective measure</td>
<td><span class="id">SI-07</span></td>
<td><span class="id">VER-SW-030</span>, <span class="id">VER-SW-031</span></td>
</tr>
<tr>
<td><span class="id">RCM-04</span></td>
<td><span class="id">HAZ-02</span></td>
<td>Only the Output Guard can access the display</td>
<td>2. Protective measure</td>
<td><span class="id">SI-07</span>, OS configuration</td>
<td><span class="id">VER-SW-032</span></td>
</tr>
<tr>
<td><span class="id">RCM-05</span></td>
<td><span class="id">HAZ-03</span></td>
<td>The score stays hidden until a sound has 10 attempts, and the attempt count is always shown</td>
<td>2. Protective measure</td>
<td><span class="id">SI-05</span></td>
<td><span class="id">VER-SW-040</span></td>
</tr>
<tr>
<td><span class="id">RCM-06</span></td>
<td><span class="id">HAZ-03</span></td>
<td>The instructions tell the therapist to listen to sample recordings before moving on</td>
<td>3. Information for safety</td>
<td>Instructions for use §7</td>
<td>Usability validation <span class="id">UV-002</span></td>
</tr>
</tbody>
</table>
<h3>6.8 Security and data protection</h3>
<ul>
<li><strong>No network.</strong> <code>dtoverlay=disable-wifi</code> and <code>dtoverlay=disable-bt</code> turn off the radios, and the release image has no SSH server (<span class="id">AL-ADR-0003</span>).</li>
<li><strong>Health data.</strong> Recordings of a child's speech in therapy are health data under GDPR Art. 9.
They stay on the device and are deleted after 14 days.
The therapist reads scores on the device, in a menu opened with a button code.</li>
<li><strong>Updates.</strong> Updates arrive as signed packages on a USB stick. The updater checks the signature before it installs anything.</li>
<li><strong>Residual risk.</strong> The Raspberry Pi 3 has no secure boot, so someone with physical access can replace the SD card.
Security risk assessment <span class="id">SRA-001</span> accepts this risk: the device is offline and holds at most 14 days of recordings.</li>
<li><strong>SBOM.</strong> Every build produces a CycloneDX software bill of materials that lists all SOUP items.</li>
</ul>
<h2>7. Consequences</h2>
<p><strong>Positive</strong></p>
<ul>
<li>Class C rigor applies to about 400 lines instead of 2,500. Changes to lessons, audio, or scoring need class B evidence only.</li>
<li>The boot splash no longer writes to the display. Each safety-relevant output has one owner.</li>
<li><span class="id">HAZ-01</span> is controlled by design, so the software volume cap is only a comfort feature.</li>
<li>FFmpeg leaves the device, which shortens the SOUP list.</li>
</ul>
<p><strong>Negative</strong></p>
<ul>
<li>There are two processes and a frame protocol to design, test, and maintain.</li>
<li>Each frame needs one more copy and analysis, up to 10 ms.</li>
<li>The Linux kernel, systemd, and CPython become SOUP in a class C path. Their anomaly lists need review for the life of the device.</li>
<li>Therapists must have the device in hand to read scores. There is no remote report.</li>
</ul>
<p><strong>Regulatory and quality</strong></p>
<ul>
<li>Any change to <span class="id">SI-07</span> needs a class C impact analysis and regression testing (IEC 62304 §6.2, §7.4).</li>
<li>The risk management file <span class="id">RMF-001</span> and the SOUP list must reference <span class="id">RCM-03</span>, <span class="id">RCM-04</span>, and <span class="id">SOUP-01</span> to <span class="id">SOUP-08</span>.</li>
<li>If the score feature is removed, reassess the classification. Alfa-L would become class I.</li>
</ul>
<h2>8. Confirmation</h2>
<p>The decision is confirmed when these records exist and pass.
All records and results in this table are fictional. No review or test took place.</p>
<table>
<thead>
<tr>
<th>Record</th>
<th>Evidence</th>
<th>Status</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">REV-2026-031</span></td>
<td>Architecture review (IEC 62304 §5.3.6) by the Software Architect, Risk Manager, QA, Regulatory Affairs, and Security Lead</td>
<td>Passed 2026-10-09 (fictional); two minor findings closed</td>
</tr>
<tr>
<td><span class="id">VER-HW-003</span></td>
<td>Sound level measured at 10 cm with a full-scale test tone</td>
<td>Passed 2026-10-06 (fictional)</td>
</tr>
<tr>
<td><span class="id">VER-SW-030</span></td>
<td>Recorded frame sequences, including all 32 letter lessons, analysed at the Guard output</td>
<td>Planned</td>
</tr>
<tr>
<td><span class="id">VER-SW-031</span></td>
<td>Fault injection: the Practice App sends full-screen black and white at 20 frames per second. A photodiode on the panel counts at most three flashes per second.</td>
<td>Planned</td>
</tr>
<tr>
<td><span class="id">VER-SW-032</span></td>
<td>As <code>alfa-app</code>, opening the SPI and GPIO devices fails with a permission error</td>
<td>Planned</td>
</tr>
<tr>
<td><span class="id">VER-SW-033</span></td>
<td>Guard latency over 10,000 frames on a Raspberry Pi 3</td>
<td>Planned</td>
</tr>
</tbody>
</table>
<h2>9. Follow-up actions</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Action</th>
<th>Owner</th>
<th>Due</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">ACT-01</span></td>
<td>Move the ST7789 driver and the boot image into the Output Guard; remove display access from the Practice App</td>
<td>Software Lead</td>
<td>2026-11-06</td>
</tr>
<tr>
<td><span class="id">ACT-02</span></td>
<td>Add the users, udev rules, and systemd limits to the release image</td>
<td>DevOps Engineer</td>
<td>2026-11-06</td>
</tr>
<tr>
<td><span class="id">ACT-03</span></td>
<td>Update <span class="id">RMF-001</span> and the SOUP list with this decision's measures and SOUP items</td>
<td>Risk Manager</td>
<td>2026-10-23</td>
</tr>
<tr>
<td><span class="id">ACT-04</span></td>
<td>Add the kernel, systemd, and CPython anomaly review to the release checklist</td>
<td>QA Engineer</td>
<td>2026-10-30</td>
</tr>
<tr>
<td><span class="id">ACT-05</span></td>
<td>Present the segregation argument to the notified body before submission</td>
<td>Regulatory Affairs</td>
<td>2026-12-04</td>
</tr>
</tbody>
</table>
<h2>10. When to revisit</h2>
<p>Write a new ADR that supersedes this one if any of these happens:</p>
<ul>
<li>The notified body does not accept process segregation. The fallback is option C.</li>
<li>The display, its interface, or the frame rate changes.</li>
<li><span class="id">VER-SW-033</span> measures more than 10 ms per frame.</li>
<li>The score feature is removed and the classification changes.</li>
</ul>
<h2>11. Related decisions</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Title</th>
<th>Status</th>
<th>Relation to this decision</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">AL-ADR-0002</span></td>
<td>Limit the maximum sound pressure in hardware</td>
<td>Accepted</td>
<td>Keeps <span class="id">HAZ-01</span> from raising the Practice App's class</td>
</tr>
<tr>
<td><span class="id">AL-ADR-0003</span></td>
<td>Offline device; therapists read results on the device</td>
<td>Accepted</td>
<td>Removes the network from the attack surface</td>
</tr>
<tr>
<td><span class="id">AL-ADR-0004</span></td>
<td>Score speech with deterministic signal processing, not a trained model</td>
<td>Proposed</td>
<td>A trained model could make <span class="id">SI-05</span> a high-risk AI system under Regulation (EU) 2024/1689</td>
</tr>
</tbody>
</table>
<h2>12. References</h2>
<ul>
<li>Regulation (EU) 2017/745 (MDR): Annex I GSPR 4, 17.1, 17.2, and 17.4; Annex II; Annex VIII Rules 11 and 13; Annex IX</li>
<li>MDCG 2019-11, qualification and classification of software</li>
<li>MDCG 2019-16, cybersecurity for medical devices</li>
<li>IEC 62304:2006+A1:2015, medical device software life cycle processes</li>
<li>EN ISO 14971:2019+A11:2021, application of risk management to medical devices</li>
<li>EN 62366-1:2015+A1:2020, application of usability engineering to medical devices</li>
<li>EN ISO 13485:2016+A11:2021, quality management systems</li>
<li>IEC 81001-5-1:2021, security for health software</li>
<li>Recommendation ITU-R BT.1702, reducing the risk of photosensitive epilepsy from television images</li>
<li>Regulation (EU) 2016/679 (GDPR), Art. 9 and Art. 25</li>
<li>Internal: <span class="id">IP-001</span>, <span class="id">PRS-001</span>, <span class="id">SDP-001</span>, <span class="id">SRS-001</span>, <span class="id">RMF-001</span>, <span class="id">SRA-001</span>, <span class="id">SOUP-001</span></li>
</ul>
<h2>13. Approval</h2>
<p>In a real quality system, these people sign in the electronic QMS under a document control procedure.
This example shows the format only. Nobody signed anything.</p>
<table>
<thead>
<tr>
<th>Role</th>
<th>Responsibility</th>
<th>Signature</th>
<th>Date</th>
</tr>
</thead>
<tbody>
<tr>
<td>Software Architect</td>
<td>Author</td>
<td>None: example only</td>
<td>—</td>
</tr>
<tr>
<td>Risk Manager</td>
<td>Reviewer: risk controls and software safety classes</td>
<td>None: example only</td>
<td>—</td>
</tr>
<tr>
<td>Regulatory Affairs</td>
<td>Reviewer: MDR classification and technical documentation</td>
<td>None: example only</td>
<td>—</td>
</tr>
<tr>
<td>Security Lead</td>
<td>Reviewer: security and data protection</td>
<td>None: example only</td>
<td>—</td>
</tr>
<tr>
<td>Quality Assurance</td>
<td>Approver: document control</td>
<td>None: example only</td>
<td>—</td>
</tr>
</tbody>
</table>
<h2>14. Revision history</h2>
<p>This history is fictional and shows the format only.</p>
<table>
<thead>
<tr>
<th>Version</th>
<th>Date</th>
<th>Change</th>
<th>Author</th>
</tr>
</thead>
<tbody>
<tr>
<td>0.1</td>
<td>2026-09-22</td>
<td>First draft with options A–D</td>
<td>Software Architect</td>
</tr>
<tr>
<td>0.2</td>
<td>2026-10-02</td>
<td>Risk review: added <span class="id">RCM-04</span> and the CPU starvation case</td>
<td>Software Architect</td>
</tr>
<tr>
<td>0.3</td>
<td>2026-10-09</td>
<td>Closed the two minor findings from <span class="id">REV-2026-031</span></td>
<td>Software Architect</td>
</tr>
<tr>
<td>1.0</td>
<td>2026-10-12</td>
<td>Approved</td>
<td>Software Architect</td>
</tr>
</tbody>
</table>
<h2>Glossary</h2>
<table>
<thead>
<tr>
<th>Term</th>
<th>Meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td>GSPR</td>
<td>General safety and performance requirement, MDR Annex I</td>
</tr>
<tr>
<td>Notified body</td>
<td>Organisation designated to assess the conformity of most devices above class I</td>
</tr>
<tr>
<td>RCM</td>
<td>Risk control measure (ISO 14971)</td>
</tr>
<tr>
<td>Segregation</td>
<td>Separation that stops one software item from affecting another (IEC 62304 §5.3.5)</td>
</tr>
<tr>
<td>Software item</td>
<td>Any identifiable part of the software. A unit is an item that is not divided further.</td>
</tr>
<tr>
<td>Software safety class</td>
<td>A, B, or C, set by the worst harm the software can contribute to after external risk controls (IEC 62304 §4.3)</td>
</tr>
<tr>
<td>SOUP</td>
<td>Software of unknown provenance: third-party software not developed under this quality system (IEC 62304)</td>
</tr>
</tbody>
</table>
<h2>End of teaching example</h2>
<p><strong>TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY</strong></p>
<p>Alfa-L and every record in this document are fictional.
Alfa is an open-source hobby project with no medical purpose and no regulatory licence, certificate, or approval.
This document is not advice and is provided &quot;as is&quot;, without warranty of any kind.</p>
`,r=`<h1><span class="id">AL-ADR-0001</span>: Wydzielenie wyjścia na wyświetlacz do procesu Output Guard klasy C</h1>
<blockquote>
<p><strong>TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY</strong></p>
<p>To jest fikcyjny, opracowany przykład rejestru decyzji architektonicznej.
Nie jest prawdziwym zapisem, nie opisuje prawdziwego wyrobu i nie jest dowodem zgodności z żadnym przepisem ani normą.</p>
</blockquote>
<h2>Przeczytaj to najpierw (Read this first)</h2>
<h3>Cel tego dokumentu</h3>
<p>Ten dokument uczy, jak napisać rejestr decyzji architektonicznej (ADR) dla oprogramowania w wyrobie medycznym.
Pokazuje sekcje, które rozporządzenie (UE) 2017/745 (MDR), IEC 62304 i ISO 14971 dodają do zwykłego ADR oprogramowania.
Służy do szkoleń, warsztatów i samodzielnej nauki.</p>
<h3>O Alfie i fikcyjnym Alfa-L</h3>
<ul>
<li>Alfa to hobbystyczny projekt open source: małe radio offline, które pomaga dzieciom uczyć się liter.</li>
<li>Alfa is not a medical device. Alfa nie jest wyrobem medycznym. Nie ma medycznego przeznaczenia i nie zgłasza żadnych twierdzeń medycznych.
Nie jest przeznaczona do diagnozowania, zapobiegania, monitorowania, leczenia ani łagodzenia jakiejkolwiek choroby, urazu lub niepełnosprawności.</li>
<li>Alfa nie ma żadnej licencji, certyfikatu, oznakowania CE, rejestracji, oceny jednostki notyfikowanej ani zatwierdzenia regulacyjnego.</li>
<li>Alfa-L does not exist. Alfa-L nie istnieje. Wymyślono je na potrzeby tego ćwiczenia.
Nikt nie wytwarza, nie sprzedaje, nie dostarcza, nie wprowadza do obrotu ani nie oddaje do użytku żadnego urządzenia opisanego tutaj.</li>
<li>Oryginalny kod Alfy i dokumentacja techniczna, w tym ten przykład, są opublikowane na licencji MIT.
Licencja udostępnia je „tak jak są”, bez jakiejkolwiek gwarancji. Zobacz <a href="https://github.com/hvitis/Alfa/blob/main/LICENSE">LICENSE</a>.</li>
<li>Prawdziwa architektura Alfy jest w <a href="adr.md">ADR 0001</a>.</li>
</ul>
<h3>Co jest fikcyjne</h3>
<ul>
<li>Wszystko o Alfa-L jest wymyślone: przeznaczenie, klasyfikacja, zagrożenia, wymagania, wyniki badań, identyfikatory dokumentów, role, daty i zapisy.</li>
<li>Nie odbył się żaden przegląd, test ani zatwierdzenie. Tabele zatwierdzenia i rewizji pokazują tylko format. Nobody signed anything.</li>
<li>Typy organizacji, takie jak „jednostka notyfikowana”, są ogólne. Żadna prawdziwa organizacja nie recenzowała ani nie poparła tego dokumentu.</li>
</ul>
<h3>Granice użycia</h3>
<ul>
<li>Ten dokument nie jest poradą prawną, regulacyjną, kliniczną ani medyczną.</li>
<li>Streszczenia przepisów i norm pochodzą ze źródeł publicznych. Mogą być niepełne, nieaktualne albo błędne. Sprawdź teksty urzędowe.</li>
<li>Nie składaj tego dokumentu ani żadnej jego części jako prawdziwej dokumentacji technicznej.
Nie powołuj się na niego jako na dowód, że jakiekolwiek urządzenie, w tym Alfa, jest bezpieczne, skuteczne albo zgodne z jakimkolwiek wymaganiem.</li>
<li>Prawdziwy ADR potrzebuje własnego przeznaczenia, analizy ryzyka, dowodów weryfikacji i przeglądu przez osoby kompetentne.</li>
<li>Jeśli kopiujesz albo adaptujesz ten przykład, zachowaj tę informację i oznaczenie „TEACHING MATERIAL”.</li>
</ul>
<h3>Jak czytać ten przykład</h3>
<table>
<thead>
<tr>
<th>Sekcja</th>
<th>Czego uczy</th>
</tr>
</thead>
<tbody>
<tr>
<td>Kontrola dokumentu</td>
<td>Każdy zapis projektowy ma identyfikator, wersję, status, właściciela i powiązania z innymi zapisami (kontrola dokumentów ISO 13485).</td>
</tr>
<tr>
<td>1. Podsumowanie decyzji</td>
<td>Najpierw zapisz decyzję, w kilku zdaniach.</td>
</tr>
<tr>
<td>2. Kontekst</td>
<td>Opisz przeznaczenie, klasyfikację i problem, który wymusza decyzję.</td>
</tr>
<tr>
<td>3–4. Czynniki i wymagania</td>
<td>Każdy czynnik i wymaganie powiąż ze źródłem. Każde wymaganie zapisz jako jedno sprawdzalne zdanie „shall” / „musi”.</td>
</tr>
<tr>
<td>5. Rozważane opcje</td>
<td>Porównaj realne alternatywy z czynnikami i zapisz, dlaczego każda przegrała.</td>
</tr>
<tr>
<td>6. Wynik decyzji</td>
<td>Dodaj treść wyrobu medycznego: elementy oprogramowania i klasy bezpieczeństwa, interfejsy, segregację, SOUP, środki kontroli ryzyka i bezpieczeństwo.</td>
</tr>
<tr>
<td>7–10. Od konsekwencji do powodów ponownego otwarcia</td>
<td>Zapisz koszty, sposób weryfikacji decyzji, kto co robi dalej i co otworzyłoby decyzję na nowo.</td>
</tr>
<tr>
<td>11–14. Od powiązanych decyzji do historii rewizji</td>
<td>Połącz dziennik decyzji, odniesienia, zatwierdzenia i zmiany.</td>
</tr>
</tbody>
</table>
<h2>Kontrola dokumentu</h2>
<table>
<thead>
<tr>
<th>Pole</th>
<th>Wartość</th>
</tr>
</thead>
<tbody>
<tr>
<td>Klasyfikacja dokumentu</td>
<td>TEACHING MATERIAL. To nie jest wyrób medyczny. Wyłącznie do celów edukacyjnych.</td>
</tr>
<tr>
<td>Identyfikator dokumentu</td>
<td><span class="id">AL-ADR-0001</span>, wersja 1.0 (fikcja)</td>
</tr>
<tr>
<td>Status</td>
<td>Zaakceptowany (fikcja)</td>
</tr>
<tr>
<td>Data obowiązywania</td>
<td>2026-10-12 (fikcja)</td>
</tr>
<tr>
<td>Wyrób</td>
<td>Domowe urządzenie Alfa-L do ćwiczenia mowy, oprogramowanie 1.x</td>
</tr>
<tr>
<td>Właściciel</td>
<td>Architekt oprogramowania</td>
</tr>
<tr>
<td>Typ dokumentu</td>
<td>Wynik projektowania i rozwoju (ISO 13485 §7.3.4), część architektury oprogramowania (IEC 62304 §5.3)</td>
</tr>
<tr>
<td>Dokumentacja techniczna</td>
<td>MDR załącznik II §3 (informacje o projekcie) i §6.1(b) (weryfikacja i walidacja oprogramowania)</td>
</tr>
<tr>
<td>Zastępuje</td>
<td>Alfa ADR 0001, wyłącznie dla linii wyrobu Alfa-L</td>
</tr>
<tr>
<td>Zależy od</td>
<td><span class="id">AL-ADR-0002</span>, <span class="id">AL-ADR-0003</span></td>
</tr>
</tbody>
</table>
<h2>1. Podsumowanie decyzji</h2>
<p>Alfa-L działa jako dwa procesy.
<strong>Output Guard</strong> jest jedynym procesem, który może pisać na wyświetlacz, i sprawdza każdą klatkę względem limitu błysków.
<strong>Practice App</strong> zachowuje istniejący kod Alfy i nie ma dostępu do sprzętu wyświetlacza.
Ogranicza to pracę klasy C według IEC 62304 do jednego małego elementu oprogramowania zamiast całej aplikacji.</p>
<h2>2. Kontekst</h2>
<h3>2.1 Przeznaczenie i użytkownicy</h3>
<p>Alfa-L wspiera domowe ćwiczenie polskich dźwięków mowy przez dzieci w wieku od 3 do 7 lat ze zdiagnozowanym zaburzeniem dźwięków mowy.
Logopeda wybiera ćwiczenia i kieruje terapią (przeznaczenie <span class="id">IP-001</span>).
Alfa-L nagrywa próby dziecka i oblicza wynik ćwiczenia dla każdego dźwięku.
Terapeuta używa wyniku, żeby zdecydować, kiedy przejść do następnego dźwięku.
Alfa-L nie diagnozuje.</p>
<table>
<thead>
<tr>
<th>Grupa użytkowników</th>
<th>Profil</th>
<th>Główne zadania</th>
</tr>
</thead>
<tbody>
<tr>
<td>Dziecko</td>
<td>3–7 lat, nie czyta, może trzymać albo miażdżyć przyciski</td>
<td>Ćwiczy dźwięki pięcioma przyciskami</td>
</tr>
<tr>
<td>Opiekun</td>
<td>Osoba bez wykształcenia medycznego</td>
<td>Ładuje urządzenie, uruchamia ćwiczenie, zgłasza problemy</td>
</tr>
<tr>
<td>Terapeuta</td>
<td>Logopeda</td>
<td>Ustawia plan ćwiczeń, czyta wyniki na urządzeniu</td>
</tr>
</tbody>
</table>
<h3>2.2 Klasyfikacja regulacyjna</h3>
<ul>
<li><strong>MDR klasa IIa</strong> według załącznika VIII, reguła 11: wynik ćwiczenia jest informacją używaną do decyzji terapeutycznych.
Błędna decyzja opóźnia terapię, ale nie może spowodować poważnego pogorszenia stanu zdrowia, więc klasy IIb i III nie mają zastosowania.</li>
<li>Bez wyniku Alfa-L byłoby klasą I według reguły 13. Decyzja produktowa <span class="id">PD-003</span> zostawia wynik.</li>
<li>Ocena zgodności przebiega według załącznika IX z udziałem jednostki notyfikowanej.</li>
<li>Klasa systemu oprogramowania według IEC 62304 to C z powodu <span class="id">HAZ-02</span> (sekcja 6.3).</li>
</ul>
<h3>2.3 Problem</h3>
<p>Konsumencka Alfa to jeden proces Pythona, około 2500 linii.
Czyta przyciski, odtwarza dźwięk, renderuje lekcje i animacje oraz steruje wyświetlaczem ST7789.
Ekran startowy to drugi program, który też pisze na wyświetlacz.</p>
<p>Wyświetlacz pokazuje animacje do 20 klatek na sekundę.
Wada w dowolnym miejscu procesu mogłaby sprawić, że ekran błyska, i przyczynić się do <span class="id">HAZ-02</span>, napadu związanego z nadwrażliwością na światło.
Napad jest poważnym urazem, więc oprogramowanie, które może go spowodować, jest klasy C.
Obecna grafika zostaje wyraźnie poniżej limitu błysków. Zagrożenie pochodzi z wad, nie z treści.</p>
<p>IEC 62304 §4.3 pozwala nadać elementowi oprogramowania klasę niższą niż system tylko wtedy, gdy wytwórca udokumentuje, jak element jest segregowany.
Nic nie segreguje elementów wewnątrz jednego procesu, więc dziś każda linia byłaby klasy C.
Klasa C dodaje szczegółowy projekt każdej jednostki i interfejsu (§5.4.2–§5.4.4) oraz dodatkowe kryteria odbioru jednostek (§5.5.4).</p>
<h2>3. Czynniki decyzji</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Czynnik</th>
<th>Źródło</th>
</tr>
</thead>
<tbody>
<tr>
<td>DD-1</td>
<td>Kontrolować <span class="id">HAZ-02</span> środkiem, którego skuteczność da się zweryfikować, także przy pojedynczym uszkodzeniu</td>
<td>ISO 14971 §7.1, §7.2; MDR załącznik I, GSPR 4 i 17.1</td>
</tr>
<tr>
<td>DD-2</td>
<td>Utrzymać zakres klasy C tak mały, jak to możliwe</td>
<td>IEC 62304 §4.3, §5.3.5</td>
</tr>
<tr>
<td>DD-3</td>
<td>Ponownie użyć istniejącego kodu Alfy i jego testów</td>
<td>Plan rozwoju oprogramowania <span class="id">SDP-001</span></td>
</tr>
<tr>
<td>DD-4</td>
<td>Zostać offline, z krótką listą SOUP i małą powierzchnią ataku</td>
<td><span class="id">AL-ADR-0003</span>; GSPR 17.2, 17.4; IEC 81001-5-1</td>
</tr>
<tr>
<td>DD-5</td>
<td>Odpowiedzieć na naciśnięcie dziecka w ciągu 150 ms</td>
<td><span class="id">SRS-021</span>; specyfikacja użycia IEC 62366-1</td>
</tr>
<tr>
<td>DD-6</td>
<td>Zostać przy zwalidowanym sprzęcie Raspberry Pi 3 i jego koszcie jednostkowym</td>
<td>Wymagania wyrobu <span class="id">PRS-001</span></td>
</tr>
</tbody>
</table>
<h2>4. Wymagania w zakresie</h2>
<p>Każde wymaganie opisuje jedną sprawdzalną właściwość, wskazuje źródło i nazywa weryfikację.</p>
<table>
<thead>
<tr>
<th>ID</th>
<th>Wymaganie</th>
<th>Ślad</th>
<th>Weryfikacja</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SRS-010</span></td>
<td>Oprogramowanie nie może włączyć żadnego interfejsu sieciowego.</td>
<td><span class="id">AL-ADR-0003</span>, <span class="id">SEC-01</span></td>
<td>Przegląd i test <span class="id">VER-SYS-010</span></td>
</tr>
<tr>
<td><span class="id">SRS-021</span></td>
<td>Urządzenie musi dać słyszalną albo widoczną informację zwrotną w ciągu 150 ms od naciśnięcia przycisku, na 95. percentylu.</td>
<td><span class="id">UN-004</span>, DD-5</td>
<td>Test <span class="id">VER-SYS-021</span></td>
</tr>
<tr>
<td><span class="id">SRS-030</span></td>
<td>Wyświetlacz nie może pokazać więcej niż trzech błysków w dowolnej jednosekundowej chwili. Błysk to para przeciwnych zmian luminancji o co najmniej 20 cd/m², gdy ciemniejszy obraz jest poniżej 160 cd/m², albo przejście do nasyconej czerwieni lub z niej. Liczą się tylko błyski obejmujące więcej niż 25% ekranu (ITU-R BT.1702).</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-03</span></td>
<td>Test <span class="id">VER-SW-030</span></td>
</tr>
<tr>
<td><span class="id">SRS-031</span></td>
<td>Gdy nowa klatka przekroczyłaby limit <span class="id">SRS-030</span>, Output Guard musi zostawić na wyświetlaczu ostatnią zgodną klatkę.</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-03</span></td>
<td>Test <span class="id">VER-SW-031</span></td>
</tr>
<tr>
<td><span class="id">SRS-032</span></td>
<td>Tylko Output Guard może mieć dostęp do urządzenia SPI wyświetlacza i linii sterujących wyświetlaczem.</td>
<td><span class="id">HAZ-02</span>, <span class="id">RCM-04</span></td>
<td>Przegląd i test <span class="id">VER-SW-032</span></td>
</tr>
<tr>
<td><span class="id">SRS-033</span></td>
<td>Output Guard nie może dodać więcej niż 10 ms na klatkę, na 95. percentylu.</td>
<td><span class="id">SRS-021</span></td>
<td>Test <span class="id">VER-SW-033</span></td>
</tr>
</tbody>
</table>
<h2>5. Rozważane opcje</h2>
<ul>
<li><strong>A. Jeden proces.</strong> Zostawić konsumencką Alfę bez zmian i dodać ogranicznik błysków w jej wnętrzu.</li>
<li><strong>B. Proces Output Guard.</strong> Przenieść sterownik wyświetlacza i ogranicznik błysków do osobnego procesu, który sam jest właścicielem wyświetlacza.</li>
<li><strong>C. Koprocesor RP2040.</strong> Wstawić Raspberry Pi Pico między Pi a wyświetlacz. Jego firmware wymusza limit.</li>
<li><strong>D. Aplikacja na tablet.</strong> Zbudować Alfa-L jako aplikację na gotowy tablet.</li>
</ul>
<table>
<thead>
<tr>
<th>Czynnik</th>
<th>A. Jeden proces</th>
<th>B. Proces Output Guard</th>
<th>C. Koprocesor RP2040</th>
<th>D. Aplikacja na tablet</th>
</tr>
</thead>
<tbody>
<tr>
<td>DD-1 kontrola <span class="id">HAZ-02</span></td>
<td>Słaba: ogranicznik dzieli pamięć z resztą kodu</td>
<td>Dobra: system operacyjny wymusza granicę</td>
<td>Najlepsza: osobny sprzęt</td>
<td>Słaba: system operacyjny może rysować nad aplikacją</td>
</tr>
<tr>
<td>DD-2 zakres klasy C</td>
<td>Cała aplikacja, około 2500 linii</td>
<td>Output Guard, szacunek 400 linii</td>
<td>Nowe firmware, szacunek 600 linii</td>
<td>Cała aplikacja</td>
</tr>
<tr>
<td>DD-3 ponowne użycie</td>
<td>Pełne</td>
<td>Wysokie: rusza się tylko sterownik wyświetlacza</td>
<td>Średnie: nowe firmware i protokół</td>
<td>Żadne</td>
</tr>
<tr>
<td>DD-4 offline, krótka lista SOUP</td>
<td>Dobre</td>
<td>Dobre</td>
<td>Dobre, dodaje Pico SDK</td>
<td>Słabe: sieć, aktualizacje ze sklepu, duży system</td>
</tr>
<tr>
<td>DD-5 odpowiedź 150 ms</td>
<td>Dobra</td>
<td>Dobra, poniżej 10 ms dodane</td>
<td>Dobra</td>
<td>Dobra</td>
</tr>
<tr>
<td>DD-6 sprzęt i koszt</td>
<td>Bez zmian</td>
<td>Bez zmian</td>
<td>Dodatkowa płytka i drugi proces wydania firmware</td>
<td>Nowa platforma</td>
</tr>
</tbody>
</table>
<p>Dlaczego pozostałe opcje przegrały:</p>
<ul>
<li><strong>A</strong> nie spełnia DD-2. Każda zmiana gdziekolwiek w aplikacji wymagałaby dowodów klasy C.</li>
<li><strong>C</strong> daje najmocniejszą kontrolę, ale dodaje drugi wyrób krytyczny dla bezpieczeństwa, z własnym łańcuchem narzędzi i procesem wydania. To wariant zapasowy, jeśli jednostka notyfikowana odrzuci segregację procesów (sekcja 10).</li>
<li><strong>D</strong> zależy od systemu operacyjnego, którego wytwórca nie kontroluje, i od aktualizacji sieciowych. Po podłączeniu słuchawek sprzętowy limit dźwięku z <span class="id">AL-ADR-0002</span> przestaje obowiązywać.</li>
</ul>
<h2>6. Wynik decyzji</h2>
<p>Wybrana opcja: <strong>B. Proces Output Guard</strong>.
To jedyna opcja, która kontroluje <span class="id">HAZ-02</span> za granicą wymuszoną przez system operacyjny, ogranicza pracę klasy C do jednego małego elementu i ponownie używa istniejącego kodu.</p>
<h3>6.1 Architektura</h3>
<pre><code class="language-mermaid">flowchart TB
  subgraph APP[&quot;Practice App · class B&quot;]
    IN[&quot;SI-02 Input&quot;] --&gt; CTRL[&quot;SI-01 Control and session&quot;]
    LES[&quot;SI-03 Exercises and lessons&quot;] --&gt; CTRL
    CTRL --&gt; AUD[&quot;SI-04 Audio&quot;]
    CTRL --&gt; REC[&quot;SI-05 Recording and scoring&quot;]
    REC --&gt; STORE[&quot;SI-06 Data store&quot;]
  end
  subgraph GUARD[&quot;Output Guard · class C&quot;]
    VAL[&quot;Validate and compose&quot;] --&gt; LIM[&quot;Flash limiter&quot;] --&gt; DRV[&quot;ST7789 driver&quot;]
  end
  KEY[&quot;Keypad → ADS1115&quot;] -- &quot;IF-04 I²C&quot; --&gt; IN
  CTRL -- &quot;IF-01 frames · Unix socket&quot; --&gt; VAL
  AUD -- &quot;IF-05 I²S&quot; --&gt; AMP[&quot;MAX98357A · gain fixed in hardware&quot;]
  MIC[&quot;USB microphone&quot;] -- &quot;IF-06&quot; --&gt; REC
  DRV -- &quot;IF-03 SPI · exclusive&quot; --&gt; LCD[&quot;ST7789 display&quot;]
</code></pre>
<h3>6.2 Elementy oprogramowania</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Element oprogramowania</th>
<th>Odpowiedzialność</th>
<th>Pochodzenie w konsumenckiej Alfie</th>
<th>Proces</th>
<th>Klasa</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SI-01</span></td>
<td>Sterowanie i sesja</td>
<td>Pętla sterowania, akcje przycisków, stan ekranu</td>
<td><code>app/app.py</code>, <code>app/player.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-02</span></td>
<td>Wejście</td>
<td>Odczyt ADC, kalibracja, <code>Debouncer</code>, <code>PressGuard</code></td>
<td><code>app/buttons.py</code>, <code>ADS1x15</code> w <code>app/hardware.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-03</span></td>
<td>Ćwiczenia i lekcje</td>
<td>Lekcje liter, animacje, przygotowane media</td>
<td><code>app/letter_lesson.py</code>, <code>app/letter_paths.py</code>, <code>app/frames.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-04</span></td>
<td>Dźwięk</td>
<td>Odtwarzanie i programowy limit głośności</td>
<td><code>app/audio.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-05</span></td>
<td>Nagranie i wynik</td>
<td>Nagrywa próby i liczy wynik dla każdego dźwięku</td>
<td>Nowe (<span class="id">AL-ADR-0004</span>)</td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-06</span></td>
<td>Magazyn danych</td>
<td>Dziennik ćwiczeń, nagrania, usunięcie po 14 dniach</td>
<td>Nowe</td>
<td>Practice App</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SI-07</span></td>
<td>Output Guard</td>
<td>Walidacja klatki, ogranicznik błysków, sterownik ST7789, obraz startowy, własny watchdog</td>
<td><code>ST7789</code> w <code>app/hardware.py</code> i <code>app/splash.py</code>; zastępuje <code>app/display_handoff.py</code>; ogranicznik jest nowy</td>
<td>Output Guard</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SI-08</span></td>
<td>Nadzór aplikacji</td>
<td>Gotowość i watchdog Practice App</td>
<td><code>app/service.py</code></td>
<td>Practice App</td>
<td>B</td>
</tr>
</tbody>
</table>
<p>Elementy w Practice App dziedziczą klasę B.
Żaden nie jest klasy A, bo nic nie segreguje elementów wewnątrz jednego procesu Pythona.
<span class="id">HAZ-03</span> czyni Practice App klasą B.
<span class="id">HAZ-01</span> jej nie podnosi, bo <span class="id">AL-ADR-0002</span> ogranicza ciśnienie akustyczne w sprzęcie.</p>
<h3>6.3 Klasyfikacja bezpieczeństwa oprogramowania</h3>
<table>
<thead>
<tr>
<th>Zagrożenie</th>
<th>Szkoda</th>
<th>Ciężkość</th>
<th>Udział oprogramowania</th>
<th>Zewnętrzna kontrola ryzyka</th>
<th>Skutek dla klas</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">HAZ-01</span> Nadmierne ciśnienie akustyczne</td>
<td>Ubytek słuchu wywołany hałasem</td>
<td>Poważna</td>
<td>Practice App wysyła próbki dźwięku</td>
<td><span class="id">RCM-01</span>, sprzętowy limit wzmocnienia</td>
<td>Brak: przy pełnej skali cyfrowej poziom zostaje akceptowalny</td>
</tr>
<tr>
<td><span class="id">HAZ-02</span> Błyskające obrazy</td>
<td>Napad przy nadwrażliwości na światło</td>
<td>Poważna</td>
<td>Każdy kod, który tworzy klatki</td>
<td>Brak</td>
<td><span class="id">SI-07</span> jest klasy C; pozostałe elementy są od niego odseparowane</td>
</tr>
<tr>
<td><span class="id">HAZ-03</span> Błędny wynik ćwiczenia</td>
<td>Opóźniona albo przedłużona terapia</td>
<td>Niepoważna</td>
<td><span class="id">SI-05</span></td>
<td><span class="id">RCM-06</span>, przegląd terapeuty (częściowy)</td>
<td>Practice App jest klasy B</td>
</tr>
<tr>
<td><span class="id">HAZ-04</span> Urządzenie przestaje odpowiadać</td>
<td>Pominięta sesja ćwiczeń</td>
<td>Brak urazu</td>
<td>Dowolny element</td>
<td>Niepotrzebna</td>
<td>Brak</td>
</tr>
</tbody>
</table>
<h3>6.4 Interfejsy</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Interfejs</th>
<th>Między</th>
<th>Mechanizm</th>
<th>Kontrakt</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">IF-01</span></td>
<td>Przekazanie klatki</td>
<td>Practice App → Output Guard</td>
<td>Gniazdo domeny uniksowej <code>/run/alfa/frame.sock</code>, <code>SOCK_SEQPACKET</code></td>
<td>Numer sekwencji, region (x, y, szerokość, wysokość), piksele RGB565, <span class="id">CRC-32</span>. Guard odrzuca zniekształcone komunikaty.</td>
</tr>
<tr>
<td><span class="id">IF-02</span></td>
<td>Status klatki</td>
<td>Output Guard → Practice App</td>
<td>To samo gniazdo</td>
<td><code>SHOWN</code>, <code>HELD</code> albo <code>REJECTED</code> dla każdego numeru sekwencji</td>
</tr>
<tr>
<td><span class="id">IF-03</span></td>
<td>Magistrala wyświetlacza</td>
<td>Output Guard → ST7789</td>
<td>SPI0, GPIO 24, 25 i 27</td>
<td>Tylko Output Guard</td>
</tr>
<tr>
<td><span class="id">IF-04</span></td>
<td>Przyciski</td>
<td>Klawiatura → Practice App</td>
<td>ADS1115 na magistrali I²C 1</td>
<td>Bez zmian</td>
</tr>
<tr>
<td><span class="id">IF-05</span></td>
<td>Głośnik</td>
<td>Practice App → MAX98357A</td>
<td>ALSA, I²S</td>
<td>Bez zmian; wzmocnienie ustalone w sprzęcie</td>
</tr>
<tr>
<td><span class="id">IF-06</span></td>
<td>Mikrofon</td>
<td>Mikrofon USB → Practice App</td>
<td>Przechwytywanie ALSA</td>
<td>Nowe</td>
</tr>
</tbody>
</table>
<p>Practice App już wysyła zmienione prostokąty (<code>AnimationPresenter</code>, <code>ST7789.show_region</code>).
Output Guard składa każdy prostokąt do własnej kopii pełnej klatki i analizuje tę klatkę, zanim dotrze do panelu.</p>
<h3>6.5 Segregacja (IEC 62304 §5.3.5)</h3>
<ul>
<li>Dwa procesy działają jako różni użytkownicy Linuksa, <code>alfa-app</code> i <code>alfa-guard</code>.</li>
<li>Reguły udev dają <code>/dev/spidev0.0</code> i <code>/dev/gpiochip0</code> tylko grupie <code>alfa-guard</code>.
Practice App nie potrzebuje żadnego z nich: przyciski używają I²C, a klatki wysyła przez <span class="id">IF-01</span>.</li>
<li>Output Guard nie ufa niczemu, co otrzymuje.
Sprawdza rozmiar i CRC, składa klatkę i analizuje ją przed zapisem na panel.</li>
<li>systemd ogranicza pamięć i CPU Practice App, więc aplikacja nie może zagłodzić Guarda.</li>
<li>Jeśli Guard stanie, ST7789 zostawia ostatni obraz. Statyczny obraz jest stanem bezpiecznym dla <span class="id">HAZ-02</span>.
systemd uruchamia Guarda ponownie w ciągu 2 s.</li>
<li>Założenie: izolacja procesów Linuksa i uprawnienia plików działają zgodnie ze specyfikacją (<span class="id">SOUP-01</span>).
Każde wydanie przegląda opublikowane anomalie jądra.</li>
</ul>
<h3>6.6 SOUP (IEC 62304 §5.3.3, §5.3.4, §8.1.2)</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Element SOUP i wersja</th>
<th>Używany przez</th>
<th>Wymagana funkcja albo wydajność</th>
<th>Najwyższa klasa elementu używającego</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">SOUP-01</span></td>
<td>Raspberry Pi OS Lite 12 (Bookworm), Linux 6.6</td>
<td>Wszystkie</td>
<td>Izolacja procesów, uprawnienia plików, sterowniki SPI, I²C i I²S</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-02</span></td>
<td>systemd 252</td>
<td>Wszystkie</td>
<td>Restart usługi, która padła, w ciągu 2 s; egzekwowanie limitów zasobów</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-03</span></td>
<td>CPython 3.11</td>
<td>Wszystkie</td>
<td>Interpreter</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-04</span></td>
<td>NumPy 1.26</td>
<td><span class="id">SI-07</span></td>
<td>Analiza klatki 240 × 320 w mniej niż 5 ms na Raspberry Pi 3</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-05</span></td>
<td>spidev 3.8, gpiozero 2.0 z lgpio</td>
<td><span class="id">SI-07</span></td>
<td>Zapisy SPI i linie sterujące wyświetlaczem</td>
<td>C</td>
</tr>
<tr>
<td><span class="id">SOUP-06</span></td>
<td>Pillow 12</td>
<td><span class="id">SI-01</span>, <span class="id">SI-03</span></td>
<td>Składanie obrazu</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SOUP-07</span></td>
<td>smbus2 0.6</td>
<td><span class="id">SI-02</span></td>
<td>Odczyty I²C z ADC</td>
<td>B</td>
</tr>
<tr>
<td><span class="id">SOUP-08</span></td>
<td>alsa-utils 1.2 (<code>aplay</code>, <code>arecord</code>)</td>
<td><span class="id">SI-04</span>, <span class="id">SI-05</span></td>
<td>Odtwarzanie i przechwytywanie PCM 48 kHz bez niedoborów przy buforze 100 ms</td>
<td>B</td>
</tr>
</tbody>
</table>
<p>FFmpeg nie ma na urządzeniu.
Media są przygotowywane w czasie budowy istniejącym trybem <code>--prepared-only</code>.
FFmpeg jest więc zwalidowanym narzędziem budowy (ISO 13485 §4.1.6), a nie SOUP.</p>
<h3>6.7 Środki kontroli ryzyka</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>Zagrożenie</th>
<th>Środek</th>
<th>Priorytet GSPR 4</th>
<th>Zaimplementowane w</th>
<th>Weryfikacja</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">RCM-01</span></td>
<td><span class="id">HAZ-01</span></td>
<td>Wzmocnienie wzmacniacza ustalone na najniższym ustawieniu. Przy pełnej skali cyfrowej poziom wynosi najwyżej 75 dB(A) w odległości 10 cm.</td>
<td>1. Bezpieczny projekt</td>
<td>Sprzęt (<span class="id">AL-ADR-0002</span>)</td>
<td><span class="id">VER-HW-003</span></td>
</tr>
<tr>
<td><span class="id">RCM-02</span></td>
<td><span class="id">HAZ-01</span></td>
<td>Programowy limit głośności. Zostawiony dla komfortu i niezaliczony jako kontrola ryzyka.</td>
<td>Niezaliczony</td>
<td><span class="id">SI-04</span></td>
<td><span class="id">VER-SW-014</span></td>
</tr>
<tr>
<td><span class="id">RCM-03</span></td>
<td><span class="id">HAZ-02</span></td>
<td>Ogranicznik błysków zatrzymuje ostatnią zgodną klatkę</td>
<td>2. Środek ochronny</td>
<td><span class="id">SI-07</span></td>
<td><span class="id">VER-SW-030</span>, <span class="id">VER-SW-031</span></td>
</tr>
<tr>
<td><span class="id">RCM-04</span></td>
<td><span class="id">HAZ-02</span></td>
<td>Tylko Output Guard może sięgać do wyświetlacza</td>
<td>2. Środek ochronny</td>
<td><span class="id">SI-07</span>, konfiguracja systemu</td>
<td><span class="id">VER-SW-032</span></td>
</tr>
<tr>
<td><span class="id">RCM-05</span></td>
<td><span class="id">HAZ-03</span></td>
<td>Wynik zostaje ukryty, aż dźwięk ma 10 prób, a liczba prób jest zawsze widoczna</td>
<td>2. Środek ochronny</td>
<td><span class="id">SI-05</span></td>
<td><span class="id">VER-SW-040</span></td>
</tr>
<tr>
<td><span class="id">RCM-06</span></td>
<td><span class="id">HAZ-03</span></td>
<td>Instrukcja każe terapeucie odsłuchać próbki nagrań przed przejściem dalej</td>
<td>3. Informacja dla bezpieczeństwa</td>
<td>Instrukcja użytkowania §7</td>
<td>Walidacja użyteczności <span class="id">UV-002</span></td>
</tr>
</tbody>
</table>
<h3>6.8 Bezpieczeństwo i ochrona danych</h3>
<ul>
<li><strong>Brak sieci.</strong> <code>dtoverlay=disable-wifi</code> i <code>dtoverlay=disable-bt</code> wyłączają radia, a obraz wydania nie ma serwera SSH (<span class="id">AL-ADR-0003</span>).</li>
<li><strong>Dane o zdrowiu.</strong> Nagrania mowy dziecka w terapii są danymi o zdrowiu według RODO, art. 9.
Zostają na urządzeniu i są usuwane po 14 dniach.
Terapeuta czyta wyniki na urządzeniu, w menu otwieranym kodem przycisków.</li>
<li><strong>Aktualizacje.</strong> Aktualizacje przychodzą jako podpisane paczki na pendrivie. Aktualizator sprawdza podpis, zanim cokolwiek zainstaluje.</li>
<li><strong>Ryzyko resztkowe.</strong> Raspberry Pi 3 nie ma bezpiecznego rozruchu, więc ktoś z fizycznym dostępem może wymienić kartę SD.
Ocena ryzyka bezpieczeństwa <span class="id">SRA-001</span> przyjmuje to ryzyko: urządzenie jest offline i trzyma najwyżej 14 dni nagrań.</li>
<li><strong>SBOM.</strong> Każda budowa tworzy zestawienie materiałów oprogramowania CycloneDX, które wymienia wszystkie elementy SOUP.</li>
</ul>
<h2>7. Konsekwencje</h2>
<p><strong>Pozytywne</strong></p>
<ul>
<li>Rygor klasy C dotyczy około 400 linii zamiast 2500. Zmiany lekcji, dźwięku albo punktacji wymagają tylko dowodów klasy B.</li>
<li>Ekran startowy już nie pisze na wyświetlacz. Każde wyjście istotne dla bezpieczeństwa ma jednego właściciela.</li>
<li><span class="id">HAZ-01</span> jest kontrolowane przez projekt, więc programowy limit głośności jest tylko funkcją komfortu.</li>
<li>FFmpeg opuszcza urządzenie, co skraca listę SOUP.</li>
</ul>
<p><strong>Negatywne</strong></p>
<ul>
<li>Są dwa procesy i protokół klatek do zaprojektowania, przetestowania i utrzymania.</li>
<li>Każda klatka potrzebuje jeszcze jednej kopii i analizy, do 10 ms.</li>
<li>Jądro Linuksa, systemd i CPython stają się SOUP na ścieżce klasy C. Ich listy anomalii trzeba przeglądać przez całe życie urządzenia.</li>
<li>Terapeuci muszą mieć urządzenie w ręku, żeby czytać wyniki. Nie ma raportu zdalnego.</li>
</ul>
<p><strong>Regulacje i jakość</strong></p>
<ul>
<li>Każda zmiana <span class="id">SI-07</span> wymaga analizy wpływu klasy C i testów regresji (IEC 62304 §6.2, §7.4).</li>
<li>Plik zarządzania ryzykiem <span class="id">RMF-001</span> i lista SOUP muszą wskazywać <span class="id">RCM-03</span>, <span class="id">RCM-04</span> oraz <span class="id">SOUP-01</span> do <span class="id">SOUP-08</span>.</li>
<li>Jeśli funkcja wyniku zostanie usunięta, oceń klasyfikację ponownie. Alfa-L stałoby się klasą I.</li>
</ul>
<h2>8. Potwierdzenie</h2>
<p>Decyzja jest potwierdzona, gdy te zapisy istnieją i przechodzą.
Wszystkie zapisy i wyniki w tej tabeli są fikcyjne. Nie odbył się żaden przegląd ani test.</p>
<table>
<thead>
<tr>
<th>Zapis</th>
<th>Dowód</th>
<th>Status</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">REV-2026-031</span></td>
<td>Przegląd architektury (IEC 62304 §5.3.6) przez architekta oprogramowania, menedżera ryzyka, QA, sprawy regulacyjne i lead bezpieczeństwa</td>
<td>Zaliczony 2026-10-09 (fikcja); dwa drobne ustalenia zamknięte</td>
</tr>
<tr>
<td><span class="id">VER-HW-003</span></td>
<td>Poziom dźwięku zmierzony w odległości 10 cm pełnoskalowym tonem testowym</td>
<td>Zaliczony 2026-10-06 (fikcja)</td>
</tr>
<tr>
<td><span class="id">VER-SW-030</span></td>
<td>Nagrane sekwencje klatek, w tym wszystkie 32 lekcje liter, przeanalizowane na wyjściu Guarda</td>
<td>Planowane</td>
</tr>
<tr>
<td><span class="id">VER-SW-031</span></td>
<td>Wstrzyknięcie usterki: Practice App wysyła pełnoekranową czerń i biel z częstotliwością 20 klatek na sekundę. Fotodioda na panelu liczy najwyżej trzy błyski na sekundę.</td>
<td>Planowane</td>
</tr>
<tr>
<td><span class="id">VER-SW-032</span></td>
<td>Jako <code>alfa-app</code> otwarcie urządzeń SPI i GPIO kończy się błędem uprawnień</td>
<td>Planowane</td>
</tr>
<tr>
<td><span class="id">VER-SW-033</span></td>
<td>Opóźnienie Guarda na 10 000 klatek na Raspberry Pi 3</td>
<td>Planowane</td>
</tr>
</tbody>
</table>
<h2>9. Działania następne</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Działanie</th>
<th>Właściciel</th>
<th>Termin</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">ACT-01</span></td>
<td>Przenieść sterownik ST7789 i obraz startowy do Output Guard; usunąć dostęp do wyświetlacza z Practice App</td>
<td>Lead oprogramowania</td>
<td>2026-11-06</td>
</tr>
<tr>
<td><span class="id">ACT-02</span></td>
<td>Dodać użytkowników, reguły udev i limity systemd do obrazu wydania</td>
<td>Inżynier DevOps</td>
<td>2026-11-06</td>
</tr>
<tr>
<td><span class="id">ACT-03</span></td>
<td>Zaktualizować <span class="id">RMF-001</span> i listę SOUP o środki i elementy SOUP z tej decyzji</td>
<td>Menedżer ryzyka</td>
<td>2026-10-23</td>
</tr>
<tr>
<td><span class="id">ACT-04</span></td>
<td>Dodać przegląd anomalii jądra, systemd i CPythona do listy kontrolnej wydania</td>
<td>Inżynier QA</td>
<td>2026-10-30</td>
</tr>
<tr>
<td><span class="id">ACT-05</span></td>
<td>Przedstawić argument segregacji jednostce notyfikowanej przed złożeniem</td>
<td>Sprawy regulacyjne</td>
<td>2026-12-04</td>
</tr>
</tbody>
</table>
<h2>10. Kiedy wrócić do decyzji</h2>
<p>Napisz nowy ADR, który zastępuje ten, jeśli zdarzy się którekolwiek z poniższych:</p>
<ul>
<li>Jednostka notyfikowana nie przyjmuje segregacji procesów. Wariantem zapasowym jest opcja C.</li>
<li>Zmienia się wyświetlacz, jego interfejs albo liczba klatek.</li>
<li><span class="id">VER-SW-033</span> mierzy więcej niż 10 ms na klatkę.</li>
<li>Funkcja wyniku zostaje usunięta i zmienia się klasyfikacja.</li>
</ul>
<h2>11. Powiązane decyzje</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Tytuł</th>
<th>Status</th>
<th>Związek z tą decyzją</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="id">AL-ADR-0002</span></td>
<td>Ograniczyć maksymalne ciśnienie akustyczne w sprzęcie</td>
<td>Zaakceptowany</td>
<td>Nie pozwala <span class="id">HAZ-01</span> podnieść klasy Practice App</td>
</tr>
<tr>
<td><span class="id">AL-ADR-0003</span></td>
<td>Urządzenie offline; terapeuci czytają wyniki na urządzeniu</td>
<td>Zaakceptowany</td>
<td>Usuwa sieć z powierzchni ataku</td>
</tr>
<tr>
<td><span class="id">AL-ADR-0004</span></td>
<td>Oceniać mowę deterministycznym przetwarzaniem sygnału, nie modelem wytrenowanym</td>
<td>Proponowany</td>
<td>Model wytrenowany mógłby uczynić <span class="id">SI-05</span> systemem AI wysokiego ryzyka według rozporządzenia (UE) 2024/1689</td>
</tr>
</tbody>
</table>
<h2>12. Odniesienia</h2>
<ul>
<li>Rozporządzenie (UE) 2017/745 (MDR): załącznik I, GSPR 4, 17.1, 17.2 i 17.4; załącznik II; załącznik VIII, reguły 11 i 13; załącznik IX</li>
<li>MDCG 2019-11, kwalifikacja i klasyfikacja oprogramowania</li>
<li>MDCG 2019-16, cyberbezpieczeństwo wyrobów medycznych</li>
<li>IEC 62304:2006+A1:2015, procesy cyklu życia oprogramowania wyrobu medycznego</li>
<li>EN ISO 14971:2019+A11:2021, zastosowanie zarządzania ryzykiem do wyrobów medycznych</li>
<li>EN 62366-1:2015+A1:2020, zastosowanie inżynierii użyteczności do wyrobów medycznych</li>
<li>EN ISO 13485:2016+A11:2021, systemy zarządzania jakością</li>
<li>IEC 81001-5-1:2021, bezpieczeństwo oprogramowania zdrowotnego</li>
<li>Zalecenie ITU-R BT.1702, ograniczanie ryzyka padaczki światłoczułej od obrazów telewizyjnych</li>
<li>Rozporządzenie (UE) 2016/679 (RODO), art. 9 i art. 25</li>
<li>Wewnętrzne: <span class="id">IP-001</span>, <span class="id">PRS-001</span>, <span class="id">SDP-001</span>, <span class="id">SRS-001</span>, <span class="id">RMF-001</span>, <span class="id">SRA-001</span>, <span class="id">SOUP-001</span></li>
</ul>
<h2>13. Zatwierdzenie</h2>
<p>W prawdziwym systemie jakości te osoby podpisują się w elektronicznym SZJ według procedury kontroli dokumentów.
Ten przykład pokazuje tylko format. Nobody signed anything.</p>
<table>
<thead>
<tr>
<th>Rola</th>
<th>Odpowiedzialność</th>
<th>Podpis</th>
<th>Data</th>
</tr>
</thead>
<tbody>
<tr>
<td>Architekt oprogramowania</td>
<td>Autor</td>
<td>Brak: tylko przykład</td>
<td>—</td>
</tr>
<tr>
<td>Menedżer ryzyka</td>
<td>Recenzent: kontrole ryzyka i klasy bezpieczeństwa oprogramowania</td>
<td>Brak: tylko przykład</td>
<td>—</td>
</tr>
<tr>
<td>Sprawy regulacyjne</td>
<td>Recenzent: klasyfikacja MDR i dokumentacja techniczna</td>
<td>Brak: tylko przykład</td>
<td>—</td>
</tr>
<tr>
<td>Lead bezpieczeństwa</td>
<td>Recenzent: bezpieczeństwo i ochrona danych</td>
<td>Brak: tylko przykład</td>
<td>—</td>
</tr>
<tr>
<td>Zapewnienie jakości</td>
<td>Zatwierdzający: kontrola dokumentów</td>
<td>Brak: tylko przykład</td>
<td>—</td>
</tr>
</tbody>
</table>
<h2>14. Historia rewizji</h2>
<p>Ta historia jest fikcyjna i pokazuje tylko format.</p>
<table>
<thead>
<tr>
<th>Wersja</th>
<th>Data</th>
<th>Zmiana</th>
<th>Autor</th>
</tr>
</thead>
<tbody>
<tr>
<td>0.1</td>
<td>2026-09-22</td>
<td>Pierwszy szkic z opcjami A–D</td>
<td>Architekt oprogramowania</td>
</tr>
<tr>
<td>0.2</td>
<td>2026-10-02</td>
<td>Przegląd ryzyka: dodano <span class="id">RCM-04</span> i przypadek zagłodzenia CPU</td>
<td>Architekt oprogramowania</td>
</tr>
<tr>
<td>0.3</td>
<td>2026-10-09</td>
<td>Zamknięto dwa drobne ustalenia z <span class="id">REV-2026-031</span></td>
<td>Architekt oprogramowania</td>
</tr>
<tr>
<td>1.0</td>
<td>2026-10-12</td>
<td>Zatwierdzono</td>
<td>Architekt oprogramowania</td>
</tr>
</tbody>
</table>
<h2>Słownik</h2>
<table>
<thead>
<tr>
<th>Termin</th>
<th>Znaczenie</th>
</tr>
</thead>
<tbody>
<tr>
<td>GSPR</td>
<td>Ogólne wymaganie dotyczące bezpieczeństwa i działania, MDR załącznik I</td>
</tr>
<tr>
<td>Jednostka notyfikowana</td>
<td>Organizacja wyznaczona do oceny zgodności większości wyrobów powyżej klasy I</td>
</tr>
<tr>
<td>RCM</td>
<td>Środek kontroli ryzyka (ISO 14971)</td>
</tr>
<tr>
<td>Segregacja</td>
<td>Rozdzielenie, które powstrzymuje jeden element oprogramowania przed wpływem na inny (IEC 62304 §5.3.5)</td>
</tr>
<tr>
<td>Element oprogramowania</td>
<td>Każda identyfikowalna część oprogramowania. Jednostka to element, którego się dalej nie dzieli.</td>
</tr>
<tr>
<td>Klasa bezpieczeństwa oprogramowania</td>
<td>A, B albo C, ustalona według najgorszej szkody, do której oprogramowanie może się przyczynić po zewnętrznych kontrolach ryzyka (IEC 62304 §4.3)</td>
</tr>
<tr>
<td>SOUP</td>
<td>Oprogramowanie nieznanego pochodzenia: oprogramowanie stron trzecich nieopracowane w tym systemie jakości (IEC 62304)</td>
</tr>
</tbody>
</table>
<h2>Koniec przykładu szkoleniowego</h2>
<p><strong>TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY</strong></p>
<p>Alfa-L i każdy zapis w tym dokumencie są fikcyjne.
Alfa to hobbystyczny projekt open source bez przeznaczenia medycznego i bez licencji regulacyjnej, certyfikatu ani zatwierdzenia.
Ten dokument nie jest poradą i jest udostępniony „tak jak jest”, bez jakiejkolwiek gwarancji.</p>
`,i={Hardware:`Sprzęt`,Frame:`Element`,"Front shell":`Skorupa przednia`,"Rear shell":`Skorupa tylna`,"Battery door":`Drzwiczki baterii`,"Snap hook":`Zaczep zatrzasku`,"LCD mounting post":`Słupek montażowy LCD`,"Rounded keypad bridge · 4 mm / R8":`Zaokrąglony mostek klawiatury · 4 mm / R8`,"Keypad mounting slot":`Gniazdo montażowe klawiatury`,"Speaker mounting slot":`Gniazdo montażowe głośnika`,"10 kΩ divider perfboard":`Płytka dzielnika 10 kΩ`,"10 kΩ divider perfboard support slot":`Gniazdo podparcia płytki dzielnika 10 kΩ`,"40 mm speaker · provisional":`Głośnik 40 mm · wymiar wstępny`,"ADS1115/ADS1015 · provisional":`ADS1115/ADS1015 · wymiar wstępny`,"ADS1115/ADS1015 · provisional support slot":`Gniazdo podparcia ADS1115/ADS1015 · wymiar wstępny`,"Angled micro-USB plug · provisional":`Kątowa wtyczka micro-USB · wymiar wstępny`,"Baseus 5000 mAh":`Baseus 5000 mAh`,"Battery USB-C plug · provisional":`Wtyczka USB-C baterii · wymiar wstępny`,"Battery door retaining tab":`Zaczep drzwiczek baterii`,"Battery door screw receiver":`Gniazdo śruby drzwiczek baterii`,"Battery lower edge support":`Podparcie dolnej krawędzi baterii`,"Battery lower retaining fence":`Dolna zapora baterii`,"Battery upper retaining fence":`Górna zapora baterii`,"Battery wall shelf and strap slot":`Półka ściany baterii i szczelina paska`,"Connected GPIO sockets · provisional":`Podłączone gniazda GPIO · wymiar wstępny`,"Connected USB-C coupling · provisional":`Podłączone złącze USB-C · wymiar wstępny`,"Five-button AD-Key · provisional":`AD-Key, pięć przycisków · wymiar wstępny`,"LCD connector · provisional":`Złącze LCD · wymiar wstępny`,"MAX98357A · provisional":`MAX98357A · wymiar wstępny`,"MAX98357A · provisional support slot":`Gniazdo podparcia MAX98357A · wymiar wstępny`,"Perimeter case screw post":`Słupek śruby obwodu obudowy`,"Perimeter case screw receiver":`Gniazdo śruby obwodu obudowy`,"Pi connectors":`Złącza Pi`,"QUARKZMAN switch · provisional":`Przełącznik QUARKZMAN · wymiar wstępny`,"Raspberry Pi 3 B":`Raspberry Pi 3 B`,"Raspberry Pi mounting post":`Słupek montażowy Raspberry Pi`,"Rounded cumulus side relief":`Zaokrąglone wycięcie boku, cumulus`,"Rounded front handle and shoulder":`Zaokrąglony przedni uchwyt i bark`,"Rounded rear handle and shoulder":`Zaokrąglony tylny uchwyt i bark`,"Switch retaining slot":`Szczelina mocowania przełącznika`,"Waveshare 2-inch LCD":`Wyświetlacz LCD Waveshare, 2 cale`,"User-confirmed 69 x 106 x 14 bank, rotated horizontally; USB-C centred on right 69 x 14 end face":`Potwierdzony powerbank 69 × 106 × 14 mm, obrócony poziomo; USB-C na środku prawej ścianki 69 × 14 mm`,"Recorded envelope; user-confirmed corner-hole diagonal offset 4.5 mm":`Zmierzony obrys; potwierdzone przesunięcie otworu narożnego po przekątnej 4,5 mm`,"Recorded provisional envelope; exact module manufacturer unidentified":`Wstępny zmierzony obrys; producent modułu nieustalony`,"New perfboard design target":`Docelowy projekt nowej płytki uniwersalnej`,"QUARKZMAN B0H1JMNHQT; manufacturer housing drawing unavailable":`QUARKZMAN B0H1JMNHQT; brak rysunku obudowy od producenta`,"CHANGED · Pico 2 WH":`ZMIANA · Pico 2 WH`,"Raspberry Pi 3 Model B":`Raspberry Pi 3 Model B`,"USB end · pins 1 / 40":`Koniec USB · piny 1 / 40`,"PIN 1":`PIN 1`,"20 pins each side · GP ≠ physical pin":`20 pinów z każdej strony · GP ≠ pin fizyczny`,"AD-Key · your five-button board":`AD-Key · twoja płytka z pięcioma przyciskami`,"ADS1115 / ADS1015 · photo-matched":`ADS1115 / ADS1015 · według zdjęcia`,"MAX98357A · photo-matched":`MAX98357A · według zdjęcia`,"NEW · 3.3 V join":`NOWE · wspólne 3,3 V`,"NEW · USB 5 V join":`NOWE · wspólne USB 5 V`,"Ground join":`Wspólna masa`,"Shared join → A0":`Wspólne złącze → A0`,"5 V USB supply · connect last":`Zasilanie USB 5 V · podłącz na końcu`,"Speaker +":`Głośnik +`,"Speaker − (not GND)":`Głośnik − (nie masa)`,"Speaker −     Speaker +":`Głośnik −     Głośnik +`,"SOLDER HERE · all seven header pins":`LUTUJ TUTAJ · wszystkie siedem pinów goldpina`,"Header lifted for clarity · solder the short legs underneath":`Goldpin uniesiony dla czytelności · krótsze nóżki lutuj od spodu`,"40 mm speaker":`Głośnik 40 mm`,"Five buttons":`Pięć przycisków`,"USB switch · measure housing":`Przełącznik USB · zmierz obudowę`,"Waveshare LCD (back)":`LCD Waveshare (tył)`,"Passive speaker":`Głośnik pasywny`,"Raspberry Pi · physical pin numbers":`Raspberry Pi · numery pinów fizycznych`,"Pico 2 WH · changed controller":`Pico 2 WH · wymieniony sterownik`,"5 V micro-USB power → Pi power socket":`Zasilanie micro-USB 5 V → gniazdo zasilania Pi`,"5 V micro-USB → Pico power / programming port":`Micro-USB 5 V → port zasilania i programowania Pico`,"NEW · pin 36 (3V3 OUT) → shared 3.3 V join":`NOWE · pin 36 (3V3 OUT) → wspólne 3,3 V`,"NEW · pin 40 (VBUS) → shared USB 5 V join":`NOWE · pin 40 (VBUS) → wspólne USB 5 V`,"Controller GND → ADC ground join (Pi 20)":`Masa sterownika → wspólna masa ADC (Pi 20)`,"OUT → R1 input":`OUT → wejście R1`,"R1/R2 junction → ADC A0":`Złącze R1/R2 → ADC A0`,"R2 lower lead → ground join":`Dolna końcówka R2 → wspólna masa`,"G → shared ground join":`G → wspólna masa`},a=[[`shared ground join`,`wspólna masa`],[`shared 3.3 V join`,`wspólne 3,3 V`],[`shared USB 5 V join`,`wspólne USB 5 V`],[`via 3.3 V join`,`przez wspólne 3,3 V`],[`via USB 5 V join`,`przez wspólne USB 5 V`],[`speaker - (not GND)`,`głośnik − (nie masa)`],[`ground join`,`wspólna masa`],[`speaker +`,`głośnik +`],[`not GND`,`nie masa`],[`purple`,`fioletowy`],[`white`,`biały`],[`green`,`zielony`],[`orange`,`pomarańczowy`],[`yellow`,`żółty`],[`blue`,`niebieski`],[`brown`,`brązowy`],[`gray`,`szary`]],o={en:{"meta.title":`Alfa · Build atlas`,"meta.description":`Little radio. Big imagination. Build a pastel cloud radio with offline music, Polish letter lessons, and a Raspberry Pi.`,"meta.ogSite":`Alfa · A little radio lab`,"meta.ogTitle":`Alfa · Little radio. Big imagination.`,"meta.ogDescription":`An offline music and alphabet companion. Explore the pastel cloud, download the print files, and build your own.`,"meta.ogUrl":`https://hvitis.github.io/Alfa/en/`,"meta.ogImageAlt":`Pastel blue Alfa cloud radio with yellow buttons, Greek alpha logo, and playful pastel decorations.`,"meta.twitterTitle":`Alfa · Little radio. Big imagination.`,"meta.twitterDescription":`An offline music and alphabet companion. Made by you.`,"meta.twitterImageAlt":`Pastel blue Alfa cloud radio, rendered from its printable CAD assembly.`,"meta.canonical":`https://hvitis.github.io/Alfa/en/`,"meta.ogLocale":`en_US`,"meta.ogLocaleAlt":`pl_PL`,"nav.skip":`Skip to content`,"nav.home":`Home`,"nav.obudowa":`Enclosure`,"nav.elektronika":`Electronics`,"nav.oprogramowanie":`Software`,"nav.inne":`Other`,"card.obudowa.title":`Enclosure`,"card.obudowa.desc":`Two craft worlds: a pastel 3D-printed cloud or a warm birch plywood case. STL, STEP files and 1:1 cutting plans.`,"card.obudowa.btn":`Explore enclosures`,"card.obudowa.alt1":`3D printed cloud enclosure`,"card.obudowa.alt2":`Little House Radio plywood enclosure`,"card.elektronika.title":`Electronics`,"card.elektronika.desc":`From GPIO breadboard connections to a dedicated Pi 3 shield. Circuit schematics, interactive 3D wiring model, and KiCad exports.`,"card.elektronika.btn":`Explore electronics`,"card.elektronika.alt1":`Complete wiring schematic`,"card.elektronika.alt2":`Red PCB shield copper render from KiCad`,"card.oprogramowanie.title":`Software`,"card.oprogramowanie.desc":`Offline Python application. Event loop, I²S audio streaming, debounced buttons, and an interactive 32-letter learning simulator.`,"card.oprogramowanie.btn":`Explore software`,"card.oprogramowanie.alt2":`Software architecture diagram`,"card.inne.title":`Other`,"card.inne.desc":`Educational resources, fictional medical device ADR worked example, and full project download archives.`,"card.inne.btn":`Explore resources`,"card.inne.alt1":`PDF documentation page preview`,"card.inne.alt2":`Workshop guide cover`,"obudowa.subnav.label":`Enclosure type`,"obudowa.btn.filament":`Filament`,"obudowa.btn.sklejka":`Plywood`,"elektronika.subnav.label":`Controller platform`,"elektronika.btn.pi":`Raspi 3`,"elektronika.btn.pico":`Pico`,"elektronika.btn.pcb":`PCB`,"inne.eyebrow":`RESOURCES & DOWNLOADS`,"inne.h2":`Educational materials & project pack.`,"inne.lead":`Everything in one place: a fictional worked ADR example under medical device standards, plus full project download archives.`,"inne.downloads.title":`Project download packages`,"inne.downloads.lead":`Download complete archives for 3D printing, laser cutting, and running on hardware.`,"inne.download.complete":`Complete project pack · Alfa-Build-Kit.zip`,"inne.download.cloud":`Cloud CAD package · cloud-radio.zip`,"inne.download.software":`Software package · ZIP`,"inne.download.plywood":`Plywood assembly guide · PDF`,"inne.showAdr":`Show example ADR`,"inne.hideAdr":`Hide example ADR`,"brand.home":`Alfa home`,"brand.href":`./en/`,"brand.tagline":`A LITTLE RADIO LAB`,"lang.nav":`Language`,"header.explore":`Made to explore`,"header.code":`Peek at the code`,"hero.eyebrow":`SMALL RADIO. BIG IDEAS.`,"hero.title":`Little radio.<br><span>Big imagination.</span>`,"hero.lead":`A little radio, a whole world to explore.<br>Turn it around, peek inside, and see how every piece fits.`,"hero.sticker":`PLAY. MAKE. WONDER.`,"tabs.label":`Project layers`,"tab.3dprint":`3DPrint`,"tab.plywood":`Plywood`,"tab.hardware":`Hardware`,"tab.software":`Software`,"cloud.eyebrow":`A LITTLE CLOUD, BUILT TO HOLD.`,"cloud.h2":`Cloud radio.`,"cloud.kicker":`01 / 3D PRINT`,"cloud.h3":`Three parts. One little cloud.`,"cloud.lead":`A soft cloud with rounded shoulders and a raised carry handle centered across the front–back joint. LCD on the left, five buttons on the right. A horizontal battery door sits below the handle on the back. Three printed parts, four enclosure screws.`,"cloud.modeLabel":`Assembly view`,"cloud.mode.assembled":`Assembled`,"cloud.mode.exploded":`Exploded`,"cloud.mode.inside":`Inside`,"cloud.mode.battery":`Battery access`,"cloud.labels":`Show frame IDs &amp; hardware names`,"cloud.clearances":`Show 5 mm fit allowance`,"cloud.notice":`Prototype fit: uncertain dimensions include 5 mm total allowance, 2.5 mm per side. Print the snap coupons and check your hardware before assembly.`,"cloud.guide":`Assembly & physical test guide`,"download.eyebrow":`READY FOR YOUR WORKBENCH`,"download.h3":`Print your cloud.`,"download.lead":`STL files use millimetres and include the print orientation. The STEP assembly keeps the editable solids.`,"download.front":`Front shell`,"download.frontAria":`Download Front shell STL`,"download.frontTitle":`Preview Front shell in 3D`,"download.rear":`Rear shell`,"download.rearAria":`Download Rear shell STL`,"download.rearTitle":`Preview Rear shell in 3D`,"download.door":`Battery door`,"download.doorAria":`Download Battery door STL`,"download.doorTitle":`Preview Battery door in 3D`,"download.step":`CAD assembly <small>STEP ↙</small>`,"download.zip":`Complete project <small>ZIP ↙</small>`,"stl.viewerAria":`Individual 3D STL part preview`,"stl.group":`Select STL part to preview`,"stl.front":`Front`,"stl.rear":`Rear`,"stl.door":`Battery door`,"stl.reset":`Reset`,"stl.resetAria":`Reset camera view`,"stl.viewFront":`Preview Front shell in STL viewer`,"stl.viewRear":`Preview Rear shell in STL viewer`,"stl.viewDoor":`Preview Battery door in STL viewer`,"stl.viewport":`3D STL part viewport`,"stl.status":`Front shell · Drag to orbit · Scroll to zoom`,"stl.hint":`<b>Drag</b> to orbit <span class="separator">/</span> <b>Scroll</b> to zoom`,"stl.loaded":`{name} loaded · Drag to orbit · Scroll to zoom`,"stl.loading":`Loading {file}…`,"stl.failed":`Unable to load {file}: {message}`,"stl.aria":`Individual 3D STL part. Drag to orbit, scroll to zoom.`,"pricing.section":`Estimated build cost and components`,"pricing.eyebrow":`ESTIMATED BUILD COST · POLISH SUPPLIERS`,"pricing.h3":`Build cost & component estimate.`,"pricing.lead":`Component prices sourced directly from Polish electronics shops and makerspaces (Botland, Kamami, Gotronik, sklep.msalamon.pl, Allegro). Actual prices and stock availability may vary.`,"pricing.badge":`ESTIMATED TOTAL`,"pricing.subStatic":`Complete radio from scratch (~90–110 €).<br><strong>Only ~155 PLN</strong> if you already have a Pi 3 and PETG filament!`,"pricing.sub.3d-print.pi3":`Complete radio from scratch (~{euroMin}–{euroMax} €).<br><strong>Only ~155 PLN</strong> if you already have a Pi 3 and PETG filament!`,"pricing.sub.3d-print.pico":`Budget build based on Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Only ~125 PLN</strong> if you already have a controller and PETG filament!`,"pricing.sub.plywood-house.pi3":`Little House Radio enclosure build (~{euroMin}–{euroMax} €).<br><strong>Only ~168 PLN</strong> if you already have a Pi 3 and plywood sheet!`,"pricing.sub.plywood-house.pico":`Little House Radio with Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Only ~125 PLN</strong> if you already have a controller and plywood sheet!`,"pricing.sub.plywood-case.pi3":`Original plywood case enclosure build (~{euroMin}–{euroMax} €).<br><strong>Only ~168 PLN</strong> if you already have a Pi 3 and plywood sheet!`,"pricing.sub.plywood-case.pico":`Original plywood case with Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Only ~125 PLN</strong> if you already have a controller and plywood sheet!`,"pricing.caseLabel":`Case / Enclosure`,"pricing.case.3d":`3D printed case`,"pricing.case.house":`Plywood (Little House Radio)`,"pricing.case.original":`Plywood (Original case)`,"pricing.controllerLabel":`Components`,"pricing.controller.pi":`Based on Raspberry Pi 3`,"pricing.controller.pico":`Based on Pico`,"pricing.caption":`Components sourced from Polish electronics stores · click table headers to sort · links open in a new tab.`,"table.component":`Component`,"table.function":`Function in device`,"table.price":`Estimated price`,"table.where":`Where to find (PL)`,"cloud.details.hw":`Hardware dimensions and verification`,"cloud.details.hwLead":`Manufacturer drawings define the Pi and LCD. Supplier dimensions and the remaining connector shapes are provisional. The fit allowance does not establish printed strength.`,"cloud.table.caption":`Sources and nominal dimensions; uncertain dimensions receive an additional 5 mm.`,"cloud.th.component":`Component`,"cloud.th.size":`Nominal size, mm`,"cloud.th.source":`Source / certainty`,"cloud.checksDownload":`Download geometry and mesh checks`,"cloud.physical":`Physical checks still required: snap cycles, screw retention, battery retention, drops, and operating temperatures. The assembly guide includes the procedure.`,"cloud.details.frame":`Frame ID reference`,"cloud.details.frameLead":`Hover or tap a visible surface for its ID and name. Choose Exploded and rotate the model to inspect internal mounts. Enable frame IDs to show their positions.`,"cloud.frame.caption":`IDs identify features of the three printed parts.`,"cloud.th.id":`ID`,"cloud.th.feature":`Feature`,"cloud.th.part":`Printed part`,"plywood.eyebrow":`THE ENCLOSURE`,"plywood.h2":`A home for the hardware.`,"plywood.projectLabel":`Project`,"plywood.opt.house":`Little House Radio`,"plywood.opt.case":`Original plywood case`,"plywood.kicker":`02 / PLYWOOD`,"plywood.modeLabel":`Assembly view`,"plywood.wood":`Show plywood`,"plywood.componentLabels":`Show component labels`,"plywood.note":`These are the project's CAD meshes. Orbit the model, open the roof, or look inside to see how the parts fit.`,"plywood.source":`Design files & fabrication guide`,"plywood.model.house.title":`Little House Radio`,"plywood.model.house.description":`A plywood enclosure with an opening roof, room for the electronics, and a carry handle.`,"plywood.model.case.title":`Original plywood case`,"plywood.model.case.description":`A compact 6 mm plywood enclosure with a removable rear cover and space for the Pi, screen, buttons, and power bank.`,"plywood.mode.assembled":`Assembled`,"plywood.mode.roof":`Roof open`,"plywood.mode.inside":`Inside`,"plywood.mode.exploded":`Exploded`,"plywood.mode.internals":`Inside`,"plywood.download.eyebrow":`WORKSHOP BUNDLE & DOCUMENTATION`,"plywood.download.h3":`Download complete project.`,"plywood.download.lead":`The complete cloud-radio project bundle extended with the illustrated plywood enclosure assembly guide, Raspberry Pi 3 hardware setup, wiring atlas, and 1:1 printable blueprints.`,"plywood.download.pdf":`Assembly Guide <small>PDF ↙</small>`,"plywood.download.zip":`Download Project <small>cloud-radio.zip ↙</small>`,"plywood.inspectorDownload":`Download Project · cloud-radio.zip ↙`,"hw.eyebrow":`THE CONNECTIONS`,"hw.h2":`Follow every wire.`,"hw.controllerLabel":`Controller`,"hw.opt.pi":`Raspberry Pi 3`,"hw.opt.pico":`Pico 2 WH`,"pcb.option":`Raspi 3 PCB`,"pcb.title":`Raspi 3 PCB · integrated shield`,"pcb.description":`A custom board above your current Raspberry Pi 3. The ADC, amplifier and divider fit directly on the shield. Rotate the actual KiCad model to inspect the layout.`,"pcb.notice":`Prototype A · KiCad export. Physical assembly, temperature and hardware operation still need checking.`,"pcb.mode":`PCB view`,"pcb.assembled":`Shield on Raspberry Pi 3`,"pcb.board":`PCB only`,"pcb.exploded":`Exploded assembly`,"pcb.labels":`Show components and connectors`,"pcb.size":`Board`,"pcb.layers":`Copper layers`,"pcb.mount":`Mounting hole spacing`,"pcb.envelope":`The board and component geometry comes from KiCad. The Pi and underside socket are simplified envelopes. The mounting height needs measurement.`,"pcb.ready":`Raspi 3 PCB · drag to rotate, scroll to zoom. Choose PCB only to inspect the underside.`,"pcb.kicker":`SHIELD / PROTOTYPE A`,"pcb.files":`Design and fabrication files`,"pcb.integration":`The ADS1115 ADC, MAX98357A amplifier, divider resistors and supply components fit directly on the PCB. Three cables connect the LCD, keypad and speaker.`,"pcb.download":`Download complete prototype · ZIP`,"pcb.schematic":`Schematic · PDF`,"pcb.step":`Mechanical model · STEP`,"pcb.gerbers":`Gerber + drill files · draft`,"pcb.order":`For quotation and manufacturer review. Before ordering, check the socket and standoff heights, JST harnesses and enclosure fit. Electrical and thermal tests remain necessary.`,"pcb.caption":`Components fitted to the shield`,"pcb.ref":`Reference`,"pcb.part":`Component`,"pcb.assembly":`Assembly`,"pcb.bottom":`Underside · through-hole`,"pcb.tht":`Top · through-hole`,"pcb.smt":`Top · factory SMT`,"hw.kicker":`03 / HARDWARE`,"hw.picoNotice":`Proposed Pico wiring. The Linux app runs on Raspberry Pi; Pico requires separate firmware and PIO audio.`,"hw.circuitLabel":`Circuit`,"hw.circuit.all":`All connections`,"hw.circuit.lcd":`Display / SPI`,"hw.circuit.audio":`Audio / I²S`,"hw.circuit.adc":`ADC / I²C`,"hw.circuit.keypad":`Buttons / divider`,"hw.circuit.power":`Power`,"hw.selected":`SELECTED CONNECTION`,"hw.choose":`Choose a wire in the diagram or the table below.`,"hw.clear":`Show all wires`,"hw.warning":`Disconnect power before changing wires. The two 10 kΩ resistors reduce keypad OUT before ADC A0. Speaker − does not connect to GND.`,"hw.diagramEyebrow":`COMPLETE HARDWARE SCHEMATIC`,"hw.diagramH3":`Full peripheral wiring & schematic.`,"hw.diagramLead":`All peripheral modules, signal buses, voltage dividers, and power chain connected to the Raspberry Pi 3 40-pin GPIO header. Scalable vector diagram.`,"hw.diagramDownload":`Download Vector Schematic <small>SVG ↙</small>`,"hw.diagramAria":`Complete hardware schematic and wiring diagram`,"hw.diagramAlt":`Complete hardware schematic diagram for Alfa Radio with Raspberry Pi 3`,"hw.atlasEyebrow":`THE COMPLETE WIRING ATLAS`,"hw.atlasH3":`Every connection, both ends.`,"hw.th.wire":`Wire`,"hw.th.signal":`Circuit / signal`,"hw.th.from":`From`,"hw.th.to":`To`,"hw.trace":`Trace wire {id}`,"hw.count":`{shown} / {total} connections`,"controller.pi.title":`Raspberry Pi 3`,"controller.pi.description":`The active Linux controller. Inspect every display, audio, button, ADC, and power connection.`,"controller.pico.title":`Pico 2 WH`,"controller.pico.description":`The same peripherals, with the Pico physical pin and GP assignments shown at each controller connection.`,"wiring.caption.pi":`Raspberry Pi 3 wiring · controller numbers are physical header pins.`,"wiring.caption.pico":`Pico wiring · physical pin and GP names are shown together. Proposed firmware pin assignment.`,"sw.eyebrow":`THE SOFTWARE`,"sw.h2":`From a button press to a response.`,"play.eyebrow":`THE RASPBERRY PI APP`,"play.badge":`HOLD TO DRAW`,"play.title":`Screen on the left. Buttons on the right.`,"play.lead":`The alphabet lesson from the Pi. Tap the bottom button to hear the letter. Hold for 0.6 seconds to draw. Release to pause.`,"play.recordings":`Spoken recordings stay on the Pi. These buttons run the same lesson.`,"play.legend.letters":`Left and right change the letter and play its sound.`,"play.legend.listen":`Top plays listen and brings the card in from above.`,"play.legend.say":`The button under those plays say-it-with-me, waits, then a word of praise.`,"play.legend.draw":`Tap the bottom button to replay. Hold for 0.6 seconds to start or resume drawing.`,"play.keys":`Use left/right arrows to change letters. Space or Enter replays on a tap and draws on a hold.`,"play.group":`Five analog buttons`,"play.screen":`Raspberry Pi screen`,"play.up":`Listen to the letter`,"play.left":`Previous letter`,"play.right":`Next letter`,"play.down":`Say it with me`,"play.center":`Tap to hear the letter. Hold for 0.6 seconds to draw`,"play.loading":`Loading the alphabet…`,"play.ready":`{letter} · Ready`,"play.asleep":`Backlight off. Press any button.`,"play.action.ready":`Ready`,"play.action.previous":`Previous letter`,"play.action.next":`Next letter`,"play.action.listen":`Listen`,"play.action.say":`Say it with me`,"play.action.none":`No drawing for this card`,"play.drawing":`Drawing {letter}`,"play.still":`Still drawing {letter}`,"play.phase.card":`{letter} on screen`,"play.phase.slide":`{letter} sliding in`,"play.phase.peek":`A peek at {letter}`,"play.phase.sleep":`Screen asleep`,"play.phase.intro":`Ready to draw {letter}`,"play.phase.draw":`Drawing {letter}`,"play.phase.paused":`Pencil waiting on {letter}`,"play.phase.bravo":`Bravo, {letter}`,"sw.docLabel":`Document`,"sw.opt.design":`Design`,"sw.opt.implementation":`Implementation`,"sw.opt.teaching":`Teaching example (MDR)`,"sw.designKicker":`04 / DESIGN`,"sw.designH3":`The decisions behind the code.`,"sw.designLead":`An architecture decision record for the existing offline Python application.`,"sw.designTag":`RECORDED`,"sw.adrPdf":`Illustrated ADR <small>PDF ↙</small>`,"sw.adrMd":`Download ADR source`,"sw.adrHref":`./docs/adr.md`,"sw.implKicker":`04 / IMPLEMENTATION`,"sw.implH3":`One loop. Explicit hardware boundaries.`,"sw.implLead":`The current Raspberry Pi application, from startup and media preparation to input, display, audio, and cleanup.`,"sw.mermaidLink":`Mermaid source`,"sw.diagram":`Software architecture diagram`,"sw.legend.flow":`Control flow`,"sw.legend.physical":`Physical hardware`,"sw.legend.sim":`Simulation`,"sw.mermaidSummary":`Read the Mermaid definition`,"sw.teachKicker":`04 / TEACHING`,"sw.teachH3":`How to write an ADR for medical device software.`,"sw.teachLead":`A fictional worked example for training. It shows what the MDR, IEC 62304, and ISO 14971 add to an ordinary ADR.`,"sw.teachTag":`FICTIONAL`,"sw.teachNotice":`<b>Teaching material.</b> Not a medical device. For educational purposes only.`,"sw.teachPdf":`Teaching ADR <small>PDF ↙</small>`,"sw.teachMd":`Download ADR source`,"sw.teachHref":`./docs/teaching-material-adr-example-not-a-medical-device.md`,"sw.teachArticle":`Teaching material: a fictional architecture decision record. Not a medical device.`,"viewer.badge":`CLOUD RADIO / PRINTABLE CAD`,"viewer.reset":`Reset view`,"viewer.resetAria":`Reset camera`,"viewer.viewport":`Interactive 3D project viewer`,"viewer.status":`Loading the 3D model…`,"viewer.drag":`<b>Drag</b> to orbit <span class="separator">/</span> <b>Scroll</b> to zoom`,"viewer.live":`Interactive 3D`,"viewer.canvasAria":`3D model. Drag to orbit, scroll to zoom, right-drag to pan.`,"status.loading":`Loading project data…`,"footer.tagline":`Little radio. Big imagination.`,"footer.notice":`Not a medical device. For educational purposes only.`,"footer.licenses":`Library licenses`,"footer.share":`Made to be shared`,"error.view":`Unable to complete this view: {message}`,"viewer.loadingWiring":`Loading wiring…`,"viewer.loadingCad":`Loading the CAD model…`,"viewer.sceneCloud":`CLOUD RADIO / PRINTABLE CAD`,"viewer.sceneHardware":`HARDWARE / WIRING ATLAS`,"viewer.scenePlywood":`PLYWOOD / 3D MODEL`,"viewer.readyHardware":`All connections are available in the wiring table below.`,"viewer.readyCloud":`Hover or tap for frame IDs and hardware names · drag to rotate.`,"viewer.readyPlywood":`Model loaded · drag to inspect the actual CAD geometry.`,"status.ready":`Ready · 3D models, wiring, and documents load from this static website.`,"cloud.revision":`PETG / {revision}`,"facts.width":`Width`,"facts.height":`Height`,"facts.depth":`Depth`,"facts.material":`Material`,"facts.grip":`Grip depth`,"facts.battery":`Battery`,"facts.plywood":`6 mm plywood`,"facts.batteryHorizontal":`Horizontal`,"cloud.checks":`{count} digital checks passed · physical print tests pending`,"cloud.provisionalPrefix":`Provisional · +5 mm allowance. `,"part.front":`Front shell`,"part.rear":`Rear shell`,"part.battery_door":`Battery door`,"selection.component":`Selected component: {id}`,"endpoint.picoNamed":`Pico {name}`,"endpoint.piPin":`Raspberry Pi physical pin {pin}`,"endpoint.gndJoin":`Shared ground join`,"endpoint.v3":`Shared 3.3 V join`,"endpoint.v5":`Shared USB 5 V join`,"endpoint.rin":`R1 input`,"endpoint.join":`R1 / R2 / ADC A0 join`,"endpoint.rgnd":`R2 ground end`,"endpoint.power":`5 V USB supply`,"endpoint.usb":`Controller USB input`,"endpoint.speakerPlus":`Speaker +`,"endpoint.speakerMinus":`Speaker −`,"endpoint.module.L":`LCD`,"endpoint.module.A":`ADC`,"endpoint.module.M":`Amplifier`,"endpoint.module.K":`Keypad`,"endpoint.module.S":`Speaker`,"group.LCD":`LCD`,"group.Audio":`Audio`,"group.ADC":`ADC`,"group.Keypad":`Keypad`,"group.Power":`Power`,"software.diagramLabel":`Raspberry Pi software architecture: startup, calibrated input, player state, display, audio, simulation, and service supervision.`,"teaching.diagramLabel":`Fictional Alfa-L architecture: a class B Practice App sends frames to a class C Output Guard, which alone drives the display.`,"dev.building":`Rebuilding cloud CAD… Last valid model remains available.`,"dev.error":`Cloud rebuild failed: {message}`,"colors.section":`Cloud color preview`,"colors.eyebrow":`MAKE IT YOURS`,"colors.title":`Pick your cloud colors.`,"colors.hint":`Choose filament to match your preview.`,"colors.palettes":`Preset color palettes`,"colors.custom":`Custom colors`,"colors.palettePrefix":`Color palette: {name}`,"colors.petg":`PETG colors`,"colors.partColors":`{part} PETG colors`,"colors.partChoice":`{part} color: {choice}`,"colors.partColor":`{part} color`,"colors.swatch":`{part}: {color}`,"colors.customColor":`Custom color`,"colors.customShort":`Custom`,"colors.approximate":`Screen colors are approximate. `,"colors.reference":`Color reference ↗`,"palette.cloud-blue":`Cloud blue`,"palette.candy-cloud":`Candy cloud`,"palette.mint-arcade":`Mint arcade`,"palette.lavender-dream":`Lavender dream`,"palette.peach-pop":`Peach pop`,"palette.lemon-fizz":`Lemon fizz`,"filament.black":`Black`,"filament.white":`White`,"filament.grey":`Grey`,"filament.dark-grey":`Dark grey`,"filament.matte-black":`Matte black`,"filament.orange":`Orange`,"filament.red":`Red`,"filament.yellow":`Yellow`,"filament.gold":`Gold`,"filament.forest-green":`Forest green`,"filament.pistachio":`Pistachio`,"filament.chalky-blue":`Chalky blue`,"filament.ocean-blue":`Ocean blue`,"filament.sky-blue":`Sky blue`,"filament.violet":`Violet`,"filament.terracotta":`Terracotta`},pl:{}},s={"meta.title":`Alfa · Atlas budowy`,"meta.description":`Małe radio. Duża wyobraźnia. Zbuduj pastelowe radio-chmurkę z muzyką offline, polskimi lekcjami liter i Raspberry Pi.`,"meta.ogSite":`Alfa · Małe laboratorium radia`,"meta.ogTitle":`Alfa · Małe radio. Duża wyobraźnia.`,"meta.ogDescription":`Towarzysz offline do muzyki i alfabetu. Obejrzyj pastelową chmurkę, pobierz pliki do druku i zbuduj własną.`,"meta.ogUrl":`https://hvitis.github.io/Alfa/`,"meta.ogImageAlt":`Pastelowe niebieskie radio-chmurka Alfa ze żółtymi przyciskami, grecką alfą i zabawnymi pastelowymi dodatkami.`,"meta.twitterTitle":`Alfa · Małe radio. Duża wyobraźnia.`,"meta.twitterDescription":`Towarzysz offline do muzyki i alfabetu. Zrobione przez ciebie.`,"meta.twitterImageAlt":`Pastelowe niebieskie radio-chmurka Alfa, wyrenderowane ze składu CAD do druku.`,"meta.canonical":`https://hvitis.github.io/Alfa/`,"meta.ogLocale":`pl_PL`,"meta.ogLocaleAlt":`en_US`,"nav.skip":`Przejdź do treści`,"nav.home":`Główna`,"nav.obudowa":`Obudowa`,"nav.elektronika":`Elektronika`,"nav.oprogramowanie":`Oprogramowanie`,"nav.inne":`Inne`,"card.obudowa.title":`Obudowa`,"card.obudowa.desc":`Dwa światy rzemiosła: pastelowa chmurka z druku 3D lub ciepła obudowa ze sklejki brzozowej. Pliki STL, STEP i plany 1:1.`,"card.obudowa.btn":`Odkryj obudowy`,"card.obudowa.alt1":`Druk 3D obudowy chmurki`,"card.obudowa.alt2":`Obudowa domku Little House ze sklejki`,"card.elektronika.title":`Elektronika`,"card.elektronika.desc":`Od połączeń GPIO i płytek po dedykowany shield Pi 3. Schematy ideowe, interaktywny model 3D okablowania i pliki KiCad.`,"card.elektronika.btn":`Zobacz elektronikę`,"card.elektronika.alt1":`Kompletny schemat ideowy połączeń elektrycznych`,"card.elektronika.alt2":`Czerwony render płytki PCB shielda z KiCad`,"card.oprogramowanie.title":`Oprogramowanie`,"card.oprogramowanie.desc":`Aplikacja w Pythonie działająca bez sieci. Pętla zdarzeń, obsługa I²S DAC, buforowane wejścia oraz interaktywny symulator nauki 32 liter.`,"card.oprogramowanie.btn":`Poznaj oprogramowanie`,"card.oprogramowanie.alt2":`Diagram architektury oprogramowania`,"card.inne.title":`Inne`,"card.inne.desc":`Materiały edukacyjne, fikcyjny rekord ADR według norm wyrobów medycznych (MDR) oraz kompletne pakiety projektu do pobrania.`,"card.inne.btn":`Przejdź do materiałów`,"card.inne.alt1":`Podgląd strony dokumentacji PDF`,"card.inne.alt2":`Okładka przewodnika warsztatowego`,"obudowa.subnav.label":`Sekcja obudowy`,"obudowa.btn.filament":`Filament`,"obudowa.btn.sklejka":`Sklejka`,"elektronika.subnav.label":`Platforma sterownika`,"elektronika.btn.pi":`Raspi 3`,"elektronika.btn.pico":`Pico`,"elektronika.btn.pcb":`PCB`,"inne.eyebrow":`MATERIAŁY I PAKIETY`,"inne.h2":`Materiały edukacyjne i pobieranie.`,"inne.lead":`Wszystko w jednym miejscu: fikcyjny przykład ADR dla oprogramowania medycznego oraz kompletne archiwa i pakiety do pobrania.`,"inne.downloads.title":`Pakiety do pobrania`,"inne.downloads.lead":`Pobierz pełne archiwa projektu do druku, wycinania i uruchomienia na sprzęcie.`,"inne.download.complete":`Pobierz cały projekt · Alfa-Build-Kit.zip`,"inne.download.cloud":`Pakiet CAD chmurki · cloud-radio.zip`,"inne.download.software":`Pakiet oprogramowania · ZIP`,"inne.download.plywood":`Przewodnik montażu ze sklejki · PDF`,"inne.showAdr":`Pokaż przykładowy ADR`,"inne.hideAdr":`Ukryj przykładowy ADR`,"brand.home":`Strona główna Alfa`,"brand.href":`./`,"brand.tagline":`MAŁE LABORATORIUM RADIA`,"lang.nav":`Język`,"header.explore":`Zrobione do odkrywania`,"header.code":`Zajrzyj do kodu`,"hero.eyebrow":`MAŁE RADIO. DUŻE POMYSŁY.`,"hero.title":`Małe radio.<br><span>Duża wyobraźnia.</span>`,"hero.lead":`Małe radio i cały świat do odkrycia.<br>Obróć je, zajrzyj do środka i zobacz, jak składa się każda część.`,"hero.sticker":`BAW SIĘ. TWÓRZ. DZIWIJ.`,"tabs.label":`Warstwy projektu`,"tab.3dprint":`Druk 3D`,"tab.plywood":`Sklejka`,"tab.hardware":`Elektronika`,"tab.software":`Program`,"cloud.eyebrow":`MAŁA CHMURKA, ZBUDOWANA, BY TRZYMAĆ.`,"cloud.h2":`Radio-chmurka.`,"cloud.kicker":`01 / DRUK 3D`,"cloud.h3":`Trzy części. Jedna mała chmurka.`,"cloud.lead":`Miękka chmurka z zaokrąglonymi barkami i wyniesionym uchwytem na środku styku przodu i tyłu. LCD po lewej, pięć przycisków po prawej. Poziome drzwiczki baterii są pod uchwytem z tyłu. Trzy drukowane części, cztery śruby obudowy.`,"cloud.modeLabel":`Widok złożenia`,"cloud.mode.assembled":`Złożone`,"cloud.mode.exploded":`Rozstrzelone`,"cloud.mode.inside":`W środku`,"cloud.mode.battery":`Dostęp do baterii`,"cloud.labels":`Pokaż identyfikatory ramy i nazwy sprzętu`,"cloud.clearances":`Pokaż naddatek pasowania 5 mm`,"cloud.notice":`Pasowanie prototypu: niepewne wymiary mają 5 mm naddatku łącznie, 2,5 mm na stronę. Wydrukuj kupony zatrzasków i sprawdź swój sprzęt przed złożeniem.`,"cloud.guide":`Instrukcja złożenia i testów fizycznych`,"download.eyebrow":`GOTOWE NA TWÓJ STÓŁ`,"download.h3":`Wydrukuj swoją chmurkę.`,"download.lead":`Pliki STL są w milimetrach i zawierają orientację druku. Złożenie STEP zachowuje edytowalne bryły.`,"download.front":`Skorupa przednia`,"download.frontAria":`Pobierz STL skorupy przedniej`,"download.frontTitle":`Podgląd skorupy przedniej w 3D`,"download.rear":`Skorupa tylna`,"download.rearAria":`Pobierz STL skorupy tylnej`,"download.rearTitle":`Podgląd skorupy tylnej w 3D`,"download.door":`Drzwiczki baterii`,"download.doorAria":`Pobierz STL drzwiczek baterii`,"download.doorTitle":`Podgląd drzwiczek baterii w 3D`,"download.step":`Złożenie CAD <small>STEP ↙</small>`,"download.zip":`Cały projekt <small>ZIP ↙</small>`,"stl.viewerAria":`Podgląd pojedynczej części STL`,"stl.group":`Wybierz część STL do podglądu`,"stl.front":`Przód`,"stl.rear":`Tył`,"stl.door":`Drzwiczki baterii`,"stl.reset":`Reset`,"stl.resetAria":`Zresetuj widok kamery`,"stl.viewFront":`Podgląd skorupy przedniej w przeglądarce STL`,"stl.viewRear":`Podgląd skorupy tylnej w przeglądarce STL`,"stl.viewDoor":`Podgląd drzwiczek baterii w przeglądarce STL`,"stl.viewport":`Obszar podglądu części STL`,"stl.status":`Skorupa przednia · Przeciągnij, aby obracać · Kółko przybliża`,"stl.hint":`<b>Przeciągnij</b>, aby obracać <span class="separator">/</span> <b>kółko</b> przybliża`,"stl.loaded":`{name} wczytane · Przeciągnij, aby obracać · Kółko przybliża`,"stl.loading":`Wczytywanie {file}…`,"stl.failed":`Nie udało się wczytać {file}: {message}`,"stl.aria":`Pojedyncza część STL. Przeciągnij, aby obracać, kółkiem przybliżaj.`,"pricing.section":`Szacowany koszt budowy i elementy`,"pricing.eyebrow":`SZACOWANY KOSZT BUDOWY · POLSCY DOSTAWCY`,"pricing.h3":`Koszt budowy i zestawienie elementów.`,"pricing.lead":`Ceny elementów pochodzą wprost z polskich sklepów elektronicznych i dla makerów (Botland, Kamami, Gotronik, sklep.msalamon.pl, Allegro). Rzeczywiste ceny i dostępność mogą się różnić.`,"pricing.badge":`SZACOWANA SUMA`,"pricing.subStatic":`Kompletne radio od zera (~90–110 €).<br><strong>Tylko ~155 PLN</strong>, jeśli masz już Pi 3 i filament PETG!`,"pricing.sub.3d-print.pi3":`Kompletne radio od zera (~{euroMin}–{euroMax} €).<br><strong>Tylko ~155 PLN</strong>, jeśli masz już Pi 3 i filament PETG!`,"pricing.sub.3d-print.pico":`Tania budowa na Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Tylko ~125 PLN</strong>, jeśli masz już sterownik i filament PETG!`,"pricing.sub.plywood-house.pi3":`Budowa obudowy Little House Radio (~{euroMin}–{euroMax} €).<br><strong>Tylko ~168 PLN</strong>, jeśli masz już Pi 3 i arkusz sklejki!`,"pricing.sub.plywood-house.pico":`Little House Radio z Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Tylko ~125 PLN</strong>, jeśli masz już sterownik i arkusz sklejki!`,"pricing.sub.plywood-case.pi3":`Budowa oryginalnej skrzynki ze sklejki (~{euroMin}–{euroMax} €).<br><strong>Tylko ~168 PLN</strong>, jeśli masz już Pi 3 i arkusz sklejki!`,"pricing.sub.plywood-case.pico":`Oryginalna skrzynka ze sklejki z Pico 2 WH (~{euroMin}–{euroMax} €).<br><strong>Tylko ~125 PLN</strong>, jeśli masz już sterownik i arkusz sklejki!`,"pricing.caseLabel":`Obudowa`,"pricing.case.3d":`Obudowa z druku 3D`,"pricing.case.house":`Sklejka (Little House Radio)`,"pricing.case.original":`Sklejka (oryginalna skrzynka)`,"pricing.controllerLabel":`Elementy`,"pricing.controller.pi":`Na bazie Raspberry Pi 3`,"pricing.controller.pico":`Na bazie Pico`,"pricing.caption":`Elementy z polskich sklepów elektronicznych · kliknij nagłówek, aby sortować · odnośniki otwierają się w nowej karcie.`,"table.component":`Element`,"table.function":`Funkcja w urządzeniu`,"table.price":`Szacowana cena`,"table.where":`Gdzie szukać (PL)`,"cloud.details.hw":`Wymiary sprzętu i weryfikacja`,"cloud.details.hwLead":`Rysunki producenta określają Pi i LCD. Wymiary od dostawców i pozostałe kształty złączy są wstępne. Naddatek pasowania nie dowodzi wytrzymałości wydruku.`,"cloud.table.caption":`Źródła i wymiary nominalne; niepewne wymiary dostają dodatkowe 5 mm.`,"cloud.th.component":`Element`,"cloud.th.size":`Wymiar nominalny, mm`,"cloud.th.source":`Źródło / pewność`,"cloud.checksDownload":`Pobierz sprawdzenia geometrii i siatek`,"cloud.physical":`Nadal potrzebne są sprawdzenia fizyczne: cykle zatrzasków, trzymanie śrub, trzymanie baterii, upadki i temperatury pracy. Procedura jest w instrukcji złożenia.`,"cloud.details.frame":`Spis identyfikatorów ramy`,"cloud.details.frameLead":`Najedź albo stuknij widoczną powierzchnię, aby zobaczyć jej identyfikator i nazwę. Wybierz widok rozstrzelony i obróć model, żeby obejrzeć mocowania wewnętrzne. Włącz identyfikatory ramy, aby pokazać ich położenie.`,"cloud.frame.caption":`Identyfikatory opisują cechy trzech drukowanych części.`,"cloud.th.id":`ID`,"cloud.th.feature":`Cecha`,"cloud.th.part":`Część drukowana`,"plywood.eyebrow":`OBUDOWA`,"plywood.h2":`Dom dla elektroniki.`,"plywood.projectLabel":`Projekt`,"plywood.opt.house":`Little House Radio`,"plywood.opt.case":`Oryginalna skrzynka ze sklejki`,"plywood.kicker":`02 / SKLEJKA`,"plywood.modeLabel":`Widok złożenia`,"plywood.wood":`Pokaż sklejkę`,"plywood.componentLabels":`Pokaż etykiety elementów`,"plywood.note":`To siatki CAD tego projektu. Obróć model, otwórz dach albo zajrzyj do środka, aby zobaczyć, jak części do siebie pasują.`,"plywood.source":`Pliki projektu i instrukcja wykonania`,"plywood.model.house.title":`Little House Radio`,"plywood.model.house.description":`Obudowa ze sklejki z otwieranym dachem, miejscem na elektronikę i uchwytem do noszenia.`,"plywood.model.case.title":`Oryginalna skrzynka ze sklejki`,"plywood.model.case.description":`Zwarta obudowa ze sklejki 6 mm ze zdejmowaną tylną pokrywą i miejscem na Pi, ekran, przyciski i powerbank.`,"plywood.mode.assembled":`Złożone`,"plywood.mode.roof":`Dach otwarty`,"plywood.mode.inside":`W środku`,"plywood.mode.exploded":`Rozstrzelone`,"plywood.mode.internals":`W środku`,"plywood.download.eyebrow":`PAKIET WARSZTATOWY I DOKUMENTACJA`,"plywood.download.h3":`Pobierz cały projekt.`,"plywood.download.lead":`Kompletne archiwum projektu cloud-radio rozszerzone o ilustrowaną instrukcję montażu obudowy ze sklejki, konfigurację Raspberry Pi 3, atlas połączeń oraz plany 1:1 do druku.`,"plywood.download.pdf":`Instrukcja PDF <small>PDF ↙</small>`,"plywood.download.zip":`Pobierz cały projekt <small>cloud-radio.zip ↙</small>`,"plywood.inspectorDownload":`Pobierz cały projekt · cloud-radio.zip ↙`,"hw.eyebrow":`POŁĄCZENIA`,"hw.h2":`Pójdź za każdym przewodem.`,"hw.controllerLabel":`Sterownik`,"hw.opt.pi":`Raspberry Pi 3`,"hw.opt.pico":`Pico 2 WH`,"pcb.option":`Raspi 3 PCB`,"pcb.title":`Raspi 3 PCB · zintegrowany shield`,"pcb.description":`Własna płytka nad obecnym Raspberry Pi 3. ADC, wzmacniacz i dzielnik są bezpośrednio na shieldzie. Obróć model KiCad, aby obejrzeć rozmieszczenie elementów.`,"pcb.notice":`Prototyp A · eksport KiCad. Montaż, temperatura i działanie na sprzęcie wymagają sprawdzenia.`,"pcb.mode":`Widok płytki`,"pcb.assembled":`Shield na Raspberry Pi 3`,"pcb.board":`Sama płytka PCB`,"pcb.exploded":`Widok rozstrzelony`,"pcb.labels":`Pokaż elementy i złącza`,"pcb.size":`Płytka`,"pcb.layers":`Warstwy miedzi`,"pcb.mount":`Rozstaw otworów`,"pcb.envelope":`Geometria płytki i elementów pochodzi z KiCad. Raspberry Pi i dolne gniazdo są uproszczonymi obrysami. Wysokość montażu wymaga pomiaru.`,"pcb.ready":`Raspi 3 PCB · przeciągnij, aby obrócić; przewiń, aby przybliżyć. Widok samej płytki pozwala obejrzeć spód.`,"pcb.kicker":`SHIELD / PROTOTYP A`,"pcb.files":`Projekt i pliki wykonawcze`,"pcb.integration":`ADC ADS1115, wzmacniacz MAX98357A, dwa rezystory dzielnika i elementy zasilania są bezpośrednio na płytce. Pozostają trzy przewody do LCD, klawiatury i głośnika.`,"pcb.download":`Pobierz pełny prototyp · ZIP`,"pcb.schematic":`Schemat · PDF`,"pcb.step":`Model mechaniczny · STEP`,"pcb.gerbers":`Gerber + otwory · wersja robocza`,"pcb.order":`Do wyceny i przeglądu wykonawcy. Przed zamówieniem: sprawdź wysokość gniazda i dystansów, przewody JST oraz dopasowanie do obudowy. Próby elektryczne i termiczne nadal są potrzebne.`,"pcb.caption":`Elementy do montażu na shieldzie`,"pcb.ref":`Oznaczenie`,"pcb.part":`Element`,"pcb.assembly":`Montaż`,"pcb.bottom":`Spód · przewlekany`,"pcb.tht":`Góra · przewlekany`,"pcb.smt":`Góra · fabryczny SMT`,"hw.kicker":`03 / ELEKTRONIKA`,"hw.picoNotice":`Proponowane okablowanie Pico. Aplikacja linuksowa działa na Raspberry Pi; Pico wymaga osobnego firmware i dźwięku przez PIO.`,"hw.circuitLabel":`Obwód`,"hw.circuit.all":`Wszystkie połączenia`,"hw.circuit.lcd":`Wyświetlacz / SPI`,"hw.circuit.audio":`Dźwięk / I²S`,"hw.circuit.adc":`ADC / I²C`,"hw.circuit.keypad":`Przyciski / dzielnik`,"hw.circuit.power":`Zasilanie`,"hw.selected":`WYBRANE POŁĄCZENIE`,"hw.choose":`Wybierz przewód na rysunku albo w tabeli poniżej.`,"hw.clear":`Pokaż wszystkie przewody`,"hw.warning":`Odłącz zasilanie przed zmianą przewodów. Dwa rezystory 10 kΩ obniżają sygnał OUT klawiatury przed ADC A0. Minusa głośnika nie łącz z GND.`,"hw.diagramEyebrow":`SCHEMAT IDEOWY POŁĄCZEŃ`,"hw.diagramH3":`Kompletny schemat elektryczny.`,"hw.diagramLead":`Wszystkie moduły, szyny sygnałowe, dzielnik napięcia i zasilanie podłączone do 40-pinowego złącza GPIO Raspberry Pi 3. Skalowalny schemat wektorowy.`,"hw.diagramDownload":`Pobierz schemat wektorowy <small>SVG ↙</small>`,"hw.diagramAria":`Kompletny schemat połączeń elektrycznych`,"hw.diagramAlt":`Kompletny schemat elektryczny Alfa Radio z Raspberry Pi 3`,"hw.atlasEyebrow":`PEŁNY ATLAS OKABLOWANIA`,"hw.atlasH3":`Każde połączenie, oba końce.`,"hw.th.wire":`Przewód`,"hw.th.signal":`Obwód / sygnał`,"hw.th.from":`Od`,"hw.th.to":`Do`,"hw.trace":`Śledź przewód {id}`,"hw.count":`{shown} / {total} połączeń`,"controller.pi.title":`Raspberry Pi 3`,"controller.pi.description":`Działający sterownik linuksowy. Obejrzyj każde połączenie wyświetlacza, dźwięku, przycisków, ADC i zasilania.`,"controller.pico.title":`Pico 2 WH`,"controller.pico.description":`Te same peryferia, z fizycznym pinem Pico i przypisaniem GP przy każdym połączeniu sterownika.`,"wiring.caption.pi":`Okablowanie Raspberry Pi 3 · numery sterownika to fizyczne piny złącza.`,"wiring.caption.pico":`Okablowanie Pico · pin fizyczny i nazwa GP są pokazane razem. Proponowane przypisanie pinów firmware.`,"sw.eyebrow":`OPROGRAMOWANIE`,"sw.h2":`Od naciśnięcia przycisku do odpowiedzi.`,"play.eyebrow":`APLIKACJA Z RASPBERRY PI`,"play.badge":`PRZYTRZYMAJ, ABY RYSOWAĆ`,"play.title":`Ekran po lewej. Przyciski po prawej.`,"play.lead":`Lekcja alfabetu z Raspberry Pi. Naciśnij krótko dolny przycisk, aby usłyszeć literę. Przytrzymaj przez 0,6 sekundy, aby rysować. Puść, aby zatrzymać ołówek.`,"play.recordings":`Nagrania głosu zostają na Pi. Tutaj te same przyciski prowadzą tę samą lekcję.`,"play.legend.letters":`Lewo i prawo zmieniają literę i odtwarzają jej dźwięk.`,"play.legend.listen":`Górny odtwarza słuchanie i wsuwa kartę z góry.`,"play.legend.say":`Przycisk pod nimi mówi „powiedz ze mną”, czeka, a potem chwali.`,"play.legend.draw":`Naciśnij krótko dolny przycisk, aby powtórzyć dźwięk. Przytrzymaj przez 0,6 sekundy, aby zacząć lub wznowić rysowanie.`,"play.keys":`Strzałki w lewo i w prawo zmieniają litery. Spacja lub Enter powtarza dźwięk po krótkim naciśnięciu, a po przytrzymaniu rysuje.`,"play.group":`Pięć przycisków analogowych`,"play.screen":`Ekran Raspberry Pi`,"play.up":`Posłuchaj litery`,"play.left":`Poprzednia litera`,"play.right":`Następna litera`,"play.down":`Powiedz ze mną`,"play.center":`Naciśnij krótko, aby usłyszeć literę. Przytrzymaj przez 0,6 sekundy, aby rysować`,"play.loading":`Wczytywanie alfabetu…`,"play.ready":`{letter} · Gotowe`,"play.asleep":`Podświetlenie zgaszone. Naciśnij dowolny przycisk.`,"play.action.ready":`Gotowe`,"play.action.previous":`Poprzednia litera`,"play.action.next":`Następna litera`,"play.action.listen":`Słuchaj`,"play.action.say":`Powiedz ze mną`,"play.action.none":`Brak rysunku dla tej karty`,"play.drawing":`Rysuję {letter}`,"play.still":`Wciąż rysuję {letter}`,"play.phase.card":`Litera {letter} na ekranie`,"play.phase.slide":`Litera {letter} wjeżdża`,"play.phase.peek":`Zerkanie na {letter}`,"play.phase.sleep":`Ekran uśpiony`,"play.phase.intro":`Start rysowania {letter}`,"play.phase.draw":`Rysowanie {letter}`,"play.phase.paused":`Ołówek czeka przy {letter}`,"play.phase.bravo":`Brawo, {letter}`,"sw.docLabel":`Dokument`,"sw.opt.design":`Projekt`,"sw.opt.implementation":`Implementacja`,"sw.opt.teaching":`Przykład szkoleniowy (MDR)`,"sw.designKicker":`04 / PROJEKT`,"sw.designH3":`Decyzje stojące za kodem.`,"sw.designLead":`Rejestr decyzji architektonicznej dla istniejącej aplikacji Pythona działającej offline.`,"sw.designTag":`ZAPISANE`,"sw.adrPdf":`Ilustrowany ADR <small>PDF, EN ↙</small>`,"sw.adrMd":`Pobierz źródło ADR`,"sw.adrHref":`./docs/adr.pl.md`,"sw.implKicker":`04 / IMPLEMENTACJA`,"sw.implH3":`Jedna pętla. Jawne granice sprzętu.`,"sw.implLead":`Obecna aplikacja na Raspberry Pi: od startu i przygotowania mediów po wejście, wyświetlacz, dźwięk i sprzątanie.`,"sw.mermaidLink":`Źródło Mermaid`,"sw.diagram":`Diagram architektury oprogramowania`,"sw.legend.flow":`Przepływ sterowania`,"sw.legend.physical":`Sprzęt fizyczny`,"sw.legend.sim":`Symulacja`,"sw.mermaidSummary":`Przeczytaj definicję Mermaid`,"sw.teachKicker":`04 / SZKOLENIE`,"sw.teachH3":`Jak napisać ADR dla oprogramowania wyrobu medycznego.`,"sw.teachLead":`Fikcyjny przykład ćwiczeniowy. Pokazuje, co MDR, IEC 62304 i ISO 14971 dodają do zwykłego ADR.`,"sw.teachTag":`FIKCJA`,"sw.teachNotice":`<b>Materiał szkoleniowy.</b> To nie jest wyrób medyczny. Wyłącznie do celów edukacyjnych.`,"sw.teachPdf":`ADR szkoleniowy <small>PDF, EN ↙</small>`,"sw.teachMd":`Pobierz źródło ADR`,"sw.teachHref":`./docs/teaching-adr.pl.md`,"sw.teachArticle":`Materiał szkoleniowy: fikcyjny rejestr decyzji architektonicznej. To nie jest wyrób medyczny.`,"viewer.badge":`RADIO-CHMURKA / CAD DO DRUKU`,"viewer.reset":`Resetuj widok`,"viewer.resetAria":`Zresetuj kamerę`,"viewer.viewport":`Interaktywna przeglądarka 3D projektu`,"viewer.status":`Wczytywanie modelu 3D…`,"viewer.drag":`<b>Przeciągnij</b>, aby obracać <span class="separator">/</span> <b>kółko</b> przybliża`,"viewer.live":`Interaktywne 3D`,"viewer.canvasAria":`Model 3D. Przeciągnij, aby obracać, kółkiem przybliżaj, prawym przyciskiem przesuwaj.`,"status.loading":`Wczytywanie danych projektu…`,"footer.tagline":`Małe radio. Duża wyobraźnia.`,"footer.notice":`To nie jest wyrób medyczny. Wyłącznie do celów edukacyjnych.`,"footer.licenses":`Licencje bibliotek`,"footer.share":`Zrobione, aby się dzielić`,"error.view":`Nie udało się dokończyć tego widoku: {message}`,"viewer.loadingWiring":`Wczytywanie okablowania…`,"viewer.loadingCad":`Wczytywanie modelu CAD…`,"viewer.sceneCloud":`RADIO-CHMURKA / CAD DO DRUKU`,"viewer.sceneHardware":`ELEKTRONIKA / ATLAS OKABLOWANIA`,"viewer.scenePlywood":`SKLEJKA / MODEL 3D`,"viewer.readyHardware":`Wszystkie połączenia są w tabeli okablowania poniżej.`,"viewer.readyCloud":`Najedź albo stuknij, aby zobaczyć identyfikatory ramy i nazwy sprzętu · przeciągnij, aby obracać.`,"viewer.readyPlywood":`Model wczytany · przeciągnij, aby obejrzeć rzeczywistą geometrię CAD.`,"status.ready":`Gotowe · modele 3D, okablowanie i dokumenty ładują się z tej statycznej strony.`,"cloud.revision":`PETG / {revision}`,"facts.width":`Szerokość`,"facts.height":`Wysokość`,"facts.depth":`Głębokość`,"facts.material":`Materiał`,"facts.grip":`Głębokość chwytu`,"facts.battery":`Bateria`,"facts.plywood":`sklejka 6 mm`,"facts.batteryHorizontal":`Poziomo`,"cloud.checks":`{count} sprawdzeń cyfrowych zaliczonych · testy wydruku jeszcze przed nami`,"cloud.provisionalPrefix":`Wymiary wstępne · naddatek +5 mm. `,"part.front":`Skorupa przednia`,"part.rear":`Skorupa tylna`,"part.battery_door":`Drzwiczki baterii`,"selection.component":`Wybrany element: {id}`,"endpoint.picoNamed":`Pico {name}`,"endpoint.piPin":`Fizyczny pin Raspberry Pi {pin}`,"endpoint.gndJoin":`Wspólna masa`,"endpoint.v3":`Wspólne 3,3 V`,"endpoint.v5":`Wspólne USB 5 V`,"endpoint.rin":`Wejście R1`,"endpoint.join":`Złącze R1 / R2 / ADC A0`,"endpoint.rgnd":`Koniec masy R2`,"endpoint.power":`Zasilanie USB 5 V`,"endpoint.usb":`Wejście USB sterownika`,"endpoint.speakerPlus":`Głośnik +`,"endpoint.speakerMinus":`Głośnik −`,"endpoint.module.L":`LCD`,"endpoint.module.A":`ADC`,"endpoint.module.M":`Wzmacniacz`,"endpoint.module.K":`Klawiatura`,"endpoint.module.S":`Głośnik`,"group.LCD":`LCD`,"group.Audio":`Dźwięk`,"group.ADC":`ADC`,"group.Keypad":`Przyciski`,"group.Power":`Zasilanie`,"software.diagramLabel":`Architektura oprogramowania Raspberry Pi: start, skalibrowane wejście, stan odtwarzacza, wyświetlacz, dźwięk, symulacja i nadzór usługi.`,"teaching.diagramLabel":`Fikcyjna architektura Alfa-L: aplikacja ćwiczeń klasy B wysyła klatki do strażnika wyjścia klasy C, który jako jedyny steruje wyświetlaczem.`,"dev.building":`Przebudowa CAD chmurki… Ostatni poprawny model pozostaje dostępny.`,"dev.error":`Przebudowa chmurki nie powiodła się: {message}`,"colors.section":`Kolory podglądu obudowy`,"colors.eyebrow":`ZRÓB JE SWOIM`,"colors.title":`Wybierz kolory chmurki.`,"colors.hint":`Dobierz filament do podglądu.`,"colors.palettes":`Gotowe palety kolorów`,"colors.custom":`Własne kolory`,"colors.palettePrefix":`Paleta kolorów: {name}`,"colors.petg":`Kolory PETG`,"colors.partColors":`Kolory PETG: {part}`,"colors.partChoice":`Kolor, {part}: {choice}`,"colors.partColor":`Kolor, {part}`,"colors.swatch":`{part}: {color}`,"colors.customColor":`Własny kolor`,"colors.customShort":`Własny`,"colors.approximate":`Kolory na ekranie są przybliżone. `,"colors.reference":`Wzornik kolorów ↗`,"palette.cloud-blue":`Chmurowy błękit`,"palette.candy-cloud":`Cukierkowa chmurka`,"palette.mint-arcade":`Miętowy automat`,"palette.lavender-dream":`Lawendowy sen`,"palette.peach-pop":`Brzoskwiniowy pop`,"palette.lemon-fizz":`Cytrynowy mus`,"filament.black":`Czerń`,"filament.white":`Biel`,"filament.grey":`Szary`,"filament.dark-grey":`Ciemnoszary`,"filament.matte-black":`Matowa czerń`,"filament.orange":`Pomarańcz`,"filament.red":`Czerwień`,"filament.yellow":`Żółty`,"filament.gold":`Złoty`,"filament.forest-green":`Leśna zieleń`,"filament.pistachio":`Pistacja`,"filament.chalky-blue":`Kredowy błękit`,"filament.ocean-blue":`Oceaniczny błękit`,"filament.sky-blue":`Błękit nieba`,"filament.violet":`Fiolet`,"filament.terracotta":`Terakota`};for(let[e,[t,n,r]]of Object.entries({"ctrl-pi3":[`Raspberry Pi 3 Model B / B+`,`Główny sterownik z odtwarzaczem Pythona offline i silnikiem alfabetu`,`Main controller running offline Python player & alphabet engine`],"ctrl-pico":[`Raspberry Pi Pico 2 WH`,`Mikrokontroler z lekkim odtwarzaczem, dźwiękiem I2S przez PIO i LCD SPI`,`Microcontroller running lightweight player with PIO I2S audio & SPI LCD`],"periph-lcd":[`Waveshare 2″ IPS LCD (ST7789, SPI)`,`Kolorowy wyświetlacz 240×320 do animacji liter i informacji zwrotnej (SKU 17344)`,`240×320 colour display for letter animations & feedback (SKU 17344)`],"periph-keypad":[`AD-Key, analogowa klawiatura 5 przycisków`,`Pięć przednich przycisków dotykowych na jednej linii analogowej ADC`,`Five front tactile control buttons on single analog ADC line`],"periph-dac":[`MAX98357A I2S 3W, przetwornik C/A i wzmacniacz klasy D`,`Bezpośrednie cyfrowe wyjście I2S zasilające wewnętrzny głośnik`,`Direct I2S digital audio output powering the internal speaker`],"periph-adc":[`ADS1115, 16-bitowy 4-kanałowy ADC I2C`,`Przetwornik ADC o wysokiej rozdzielczości czytający dzielnik rezystorowy klawiszy`,`High-resolution ADC converter reading analog key resistor divider`],"periph-speaker":[`Głośnik uniwersalny 40 mm 4Ω 3W`,`Dźwięk z przodu obudowy, z miękką uszczelką`,`Front-firing sound reproduction with soft gasket`],"periph-powerbank":[`Powerbank Baseus 5000 mAh (płaski)`,`Wymienna bateria wewnętrzna (dokładne pasowanie: 69 × 106 × 14 mm)`,`Removable internal battery bank (exact fit: 69 × 106 × 14 mm)`],"periph-switch":[`Przełącznik zasilania (suwak / kołyskowy)`,`Główny wyłącznik baterii na górnym barku z tyłu`,`Main battery power disconnect switch on rear upper shoulder`],"case-3d-filament":[`Filament PETG, szpula 1 kg`,`Rosa3D / Devil Design / Fiberlogy na trwałe skorupy do druku (potrzeba ~440 g)`,`Rosa3D / Devil Design / Fiberlogy for durable printable shells (~440 g needed)`],"case-3d-fasteners":[`Śruby, płytka uniwersalna i okablowanie`,`3× M3×55, 1× M3×12, 4× nakrętki M3, 8× wkręty M2,5×6, rezystory 10 kΩ, płytka, opaski`,`3× M3×55, 1× M3×12, 4× M3 nuts, 8× M2.5×6 screws, 10kΩ resistors, perfboard, cable ties`],"case-ply-house-sheet":[`Sklejka brzozowa 6 mm (arkusz 600 × 400 mm)`,`Korpus, otwierany dach i uchwyt wycinane laserem albo frezowane CNC`,`Laser-cut or CNC milled body, opening roof & carry handle`],"case-ply-house-hw":[`Okucia: mosiężne zawiasy, uchwyt i wkręty`,`2× mosiężne zawiasy dachu, drewniany kołek uchwytu, magnesy i wkręty M3 do drewna`,`2× brass hinges for opening roof, wooden handle dowel, magnets & M3 wood screws`],"case-ply-house-wiring":[`Płytka uniwersalna, rezystory i okablowanie wewnętrzne`,`Płytka nośna DAC/ADC, 2× rezystory 10 kΩ dzielnika i silikonowe przewody`,`Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires`],"case-ply-case-sheet":[`Sklejka brzozowa 6 mm (arkusz 600 × 300 mm)`,`Laserowo cięty front, żebra ramy i zdejmowana tylna pokrywa`,`Laser-cut front faceplate, frame ribs and removable rear cover`],"case-ply-case-hw":[`Okucia: mosiężne dystanse, kątowniki i wkręty`,`4× mosiężne dystanse M3, kątowniki narożne i śruby maszynowe do montażu`,`4× M3 brass standoffs, corner brackets & machine screws for mounting`],"case-ply-case-wiring":[`Płytka uniwersalna, rezystory i okablowanie wewnętrzne`,`Płytka nośna DAC/ADC, 2× rezystory 10 kΩ dzielnika i silikonowe przewody`,`Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires`]})){let i={"ctrl-pi3":`Raspberry Pi 3 Model B / B+`,"ctrl-pico":`Raspberry Pi Pico 2 WH`,"periph-lcd":`Waveshare 2″ IPS LCD (ST7789, SPI)`,"periph-keypad":`AD-Key 5-button analog keypad`,"periph-dac":`MAX98357A I2S 3W Class-D DAC & Amp`,"periph-adc":`ADS1115 16-bit 4-channel I2C ADC`,"periph-speaker":`Universal speaker 40 mm 4Ω 3W`,"periph-powerbank":`Baseus 5000 mAh power bank (slim)`,"periph-switch":`Power switch (slide / rocker)`,"case-3d-filament":`PETG filament 1 kg spool`,"case-3d-fasteners":`Fasteners, perfboard & wiring`,"case-ply-house-sheet":`Birch plywood 6 mm sheet (600 × 400 mm)`,"case-ply-house-hw":`Hardware: brass hinges, handle & screws`,"case-ply-house-wiring":`Perfboard, resistors & internal wiring`,"case-ply-case-sheet":`Birch plywood 6 mm sheet (600 × 300 mm)`,"case-ply-case-hw":`Hardware: brass standoffs, brackets & screws`,"case-ply-case-wiring":`Perfboard, resistors & internal wiring`}[e];o.en[`item.${e}.name`]=i,o.en[`item.${e}.function`]=r,s[`item.${e}.name`]=t,s[`item.${e}.function`]=n}for(let[e,t]of Object.entries({"3d-print":{en:[`FILAMENT USAGE`,`3D Print filament estimation`,`PETG · ~440 g total`,`Calculated from the production CAD solid models for PETG (density 1.27 g/cm³), sliced with 0.4 mm nozzle, 0.2 mm layer height, 5 perimeters (2.0 mm wall), 6 top/bottom layers, and 25% infill:`,[[`Front shell (F-00)`,`~195 g`,`Solid volume: 208 cm³`],[`Rear shell (R-00)`,`~165 g`,`Solid volume: 170 cm³`],[`Battery door (B-00)`,`~32 g`,`Solid volume: 34 cm³`],[`Supports & brim`,`~45–55 g`,`Bed supports & 2 mm brim`],[`Spool requirement`,`1 × 1 kg spool`,`~59 – 79 PLN · covers build + tests`]]],pl:[`ZUŻYCIE FILAMENTU`,`Szacunek filamentu do druku 3D`,`PETG · ~440 g łącznie`,`Obliczone z produkcyjnych brył CAD dla PETG (gęstość 1,27 g/cm³), ciętych dyszą 0,4 mm, warstwą 0,2 mm, 5 obrysami (ścianka 2,0 mm), 6 warstwami góra/dół i wypełnieniem 25%:`,[[`Skorupa przednia (F-00)`,`~195 g`,`Objętość bryły: 208 cm³`],[`Skorupa tylna (R-00)`,`~165 g`,`Objętość bryły: 170 cm³`],[`Drzwiczki baterii (B-00)`,`~32 g`,`Objętość bryły: 34 cm³`],[`Podpory i brim`,`~45–55 g`,`Podpory na stole i brim 2 mm`],[`Potrzebna szpula`,`1 × szpula 1 kg`,`~59 – 79 PLN · budowa i testy`]]]},"plywood-house":{en:[`MATERIAL USAGE`,`Little House Radio plywood estimation`,`6 mm Birch plywood · ~1.2 kg`,`Calculated from the 2D DXF cut sheets for 6 mm birch plywood panels, with kerf compensation for laser cutting or 2 mm CNC router bit:`,[[`Body & walls`,`6 panels`,`Front, back, 2 sides, base, divider`],[`Opening roof`,`2 panels`,`Pitched lid with hinge mounts`],[`Carry handle`,`3 pieces`,`Curved wood handle & side braces`],[`Internal shelf`,`1 panel`,`Removable floor with battery slot`],[`Sheet requirement`,`1 × 600×400 mm`,`~35 – 50 PLN · single plywood sheet`]]],pl:[`ZUŻYCIE MATERIAŁU`,`Szacunek sklejki Little House Radio`,`Sklejka brzozowa 6 mm · ~1,2 kg`,`Obliczone z arkuszy cięcia DXF dla paneli sklejki brzozowej 6 mm, z kompensacją szczeliny lasera albo frezu CNC 2 mm:`,[[`Korpus i ściany`,`6 paneli`,`Przód, tył, 2 boki, dno, przegroda`],[`Otwierany dach`,`2 panele`,`Spadzista pokrywa z mocowaniami zawiasów`],[`Uchwyt`,`3 części`,`Wygięty drewniany uchwyt i boczne wzmocnienia`],[`Półka wewnętrzna`,`1 panel`,`Wyjmowane dno ze szczeliną na baterię`],[`Potrzebny arkusz`,`1 × 600×400 mm`,`~35 – 50 PLN · jeden arkusz sklejki`]]]},"plywood-case":{en:[`MATERIAL USAGE`,`Original plywood case material estimation`,`6 mm Birch plywood · ~0.9 kg`,`Calculated from the 2D DXF cut sheets for 6 mm birch plywood panels with laser-cut finger joints and brass standoff hardware:`,[[`Front faceplate`,`1 panel`,`Screen & 5-button key openings`],[`Perimeter frame`,`4 panels`,`Finger-jointed side walls`],[`Rear slide cover`,`1 panel`,`Removable back with ventilation`],[`Internal brackets`,`4 mounts`,`Brass standoff mounting blocks`],[`Sheet requirement`,`1 × 600×300 mm`,`~30 – 45 PLN · single plywood sheet`]]],pl:[`ZUŻYCIE MATERIAŁU`,`Szacunek materiału oryginalnej skrzynki`,`Sklejka brzozowa 6 mm · ~0,9 kg`,`Obliczone z arkuszy cięcia DXF dla paneli sklejki brzozowej 6 mm, z laserowymi złączami palcowymi i mosiężnymi dystansami:`,[[`Płyta czołowa`,`1 panel`,`Otwory na ekran i 5 przycisków`],[`Rama obwodu`,`4 panele`,`Ściany boczne na złącza palcowe`],[`Tylna pokrywa`,`1 panel`,`Zdejmowany tył z wentylacją`],[`Wsporniki wewnętrzne`,`4 mocowania`,`Klocki pod mosiężne dystanse`],[`Potrzebny arkusz`,`1 × 600×300 mm`,`~30 – 45 PLN · jeden arkusz sklejki`]]]}}))for(let n of[`en`,`pl`]){let r=n===`en`?o.en:s,[i,a,c,l,u]=t[n];r[`material.${e}.section`]=i,r[`material.${e}.title`]=a,r[`material.${e}.badge`]=c,r[`material.${e}.desc`]=l,u.forEach(([t,n,i],a)=>{r[`material.${e}.s${a}.dt`]=t,r[`material.${e}.s${a}.dd`]=n,r[`material.${e}.s${a}.small`]=i})}o.pl={...o.en,...s};function c(){return typeof document>`u`||document.documentElement.lang===`en`?`en`:`pl`}function l(e,t={}){let n=o[c()]?.[e]??o.en[e];if(n==null)return e;for(let[e,r]of Object.entries(t))n=n.replaceAll(`{${e}}`,String(r));return n}function u(e){if(typeof e!=`string`||c()!==`pl`)return e;if(Object.prototype.hasOwnProperty.call(i,e))return i[e];if(e.startsWith(`http://`)||e.startsWith(`https://`))return e;let t=e;for(let[e,n]of a)t=t.replaceAll(e,n);return t}var d=[`front`,`rear`,`battery_door`],f=[[`cloud-blue`,[`#86bfea`,`#70acd9`,`#fff0b5`]],[`candy-cloud`,[`#ffd6e6`,`#d7c6f5`,`#fff0b5`]],[`mint-arcade`,[`#bcebd8`,`#a9cde7`,`#ffd2a8`]],[`lavender-dream`,[`#d9ccf3`,`#b7c7ed`,`#f6c8dc`]],[`peach-pop`,[`#ffd2b7`,`#efb6c3`,`#bcebd8`]],[`lemon-fizz`,[`#fff0ad`,`#c9e9db`,`#cbbef0`]]],p=[[`black`,`#292b2b`],[`white`,`#e5e0e1`],[`grey`,`#95908c`],[`dark-grey`,`#3f4646`],[`matte-black`,`#303635`],[`orange`,`#eb5403`],[`red`,`#bb2e32`],[`yellow`,`#f2b706`],[`gold`,`#9a8523`],[`forest-green`,`#007248`],[`pistachio`,`#93a682`],[`chalky-blue`,`#6f9aa9`],[`ocean-blue`,`#1a4c54`],[`sky-blue`,`#346ce3`],[`violet`,`#1d1991`],[`terracotta`,`#b87f69`]],m=`alfa.cloud-colors.v1`;function h(e){return l(`part.${e}`)}function g(e){return l(`filament.${e}`)}function _(e,t){let n=Object.fromEntries(d.map((e,t)=>[e,f[0][1][t]]));try{let e=JSON.parse(localStorage.getItem(m));[[`#dae9ed`,`#b7d2da`,`#f3c96d`],[`#b9dcf5`,`#a9cde7`,`#fff0b5`]].some(t=>d.every((n,r)=>e?.[n]?.toLowerCase()===t[r]))&&(e=null);for(let t of d)/^#[\da-f]{6}$/i.test(e?.[t])&&(n[t]=e[t].toLowerCase())}catch{}let r=document.createElement(`div`);r.className=`color-heading`;let i=document.createElement(`p`);i.className=`eyebrow`,i.textContent=l(`colors.eyebrow`);let a=document.createElement(`h3`);a.textContent=l(`colors.title`);let o=document.createElement(`p`);o.textContent=l(`colors.hint`),r.append(i,a,o);let s=document.createElement(`div`);s.className=`color-controls`;let c=document.createElement(`details`);c.className=`palette-picker`;let u=document.createElement(`summary`),_=document.createElement(`span`);_.className=`palette-current`;let v=document.createElement(`span`);v.className=`palette-name`;let y=document.createElement(`span`);y.setAttribute(`aria-hidden`,`true`),y.textContent=`⌄`,u.append(_,v,y);let b=document.createElement(`div`);b.className=`palette-options`,b.setAttribute(`aria-label`,l(`colors.palettes`)),c.append(u,b);let x=document.createElement(`div`);x.className=`part-colors`,s.append(c,x),e.replaceChildren(r,s);let S=new Map;function C(e){let t=document.createElement(`span`);t.className=`palette-swatches`,t.setAttribute(`aria-hidden`,`true`);for(let n of e){let e=document.createElement(`i`);e.style.backgroundColor=n,t.append(e)}return t}function w(){let e=d.map(e=>n[e]),r=f.find(([,t])=>t.every((t,n)=>t===e[n])),i=l(r?`palette.${r[0]}`:`colors.custom`);v.textContent=i,_.replaceChildren(C(e)),u.setAttribute(`aria-label`,l(`colors.palettePrefix`,{name:i}));for(let e of d){let{input:t,hex:r,preview:i,choice:a,summary:o,menu:s}=S.get(e);t.value=n[e],r.textContent=n[e].toUpperCase(),i.style.backgroundColor=n[e];let c=p.find(([,t])=>t===n[e]),u=c?g(c[0]):l(`colors.customShort`);a.textContent=u,o.setAttribute(`aria-label`,l(`colors.partChoice`,{part:h(e),choice:u}));for(let t of s.querySelectorAll(`[data-color]`))t.setAttribute(`aria-pressed`,String(t.dataset.color===n[e]))}for(let e of c.querySelectorAll(`button`))e.setAttribute(`aria-pressed`,String(e.dataset.palette===r?.[0]));try{localStorage.setItem(m,JSON.stringify(n))}catch{}t({...n})}for(let[e,t]of f){let r=document.createElement(`button`);r.type=`button`,r.dataset.palette=e;let i=document.createElement(`span`);i.textContent=l(`palette.${e}`),r.append(C(t),i),r.addEventListener(`click`,()=>{d.forEach((e,r)=>{n[e]=t[r]}),w(),c.open=!1,u.focus()}),b.append(r)}for(let t of d){let r=document.createElement(`details`);r.className=`part-color-picker`,r.dataset.part=t;let i=document.createElement(`summary`);i.className=`part-color-button`;let a=document.createElement(`i`);a.className=`part-swatch`,a.setAttribute(`aria-hidden`,`true`);let o=document.createElement(`span`),s=document.createElement(`strong`),u=document.createElement(`small`),d=document.createElement(`small`);s.textContent=h(t),d.className=`color-hex`,o.append(s,u,d);let f=document.createElement(`span`);f.textContent=`⌄`,f.setAttribute(`aria-hidden`,`true`),i.append(a,o,f);let m=document.createElement(`div`);m.className=`filament-menu`;let _=document.createElement(`strong`);_.className=`filament-heading`,_.textContent=l(`colors.petg`),m.append(_);let v=document.createElement(`div`);v.className=`filament-grid`,v.setAttribute(`role`,`group`),v.setAttribute(`aria-label`,l(`colors.partColors`,{part:h(t)}));for(let[e,a]of p){let o=document.createElement(`button`);o.type=`button`,o.dataset.color=a,o.className=`filament-color`,o.setAttribute(`aria-label`,l(`colors.swatch`,{part:h(t),color:g(e)}));let s=document.createElement(`i`);s.style.backgroundColor=a,s.setAttribute(`aria-hidden`,`true`);let c=document.createElement(`span`);c.textContent=g(e),o.append(s,c),o.addEventListener(`click`,()=>{n[t]=a,w(),r.open=!1,i.focus()}),v.append(o)}m.append(v);let y=document.createElement(`label`);y.className=`custom-filament-color`;let b=document.createElement(`input`);b.type=`color`,b.id=`cloud-color-${t}`,b.setAttribute(`aria-label`,l(`colors.partColor`,{part:h(t)})),y.append(b,document.createTextNode(l(`colors.customColor`))),m.append(y);let C=document.createElement(`p`);C.className=`filament-note`,C.append(document.createTextNode(l(`colors.approximate`)));let T=document.createElement(`a`);T.href=`https://help.prusa3d.com/article/hueforge-filament-transparency-values-and-hexcodes_762314`,T.textContent=l(`colors.reference`),T.target=`_blank`,T.rel=`noopener noreferrer`,C.append(T),m.append(C),r.append(i,m),x.append(r),S.set(t,{input:b,hex:d,preview:a,choice:u,summary:i,menu:m}),b.addEventListener(`input`,()=>{n[t]=b.value,w()}),r.addEventListener(`toggle`,()=>{if(r.open){c.open=!1;for(let t of e.querySelectorAll(`.part-color-picker`))t!==r&&(t.open=!1)}}),document.addEventListener(`pointerdown`,e=>{r.contains(e.target)||(r.open=!1)}),r.addEventListener(`keydown`,e=>{e.key===`Escape`&&(r.open=!1,i.focus())})}return document.addEventListener(`pointerdown`,e=>{c.contains(e.target)||(c.open=!1)}),c.addEventListener(`keydown`,e=>{e.key===`Escape`&&(c.open=!1,u.focus())}),w(),{getColors:()=>({...n})}}var v={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},y={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},b=`attached`,x=1e3,S=1001,C=1002,w=1003,T=1004,E=1005,D=1006,O=1007,k=1008,A=1009,ee=1010,j=1011,te=1012,ne=1013,re=1014,M=1015,ie=1016,ae=1017,oe=1018,se=1020,N=35902,ce=35899,le=1021,P=1022,F=1023,ue=1026,de=1027,fe=1028,pe=1029,me=1030,he=1031,ge=1033,_e=33776,ve=33777,ye=33778,be=33779,xe=35840,Se=35841,Ce=35842,we=35843,Te=36196,Ee=37492,De=37496,Oe=37488,ke=37489,Ae=37490,je=37491,Me=37808,I=37809,Ne=37810,Pe=37811,Fe=37812,L=37813,Ie=37814,R=37815,z=37816,Le=37817,Re=37818,ze=37819,Be=37820,Ve=37821,He=36492,Ue=36494,We=36495,Ge=36283,Ke=36284,qe=36285,Je=36286,Ye=2300,Xe=2301,Ze=2302,Qe=2303,$e=2400,et=2401,tt=2402,nt=2500,rt=3200,it=`srgb`,at=`srgb-linear`,ot=`linear`,st=`srgb`,ct=7680,lt=35044,ut=2e3;function dt(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function ft(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function pt(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function mt(){let e=pt(`canvas`);return e.style.display=`block`,e}var ht={};function gt(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function _t(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function B(...e){e=_t(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function V(...e){e=_t(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function vt(...e){let t=e.join(` `);t in ht||(ht[t]=!0,B(...e))}function yt(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var bt={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},xt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},St=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Ct=1234567,wt=Math.PI/180,Tt=180/Math.PI;function Et(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(St[e&255]+St[e>>8&255]+St[e>>16&255]+St[e>>24&255]+`-`+St[t&255]+St[t>>8&255]+`-`+St[t>>16&15|64]+St[t>>24&255]+`-`+St[n&63|128]+St[n>>8&255]+`-`+St[n>>16&255]+St[n>>24&255]+St[r&255]+St[r>>8&255]+St[r>>16&255]+St[r>>24&255]).toLowerCase()}function H(e,t,n){return Math.max(t,Math.min(n,e))}function Dt(e,t){return(e%t+t)%t}function Ot(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function kt(e,t,n){return e===t?0:(n-e)/(t-e)}function At(e,t,n){return(1-n)*e+n*t}function jt(e,t,n,r){return At(e,t,1-Math.exp(-n*r))}function Mt(e,t=1){return t-Math.abs(Dt(e,t*2)-t)}function Nt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Pt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Ft(e,t){return e+Math.floor(Math.random()*(t-e+1))}function It(e,t){return e+Math.random()*(t-e)}function Lt(e){return e*(.5-Math.random())}function Rt(e){e!==void 0&&(Ct=e);let t=Ct+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function zt(e){return e*wt}function Bt(e){return e*Tt}function Vt(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Ht(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Ut(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Wt(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:B(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Gt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function U(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var Kt={DEG2RAD:wt,RAD2DEG:Tt,generateUUID:Et,clamp:H,euclideanModulo:Dt,mapLinear:Ot,inverseLerp:kt,lerp:At,damp:jt,pingpong:Mt,smoothstep:Nt,smootherstep:Pt,randInt:Ft,randFloat:It,randFloatSpread:Lt,seededRandom:Rt,degToRad:zt,radToDeg:Bt,isPowerOfTwo:Vt,ceilPowerOfTwo:Ht,floorPowerOfTwo:Ut,setQuaternionFromProperEuler:Wt,normalize:U,denormalize:Gt},W=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(H(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},qt=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:B(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(H(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Yt.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Yt.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this.z=H(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this.z=H(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Jt.copy(this).projectOnVector(e),this.sub(Jt)}reflect(e){return this.sub(Jt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(H(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Jt=new G,Yt=new qt,K=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return vt(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Xt.makeScale(e,t)),this}rotate(e){return vt(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Xt.makeRotation(-e)),this}translate(e,t){return vt(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Xt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Xt=new K,Zt=new K().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Qt=new K().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function $t(){let e={enabled:!0,workingColorSpace:at,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=en(e.r),e.g=en(e.g),e.b=en(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=tn(e.r),e.g=tn(e.g),e.b=tn(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ot:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return vt(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return vt(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[at]:{primaries:t,whitePoint:r,transfer:ot,toXYZ:Zt,fromXYZ:Qt,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:it},outputColorSpaceConfig:{drawingBufferColorSpace:it}},[it]:{primaries:t,whitePoint:r,transfer:st,toXYZ:Zt,fromXYZ:Qt,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:it}}}),e}var q=$t();function en(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function tn(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var nn,rn=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{nn===void 0&&(nn=pt(`canvas`)),nn.width=e.width,nn.height=e.height;let t=nn.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=nn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=pt(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=en(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(en(t[e]/255)*255):t[e]=en(t[e]);return{data:t,width:e.width,height:e.height}}return B(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},an=0,on=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:an++}),this.uuid=Et(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(sn(r[t].image)):e.push(sn(r[t]))}else e=sn(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function sn(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?rn.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(B(`Texture: Unable to serialize Texture.`),{})}var cn=0,ln=new G,un=class e extends xt{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=S,i=S,a=D,o=k,s=F,c=A,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:cn++}),this.uuid=Et(),this.name=``,this.source=new on(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new W(0,0),this.repeat=new W(1,1),this.center=new W(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new K,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ln).x}get height(){return this.source.getSize(ln).y}get depth(){return this.source.getSize(ln).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){B(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?B(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case x:e.x-=Math.floor(e.x);break;case S:e.x=e.x<0?0:1;break;case C:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case x:e.y-=Math.floor(e.y);break;case S:e.y=e.y<0?0:1;break;case C:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};un.DEFAULT_IMAGE=null,un.DEFAULT_MAPPING=300,un.DEFAULT_ANISOTROPY=1;var dn=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this.z=H(this.z,e.z,t.z),this.w=H(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this.z=H(this.z,e,t),this.w=H(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},fn=class extends xt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:D,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new dn(0,0,e,t),this.scissorTest=!1,this.viewport=new dn(0,0,e,t),this.textures=[];let r=new un({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:D,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new on(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},pn=class extends fn{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},mn=class extends un{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=w,this.minFilter=w,this.wrapR=S,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},hn=class extends un{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=w,this.minFilter=w,this.wrapR=S,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},J=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/gn.setFromMatrixColumn(e,0).length(),i=1/gn.setFromMatrixColumn(e,1).length(),a=1/gn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(vn,e,yn)}lookAt(e,t,n){let r=this.elements;return Sn.subVectors(e,t),Sn.lengthSq()===0&&(Sn.z=1),Sn.normalize(),bn.crossVectors(n,Sn),bn.lengthSq()===0&&(Math.abs(n.z)===1?Sn.x+=1e-4:Sn.z+=1e-4,Sn.normalize(),bn.crossVectors(n,Sn)),bn.normalize(),xn.crossVectors(Sn,bn),r[0]=bn.x,r[4]=xn.x,r[8]=Sn.x,r[1]=bn.y,r[5]=xn.y,r[9]=Sn.y,r[2]=bn.z,r[6]=xn.z,r[10]=Sn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],ee=r[10],j=r[14],te=r[3],ne=r[7],re=r[11],M=r[15];return i[0]=a*x+o*T+s*k+c*te,i[4]=a*S+o*E+s*A+c*ne,i[8]=a*C+o*D+s*ee+c*re,i[12]=a*w+o*O+s*j+c*M,i[1]=l*x+u*T+d*k+f*te,i[5]=l*S+u*E+d*A+f*ne,i[9]=l*C+u*D+d*ee+f*re,i[13]=l*w+u*O+d*j+f*M,i[2]=p*x+m*T+h*k+g*te,i[6]=p*S+m*E+h*A+g*ne,i[10]=p*C+m*D+h*ee+g*re,i[14]=p*w+m*O+h*j+g*M,i[3]=_*x+v*T+y*k+b*te,i[7]=_*S+v*E+y*A+b*ne,i[11]=_*C+v*D+y*ee+b*re,i[15]=_*w+v*O+y*j+b*M,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=gn.set(r[0],r[1],r[2]).length(),o=gn.set(r[4],r[5],r[6]).length(),s=gn.set(r[8],r[9],r[10]).length();i<0&&(a=-a),_n.copy(this);let c=1/a,l=1/o,u=1/s;return _n.elements[0]*=c,_n.elements[1]*=c,_n.elements[2]*=c,_n.elements[4]*=l,_n.elements[5]*=l,_n.elements[6]*=l,_n.elements[8]*=u,_n.elements[9]*=u,_n.elements[10]*=u,t.setFromRotationMatrix(_n),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=ut,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=ut,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},gn=new G,_n=new J,vn=new G(0,0,0),yn=new G(1,1,1),bn=new G,xn=new G,Sn=new G,Cn=new J,wn=new qt,Tn=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(H(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-H(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(H(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-H(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(H(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-H(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:B(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Cn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Cn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return wn.setFromEuler(this),this.setFromQuaternion(wn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Tn.DEFAULT_ORDER=`XYZ`;var En=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Dn=0,On=new G,kn=new qt,An=new J,jn=new G,Mn=new G,Nn=new G,Pn=new qt,Fn=new G(1,0,0),In=new G(0,1,0),Ln=new G(0,0,1),Rn={type:`added`},zn={type:`removed`},Bn={type:`childadded`,child:null},Vn={type:`childremoved`,child:null},Hn=class e extends xt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Dn++}),this.uuid=Et(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new G,n=new Tn,r=new qt,i=new G(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new J},normalMatrix:{value:new K}}),this.matrix=new J,this.matrixWorld=new J,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new En,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return kn.setFromAxisAngle(e,t),this.quaternion.multiply(kn),this}rotateOnWorldAxis(e,t){return kn.setFromAxisAngle(e,t),this.quaternion.premultiply(kn),this}rotateX(e){return this.rotateOnAxis(Fn,e)}rotateY(e){return this.rotateOnAxis(In,e)}rotateZ(e){return this.rotateOnAxis(Ln,e)}translateOnAxis(e,t){return On.copy(e).applyQuaternion(this.quaternion),this.position.add(On.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Fn,e)}translateY(e){return this.translateOnAxis(In,e)}translateZ(e){return this.translateOnAxis(Ln,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(An.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?jn.copy(e):jn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Mn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?An.lookAt(Mn,jn,this.up):An.lookAt(jn,Mn,this.up),this.quaternion.setFromRotationMatrix(An),r&&(An.extractRotation(r.matrixWorld),kn.setFromRotationMatrix(An),this.quaternion.premultiply(kn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(V(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Rn),Bn.child=e,this.dispatchEvent(Bn),Bn.child=null):V(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(zn),Vn.child=e,this.dispatchEvent(Vn),Vn.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),An.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),An.multiply(e.parent.matrixWorld)),e.applyMatrix4(An),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Rn),Bn.child=e,this.dispatchEvent(Bn),Bn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mn,e,Nn),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mn,Pn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Hn.DEFAULT_UP=new G(0,1,0),Hn.DEFAULT_MATRIX_AUTO_UPDATE=!0,Hn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Un=class extends Hn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Wn={type:`move`},Gn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Un,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Un,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Un,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Wn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Un;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Kn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},qn={h:0,s:0,l:0},Jn={h:0,s:0,l:0};function Yn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Y=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=it){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,q.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=q.workingColorSpace){return this.r=e,this.g=t,this.b=n,q.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=q.workingColorSpace){if(e=Dt(e,1),t=H(t,0,1),n=H(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Yn(i,r,e+1/3),this.g=Yn(i,r,e),this.b=Yn(i,r,e-1/3)}return q.colorSpaceToWorking(this,r),this}setStyle(e,t=it){function n(t){t!==void 0&&parseFloat(t)<1&&B(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:B(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);B(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=it){let n=Kn[e.toLowerCase()];return n===void 0?B(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=en(e.r),this.g=en(e.g),this.b=en(e.b),this}copyLinearToSRGB(e){return this.r=tn(e.r),this.g=tn(e.g),this.b=tn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=it){return q.workingToColorSpace(Xn.copy(this),e),Math.round(H(Xn.r*255,0,255))*65536+Math.round(H(Xn.g*255,0,255))*256+Math.round(H(Xn.b*255,0,255))}getHexString(e=it){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=q.workingColorSpace){q.workingToColorSpace(Xn.copy(this),t);let n=Xn.r,r=Xn.g,i=Xn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=q.workingColorSpace){return q.workingToColorSpace(Xn.copy(this),t),e.r=Xn.r,e.g=Xn.g,e.b=Xn.b,e}getStyle(e=it){q.workingToColorSpace(Xn.copy(this),e);let t=Xn.r,n=Xn.g,r=Xn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(qn),this.setHSL(qn.h+e,qn.s+t,qn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(qn),e.getHSL(Jn);let n=At(qn.h,Jn.h,t),r=At(qn.s,Jn.s,t),i=At(qn.l,Jn.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Xn=new Y;Y.NAMES=Kn;var Zn=class extends Hn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Tn,this.environmentIntensity=1,this.environmentRotation=new Tn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Qn=new G,$n=new G,er=new G,tr=new G,nr=new G,rr=new G,ir=new G,ar=new G,or=new G,sr=new G,cr=new dn,lr=new dn,ur=new dn,dr=class e{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Qn.subVectors(e,t),r.cross(Qn);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Qn.subVectors(r,t),$n.subVectors(n,t),er.subVectors(e,t);let a=Qn.dot(Qn),o=Qn.dot($n),s=Qn.dot(er),c=$n.dot($n),l=$n.dot(er),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,tr)!==null&&tr.x>=0&&tr.y>=0&&tr.x+tr.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,tr)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,tr.x),s.addScaledVector(a,tr.y),s.addScaledVector(o,tr.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return cr.setScalar(0),lr.setScalar(0),ur.setScalar(0),cr.fromBufferAttribute(e,t),lr.fromBufferAttribute(e,n),ur.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(cr,i.x),a.addScaledVector(lr,i.y),a.addScaledVector(ur,i.z),a}static isFrontFacing(e,t,n,r){return Qn.subVectors(n,t),$n.subVectors(e,t),Qn.cross($n).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Qn.subVectors(this.c,this.b),$n.subVectors(this.a,this.b),Qn.cross($n).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;nr.subVectors(r,n),rr.subVectors(i,n),ar.subVectors(e,n);let s=nr.dot(ar),c=rr.dot(ar);if(s<=0&&c<=0)return t.copy(n);or.subVectors(e,r);let l=nr.dot(or),u=rr.dot(or);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(nr,a);sr.subVectors(e,i);let f=nr.dot(sr),p=rr.dot(sr);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(rr,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return ir.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(ir,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(nr,a).addScaledVector(rr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},fr=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(mr.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(mr.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=mr.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,mr):mr.fromBufferAttribute(r,t),mr.applyMatrix4(e.matrixWorld),this.expandByPoint(mr);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),hr.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),hr.copy(e.boundingBox)),hr.applyMatrix4(e.matrixWorld),this.union(hr)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,mr),mr.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Sr),Cr.subVectors(this.max,Sr),gr.subVectors(e.a,Sr),_r.subVectors(e.b,Sr),vr.subVectors(e.c,Sr),yr.subVectors(_r,gr),br.subVectors(vr,_r),xr.subVectors(gr,vr);let t=[0,-yr.z,yr.y,0,-br.z,br.y,0,-xr.z,xr.y,yr.z,0,-yr.x,br.z,0,-br.x,xr.z,0,-xr.x,-yr.y,yr.x,0,-br.y,br.x,0,-xr.y,xr.x,0];return!Er(t,gr,_r,vr,Cr)||(t=[1,0,0,0,1,0,0,0,1],!Er(t,gr,_r,vr,Cr))?!1:(wr.crossVectors(yr,br),t=[wr.x,wr.y,wr.z],Er(t,gr,_r,vr,Cr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,mr).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(mr).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(pr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),pr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),pr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),pr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),pr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),pr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),pr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),pr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(pr)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},pr=[new G,new G,new G,new G,new G,new G,new G,new G],mr=new G,hr=new fr,gr=new G,_r=new G,vr=new G,yr=new G,br=new G,xr=new G,Sr=new G,Cr=new G,wr=new G,Tr=new G;function Er(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Tr.fromArray(e,a);let o=i.x*Math.abs(Tr.x)+i.y*Math.abs(Tr.y)+i.z*Math.abs(Tr.z),s=t.dot(Tr),c=n.dot(Tr),l=r.dot(Tr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Dr=new G,Or=new W,kr=0,Ar=class extends xt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:kr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=lt,this.updateRanges=[],this.gpuType=M,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Or.fromBufferAttribute(this,t),Or.applyMatrix3(e),this.setXY(t,Or.x,Or.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Dr.fromBufferAttribute(this,t),Dr.applyMatrix3(e),this.setXYZ(t,Dr.x,Dr.y,Dr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Dr.fromBufferAttribute(this,t),Dr.applyMatrix4(e),this.setXYZ(t,Dr.x,Dr.y,Dr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Dr.fromBufferAttribute(this,t),Dr.applyNormalMatrix(e),this.setXYZ(t,Dr.x,Dr.y,Dr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Dr.fromBufferAttribute(this,t),Dr.transformDirection(e),this.setXYZ(t,Dr.x,Dr.y,Dr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Gt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=U(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Gt(t,this.array)),t}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Gt(t,this.array)),t}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Gt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Gt(t,this.array)),t}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array),i=U(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},jr=class extends Ar{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Mr=class extends Ar{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Nr=class extends Ar{constructor(e,t,n){super(new Float32Array(e),t,n)}},Pr=new fr,Fr=new G,Ir=new G,Lr=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Pr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fr.subVectors(e,this.center);let t=Fr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(Fr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ir.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fr.copy(e.center).add(Ir)),this.expandByPoint(Fr.copy(e.center).sub(Ir))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Rr=0,zr=new J,Br=new Hn,Vr=new G,Hr=new fr,Ur=new fr,Wr=new G,Gr=class e extends xt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Rr++}),this.uuid=Et(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(dt(e)?Mr:jr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new K().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return zr.makeRotationFromQuaternion(e),this.applyMatrix4(zr),this}rotateX(e){return zr.makeRotationX(e),this.applyMatrix4(zr),this}rotateY(e){return zr.makeRotationY(e),this.applyMatrix4(zr),this}rotateZ(e){return zr.makeRotationZ(e),this.applyMatrix4(zr),this}translate(e,t,n){return zr.makeTranslation(e,t,n),this.applyMatrix4(zr),this}scale(e,t,n){return zr.makeScale(e,t,n),this.applyMatrix4(zr),this}lookAt(e){return Br.lookAt(e),Br.updateMatrix(),this.applyMatrix4(Br.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Vr).negate(),this.translate(Vr.x,Vr.y,Vr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Nr(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&B(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new fr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)V(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Hr.setFromBufferAttribute(n),this.morphTargetsRelative?(Wr.addVectors(this.boundingBox.min,Hr.min),this.boundingBox.expandByPoint(Wr),Wr.addVectors(this.boundingBox.max,Hr.max),this.boundingBox.expandByPoint(Wr)):(this.boundingBox.expandByPoint(Hr.min),this.boundingBox.expandByPoint(Hr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&V(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Lr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)V(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new G,1/0);else if(e){let n=this.boundingSphere.center;if(Hr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ur.setFromBufferAttribute(n),this.morphTargetsRelative?(Wr.addVectors(Hr.min,Ur.min),Hr.expandByPoint(Wr),Wr.addVectors(Hr.max,Ur.max),Hr.expandByPoint(Wr)):(Hr.expandByPoint(Ur.min),Hr.expandByPoint(Ur.max))}Hr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Wr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Wr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Wr.fromBufferAttribute(a,t),o&&(Vr.fromBufferAttribute(e,t),Wr.add(Vr)),r=Math.max(r,n.distanceToSquared(Wr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&V(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){V(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Ar(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new G,s[e]=new G;let c=new G,l=new G,u=new G,d=new W,f=new W,p=new W,m=new G,h=new G;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new G,y=new G,b=new G,x=new G;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Ar(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new G,i=new G,a=new G,o=new G,s=new G,c=new G,l=new G,u=new G;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Wr.fromBufferAttribute(e,t),Wr.normalize(),e.setXYZ(t,Wr.x,Wr.y,Wr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Ar(a,r,i)}if(this.index===null)return B(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Kr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=lt,this.updateRanges=[],this.version=0,this.uuid=Et()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Et()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Et()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},qr=new G,Jr=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)qr.fromBufferAttribute(this,t),qr.applyMatrix4(e),this.setXYZ(t,qr.x,qr.y,qr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)qr.fromBufferAttribute(this,t),qr.applyNormalMatrix(e),this.setXYZ(t,qr.x,qr.y,qr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)qr.fromBufferAttribute(this,t),qr.transformDirection(e),this.setXYZ(t,qr.x,qr.y,qr.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Gt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=U(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Gt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Gt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Gt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Gt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array),i=U(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){gt(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Ar(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){gt(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Yr=new G,Xr=new G,Zr=new K,Qr=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Yr.subVectors(n,t).cross(Xr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Yr),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Zr.getNormalMatrix(e),r=this.coplanarPoint(Yr).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},$r=0,ei=class extends xt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$r++}),this.uuid=Et(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ct,this.stencilZFail=ct,this.stencilZPass=ct,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){B(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?B(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Y().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Qr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new W().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new W().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},ti=new G,ni=new G,ri=new G,ii=new G,ai=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ti)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ti.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ti.copy(this.origin).addScaledVector(this.direction,t),ti.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ni.copy(e).add(t).multiplyScalar(.5),ri.copy(t).sub(e).normalize(),ii.copy(this.origin).sub(ni);let i=e.distanceTo(t)*.5,a=-this.direction.dot(ri),o=ii.dot(this.direction),s=-ii.dot(ri),c=ii.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ni).addScaledVector(ri,d),f}intersectSphere(e,t){if(e.radius<0)return null;ti.subVectors(e.center,this.origin);let n=ti.dot(this.direction),r=ti.dot(ti)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,ti)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,ee,j,te;if(y>=b&&y>=x?(w=s,D=u,A=p,te=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,ee=_,j=v):(S=l,C=c,T=f,E=d,O=h,k=m,ee=v,j=_)):b>=x?(w=c,D=d,A=m,te=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,ee=v,j=g):(S=s,C=l,T=u,E=f,O=p,k=h,ee=g,j=v)):(w=l,D=f,A=h,te=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,ee=g,j=_):(S=c,C=s,T=d,E=u,O=m,k=p,ee=_,j=g)),w===0)return null;let ne=S/w,re=C/w,M=1/w,ie=T-ne*D,ae=E-re*D,oe=O-ne*A,se=k-re*A,N=ee-ne*te,ce=j-re*te,le=N*se-ce*oe,P=ie*ce-ae*N,F=oe*ae-se*ie;if(r){if(le<0||P<0||F<0)return null}else if((le<0||P<0||F<0)&&(le>0||P>0||F>0))return null;let ue=le+P+F;if(ue===0)return null;let de=M*(le*D+P*A+F*te);return(ue>0?de<0:de>0)?null:this.at(de/ue,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},oi=class extends ei{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Tn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},si=new J,ci=new ai,li=new Lr,ui=new G,di=new G,fi=new G,pi=new G,mi=new G,hi=new G,gi=new G,_i=new G,vi=class extends Hn{constructor(e=new Gr,t=new oi){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){hi.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(mi.fromBufferAttribute(s,e),a?hi.addScaledVector(mi,r):hi.addScaledVector(mi.sub(t),r))}t.add(hi)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),li.copy(n.boundingSphere),li.applyMatrix4(i),ci.copy(e.ray).recast(e.near),!(li.containsPoint(ci.origin)===!1&&(ci.intersectSphere(li,ui)===null||ci.origin.distanceToSquared(ui)>(e.far-e.near)**2))&&(si.copy(i).invert(),ci.copy(e.ray).applyMatrix4(si),(n.boundingBox===null||ci.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,ci)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=bi(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=bi(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=bi(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=bi(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function yi(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;_i.copy(s),_i.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(_i);return l<n.near||l>n.far?null:{distance:l,point:_i.clone(),object:e}}function bi(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,di),e.getVertexPosition(c,fi),e.getVertexPosition(l,pi);let u=yi(e,t,n,r,di,fi,pi,gi);if(u){let e=new G;dr.getBarycoord(gi,di,fi,pi,e),i&&(u.uv=dr.getInterpolatedAttribute(i,s,c,l,e,new W)),a&&(u.uv1=dr.getInterpolatedAttribute(a,s,c,l,e,new W)),o&&(u.normal=dr.getInterpolatedAttribute(o,s,c,l,e,new G),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new G,materialIndex:0};dr.getNormal(di,fi,pi,t.normal),u.face=t,u.barycoord=e}return u}var xi=new dn,Si=new dn,Ci=new dn,wi=new dn,Ti=new J,Ei=new G,Di=new Lr,Oi=new J,ki=new ai,Ai=class extends vi{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type=`SkinnedMesh`,this.bindMode=b,this.bindMatrix=new J,this.bindMatrixInverse=new J,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new fr),this.boundingBox.makeEmpty();let t=e.getAttribute(`position`);for(let e=0;e<t.count;e++)this.getVertexPosition(e,Ei),this.boundingBox.expandByPoint(Ei)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Lr),this.boundingSphere.makeEmpty();let t=e.getAttribute(`position`);for(let e=0;e<t.count;e++)this.getVertexPosition(e,Ei),this.boundingSphere.expandByPoint(Ei)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,r=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Di.copy(this.boundingSphere),Di.applyMatrix4(r),e.ray.intersectsSphere(Di)!==!1&&(Oi.copy(r).invert(),ki.copy(e.ray).applyMatrix4(Oi),(this.boundingBox===null||ki.intersectsBox(this.boundingBox)!==!1)&&this._computeIntersections(e,t,ki)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new dn,t=this.geometry.attributes.skinWeight;for(let n=0,r=t.count;n<r;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r===1/0?e.set(1,0,0,0):e.multiplyScalar(r),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===`attached`?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===`detached`?this.bindMatrixInverse.copy(this.bindMatrix).invert():B(`SkinnedMesh: Unrecognized bindMode: `+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,r=this.geometry;Si.fromBufferAttribute(r.attributes.skinIndex,e),Ci.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(xi.copy(t),t.set(0,0,0,0)):(xi.set(...t,1),t.set(0,0,0)),xi.applyMatrix4(this.bindMatrix);for(let e=0;e<4;e++){let r=Ci.getComponent(e);if(r!==0){let i=Si.getComponent(e);Ti.multiplyMatrices(n.bones[i].matrixWorld,n.boneInverses[i]),t.addScaledVector(wi.copy(xi).applyMatrix4(Ti),r)}}return t.isVector4&&(t.w=xi.w),t.applyMatrix4(this.bindMatrixInverse)}},ji=class extends Hn{constructor(){super(),this.isBone=!0,this.type=`Bone`}},Mi=class extends un{constructor(e=null,t=1,n=1,r,i,a,o,s,c=w,l=w,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ni=new J,Pi=new J,Fi=class e{constructor(e=[],t=[]){this.uuid=Et(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){B(`Skeleton: Number of inverse bone matrices does not match amount of bones.`),this.boneInverses=[];for(let e=0,t=this.bones.length;e<t;e++)this.boneInverses.push(new J)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let t=new J;this.bones[e]&&t.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(t)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let t=this.bones[e];t&&t.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let t=this.bones[e];t&&(t.parent&&t.parent.isBone?(t.matrix.copy(t.parent.matrixWorld).invert(),t.matrix.multiply(t.matrixWorld)):t.matrix.copy(t.matrixWorld),t.matrix.decompose(t.position,t.quaternion,t.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,r=this.boneTexture;for(let r=0,i=e.length;r<i;r++){let i=e[r]?e[r].matrixWorld:Pi;Ni.multiplyMatrices(i,t[r]),Ni.toArray(n,r*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new e(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new Mi(t,e,e,F,M);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,r=e.bones.length;n<r;n++){let r=e.bones[n],i=t[r];i===void 0&&(B(`Skeleton: No bone found with UUID:`,r),i=new ji),this.bones.push(i),this.boneInverses.push(new J().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:`Skeleton`,generator:`Skeleton.toJSON`},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let r=0,i=t.length;r<i;r++){let i=t[r];e.bones.push(i.uuid);let a=n[r];e.boneInverses.push(a.toArray())}return e}},Ii=class extends Ar{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Li=new J,Ri=new J,zi=[],Bi=new fr,Vi=new J,Hi=new vi,Ui=new Lr,Wi=class extends vi{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ii(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Vi)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new fr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Li),Bi.copy(e.boundingBox).applyMatrix4(Li),this.boundingBox.union(Bi)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Lr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Li),Ui.copy(e.boundingSphere).applyMatrix4(Li),this.boundingSphere.union(Ui)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Hi.geometry=this.geometry,Hi.material=this.material,Hi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ui.copy(this.boundingSphere),Ui.applyMatrix4(n),e.ray.intersectsSphere(Ui)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Li),Ri.multiplyMatrices(n,Li),Hi.matrixWorld=Ri,Hi.raycast(e,zi);for(let e=0,n=zi.length;e<n;e++){let n=zi[e];n.instanceId=i,n.object=this,t.push(n)}zi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ii(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Mi(new Float32Array(r*this.count),r,this.count,fe,M));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Gi=new Lr,Ki=new W(.5,.5),qi=new G,Ji=class{constructor(e=new Qr,t=new Qr,n=new Qr,r=new Qr,i=new Qr,a=new Qr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ut,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Gi)}intersectsSprite(e){return Gi.center.set(0,0,0),Gi.radius=.7071067811865476+Ki.distanceTo(e.center),Gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Gi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(qi.x=r.normal.x>0?e.max.x:e.min.x,qi.y=r.normal.y>0?e.max.y:e.min.y,qi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(qi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Yi=class extends ei{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new Y(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Xi=new G,Zi=new G,Qi=new J,$i=new ai,ea=new Lr,ta=new G,na=new G,ra=class extends Hn{constructor(e=new Gr,t=new Yi){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)Xi.fromBufferAttribute(t,e-1),Zi.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=Xi.distanceTo(Zi);e.setAttribute(`lineDistance`,new Nr(n,1))}else B(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ea.copy(n.boundingSphere),ea.applyMatrix4(r),ea.radius+=i,e.ray.intersectsSphere(ea)===!1)return;Qi.copy(r).invert(),$i.copy(e.ray).applyMatrix4(Qi);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=ia(this,e,$i,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=ia(this,e,$i,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=ia(this,e,$i,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=ia(this,e,$i,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ia(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(Xi.fromBufferAttribute(s,i),Zi.fromBufferAttribute(s,a),n.distanceSqToSegment(Xi,Zi,ta,na)>r)return;ta.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(ta);if(!(c<t.near||c>t.far))return{distance:c,point:na.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var aa=new G,oa=new G,sa=class extends ra{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)aa.fromBufferAttribute(t,e),oa.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+aa.distanceTo(oa);e.setAttribute(`lineDistance`,new Nr(n,1))}else B(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},ca=class extends ra{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type=`LineLoop`}},la=class extends ei{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new Y(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ua=new J,da=new ai,fa=new Lr,pa=new G,ma=class extends Hn{constructor(e=new Gr,t=new la){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),fa.copy(n.boundingSphere),fa.applyMatrix4(r),fa.radius+=i,e.ray.intersectsSphere(fa)===!1)return;ua.copy(r).invert(),da.copy(e.ray).applyMatrix4(ua);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);pa.fromBufferAttribute(l,n),ha(pa,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)pa.fromBufferAttribute(l,a),ha(pa,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ha(e,t,n,r,i,a,o){let s=da.distanceSqToPoint(e);if(s<n){let n=new G;da.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ga=class extends un{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},_a=class extends un{constructor(e,t,n=re,r,i,a,o=w,s=w,c,l=ue,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new on(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},va=class extends _a{constructor(e,t=re,n=301,r,i,a=w,o=w,s,c=ue){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ya=class extends un{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},ba=class e extends Gr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Nr(c,3)),this.setAttribute(`normal`,new Nr(l,3)),this.setAttribute(`uv`,new Nr(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new G;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},xa=class e extends Gr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Nr(u,3)),this.setAttribute(`normal`,new Nr(d,3)),this.setAttribute(`uv`,new Nr(f,2));function _(){let a=new G,_=new G,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new W,m=new G,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Sa=class e extends Gr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Nr(p,3)),this.setAttribute(`normal`,new Nr(m,3)),this.setAttribute(`uv`,new Nr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function Ca(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Ta(i))i.isRenderTargetTexture?(B(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Ta(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function wa(e){let t={};for(let n=0;n<e.length;n++){let r=Ca(e[n]);for(let e in r)t[e]=r[e]}return t}function Ta(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Ea(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Da(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:q.workingColorSpace}var Oa={clone:Ca,merge:wa},ka=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Aa=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ja=class extends ei{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ka,this.fragmentShader=Aa,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ca(e.uniforms),this.uniformsGroups=Ea(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new Y().setHex(r.value);break;case`v2`:this.uniforms[n].value=new W().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new dn().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new J().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Ma=class extends ja{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Na=class extends ei{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new Y(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Tn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Pa=class extends Na{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:``,PHYSICAL:``},this.type=`MeshPhysicalMaterial`,this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new W(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return H(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Y(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Y(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Y(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:``,PHYSICAL:``},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},Fa=class extends ei{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=rt,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ia=class extends ei{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function La(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Ra(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}function za(e){function t(t,n){return e[t]-e[n]}let n=e.length,r=Array(n);for(let e=0;e!==n;++e)r[e]=e;return r.sort(t),r}function Ba(e,t,n){let r=e.length,i=new e.constructor(r);for(let a=0,o=0;o!==r;++a){let r=n[a]*t;for(let n=0;n!==t;++n)i[o++]=e[r+n]}return i}function Va(e,t,n,r){let i=1,a=e[0];for(;a!==void 0&&a[r]===void 0;)a=e[i++];if(a===void 0)return;let o=a[r];if(o!==void 0){if(Array.isArray(o))do o=a[r],o!==void 0&&(t.push(a.time),n.push(...o)),a=e[i++];while(a!==void 0);else if(o.toArray!==void 0)do o=a[r],o!==void 0&&(t.push(a.time),o.toArray(n,n.length)),a=e[i++];while(a!==void 0);else do o=a[r],o!==void 0&&(t.push(a.time),n.push(o)),a=e[i++];while(a!==void 0)}}var Ha=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Ua=class extends Ha{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:$e,endingEnd:$e}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case et:i=e,o=2*t-n;break;case tt:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case et:a=e,s=2*n-t;break;case tt:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Wa=class extends Ha{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Ga=class extends Ha{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ka=class extends Ha{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Ya(n,t,g,y,r);i[p]=qa(x,o,_,b,m)}return i}};function qa(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ja(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Ya(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=qa(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ja(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Xa=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=La(t,this.TimeBufferType),this.values=La(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:La(e.times,Array),values:La(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Ra(e.settings)&&(n.settings={inTangents:La(e.settings.inTangents,Array),outTangents:La(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ga(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Wa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ua(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ka(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ye:t=this.InterpolantFactoryMethodDiscrete;break;case Xe:t=this.InterpolantFactoryMethodLinear;break;case Ze:t=this.InterpolantFactoryMethodSmooth;break;case Qe:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return B(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ye;case this.InterpolantFactoryMethodLinear:return Xe;case this.InterpolantFactoryMethodSmooth:return Ze;case this.InterpolantFactoryMethodBezier:return Qe}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Ra(this.settings)&&(Za(this.settings.inTangents,e),Za(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(V(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(V(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){V(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){V(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&ft(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){V(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Ze,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Ra(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Za(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Xa.prototype.ValueTypeName=``,Xa.prototype.TimeBufferType=Float32Array,Xa.prototype.ValueBufferType=Float32Array,Xa.prototype.DefaultInterpolation=Xe;var Qa=class extends Xa{constructor(e,t,n){super(e,t,n)}};Qa.prototype.ValueTypeName=`bool`,Qa.prototype.ValueBufferType=Array,Qa.prototype.DefaultInterpolation=Ye,Qa.prototype.InterpolantFactoryMethodLinear=void 0,Qa.prototype.InterpolantFactoryMethodSmooth=void 0;var $a=class extends Xa{constructor(e,t,n,r){super(e,t,n,r)}};$a.prototype.ValueTypeName=`color`;var eo=class extends Xa{constructor(e,t,n,r){super(e,t,n,r)}};eo.prototype.ValueTypeName=`number`;var to=class extends Ha{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)qt.slerpFlat(i,0,a,c-o,a,c,s);return i}},no=class extends Xa{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new to(this.times,this.values,this.getValueSize(),e)}};no.prototype.ValueTypeName=`quaternion`,no.prototype.InterpolantFactoryMethodSmooth=void 0;var ro=class extends Xa{constructor(e,t,n){super(e,t,n)}};ro.prototype.ValueTypeName=`string`,ro.prototype.ValueBufferType=Array,ro.prototype.DefaultInterpolation=Ye,ro.prototype.InterpolantFactoryMethodLinear=void 0,ro.prototype.InterpolantFactoryMethodSmooth=void 0;var io=class extends Xa{constructor(e,t,n,r){super(e,t,n,r)}};io.prototype.ValueTypeName=`vector`;var ao=class{constructor(e=``,t=-1,n=[],r=nt){this.name=e,this.tracks=n,this.duration=t,this.blendMode=r,this.uuid=Et(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,r=1/(e.fps||1);for(let e=0,i=n.length;e!==i;++e)t.push(so(n[e]).scale(r));let i=new this(e.name,e.duration,t,e.blendMode);return i.uuid=e.uuid,i.userData=JSON.parse(e.userData||`{}`),i}static toJSON(e){let t=[],n=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let e=0,r=n.length;e!==r;++e)t.push(Xa.toJSON(n[e]));return r}static CreateFromMorphTargetSequence(e,t,n,r){let i=t.length,a=[];for(let e=0;e<i;e++){let o=[],s=[];o.push((e+i-1)%i,e,(e+1)%i),s.push(0,1,0);let c=za(o);o=Ba(o,1,c),s=Ba(s,1,c),!r&&o[0]===0&&(o.push(i),s.push(s[0])),a.push(new eo(`.morphTargetInfluences[`+t[e].name+`]`,o,s).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let t=e;n=t.geometry&&t.geometry.animations||t.animations}for(let e=0;e<n.length;e++)if(n[e].name===t)return n[e];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let r={},i=/^([\w-]*?)([\d]+)$/;for(let t=0,n=e.length;t<n;t++){let n=e[t],a=n.name.match(i);if(a&&a.length>1){let e=a[1],t=r[e];t||(r[e]=t=[]),t.push(n)}}let a=[];for(let e in r)a.push(this.CreateFromMorphTargetSequence(e,r[e],t,n));return a}resetDuration(){let e=this.tracks,t=0;for(let n=0,r=e.length;n!==r;++n){let e=this.tracks[n];t=Math.max(t,e.times[e.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e&&=this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function oo(e){switch(e.toLowerCase()){case`scalar`:case`double`:case`float`:case`number`:case`integer`:return eo;case`vector`:case`vector2`:case`vector3`:case`vector4`:return io;case`color`:return $a;case`quaternion`:return no;case`bool`:case`boolean`:return Qa;case`string`:return ro}throw Error(`THREE.KeyframeTrack: Unsupported typeName: `+e)}function so(e){if(e.type===void 0)throw Error(`THREE.KeyframeTrack: track type undefined, can not parse`);let t=oo(e.type);if(e.times===void 0){let t=[],n=[];Va(e.keys,t,n,`value`),e.times=t,e.values=n}let n;return n=t.parse===void 0?new t(e.name,e.times,e.values,e.interpolation):t.parse(e),Ra(e.settings)&&(n.settings={inTangents:La(e.settings.inTangents,Float32Array),outTangents:La(e.settings.outTangents,Float32Array)}),n}var co={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(lo(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!lo(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function lo(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var uo=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},fo=class{constructor(e){this.manager=e===void 0?uo:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};fo.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var po={},mo=class extends Error{constructor(e,t){super(e),this.response=t}},ho=class extends fo{constructor(e){super(e),this.mimeType=``,this.responseType=``,this._abortController=new AbortController}load(e,t,n,r){e===void 0&&(e=``),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=co.get(`file:${e}`);if(i!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(i),this.manager.itemEnd(e)},0);return}if(po[e]!==void 0){po[e].push({onLoad:t,onProgress:n,onError:r});return}po[e]=[],po[e].push({onLoad:t,onProgress:n,onError:r});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?`include`:`same-origin`,signal:typeof AbortSignal.any==`function`?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,s=this.responseType;fetch(a).then(t=>{if(t.status===200||t.status===0){if(t.status===0&&B(`FileLoader: HTTP Status 0 received.`),typeof ReadableStream>`u`||t.body===void 0||t.body.getReader===void 0)return t;let n=po[e],r=t.body.getReader(),i=t.headers.get(`X-File-Size`)||t.headers.get(`Content-Length`),a=i?parseInt(i):0,o=a!==0,s=0,c=new ReadableStream({start(e){t();function t(){r.read().then(({done:r,value:i})=>{if(r)e.close();else{s+=i.byteLength;let r=new ProgressEvent(`progress`,{lengthComputable:o,loaded:s,total:a});for(let e=0,t=n.length;e<t;e++){let t=n[e];t.onProgress&&t.onProgress(r)}e.enqueue(i),t()}},t=>{e.error(t)})}}});return new Response(c)}throw new mo(`fetch for "${t.url}" responded with ${t.status}: ${t.statusText}`,t)}).then(e=>{switch(s){case`arraybuffer`:return e.arrayBuffer();case`blob`:return e.blob();case`document`:return e.text().then(e=>new DOMParser().parseFromString(e,o));case`json`:return e.json();default:if(o===``)return e.text();{let t=/charset="?([^;"\s]*)"?/i.exec(o),n=t&&t[1]?t[1].toLowerCase():void 0,r=new TextDecoder(n);return e.arrayBuffer().then(e=>r.decode(e))}}}).then(t=>{co.add(`file:${e}`,t);let n=po[e];delete po[e];for(let e=0,r=n.length;e<r;e++){let r=n[e];r.onLoad&&r.onLoad(t)}}).catch(t=>{let n=po[e];if(n===void 0)throw this.manager.itemError(e),t;delete po[e];for(let e=0,r=n.length;e<r;e++){let r=n[e];r.onError&&r.onError(t)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},go=new WeakMap,_o=class extends fo{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=co.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=go.get(a);e===void 0&&(e=[],go.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=pt(`img`);function s(){l(),t&&t(this);let n=go.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}go.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),co.remove(`image:${e}`);let n=go.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}go.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),co.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},vo=class extends fo{constructor(e){super(e)}load(e,t,n,r){let i=new un,a=new _o(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},yo=class extends Hn{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new Y(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},bo=class extends yo{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Hn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Y(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},xo=new J,So=new G,Co=new G,wo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new W(512,512),this.mapType=A,this.map=null,this.mapPass=null,this.matrix=new J,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ji,this._frameExtents=new W(1,1),this._viewportCount=1,this._viewports=[new dn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;So.setFromMatrixPosition(e.matrixWorld),t.position.copy(So),Co.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Co),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){xo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(xo,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(xo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},To=new G,Eo=new qt,Do=new G,Oo=class extends Hn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new J,this.projectionMatrix=new J,this.projectionMatrixInverse=new J,this.coordinateSystem=ut,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(To,Eo,Do),Do.x===1&&Do.y===1&&Do.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(To,Eo,Do.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(To,Eo,Do),Do.x===1&&Do.y===1&&Do.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(To,Eo,Do.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ko=new G,Ao=new W,jo=new W,Mo=class extends Oo{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Tt*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(wt*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Tt*2*Math.atan(Math.tan(wt*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ko.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ko.x,ko.y).multiplyScalar(-e/ko.z),ko.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ko.x,ko.y).multiplyScalar(-e/ko.z)}getViewSize(e,t){return this.getViewBounds(e,Ao,jo),t.subVectors(jo,Ao)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(wt*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},No=class extends wo{constructor(){super(new Mo(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=Tt*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,i=e.distance||t.far;(n!==t.fov||r!==t.aspect||i!==t.far)&&(t.fov=n,t.aspect=r,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},Po=class extends yo{constructor(e,t,n=0,r=Math.PI/3,i=0,a=2){super(e,t),this.isSpotLight=!0,this.type=`SpotLight`,this.position.copy(Hn.DEFAULT_UP),this.updateMatrix(),this.target=new Hn,this.distance=n,this.angle=r,this.penumbra=i,this.decay=a,this.map=null,this.shadow=new No}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},Fo=class extends wo{constructor(){super(new Mo(90,1,.5,500)),this.isPointLightShadow=!0}},Io=class extends yo{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Fo}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Lo=class extends Oo{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ro=class extends wo{constructor(){super(new Lo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},zo=class extends yo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Hn.DEFAULT_UP),this.updateMatrix(),this.target=new Hn,this.shadow=new Ro}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Bo=class{static extractUrlBase(e){let t=e.lastIndexOf(`/`);return t===-1?`./`:e.slice(0,t+1)}static resolveURL(e,t){return typeof e!=`string`||e===``?``:(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,`$1`)),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},Vo=new WeakMap,Ho=class extends fo{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>`u`&&B(`ImageBitmapLoader: createImageBitmap() not supported.`),typeof fetch>`u`&&B(`ImageBitmapLoader: fetch() not supported.`),this.options={premultiplyAlpha:`none`},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,r){e===void 0&&(e=``),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=co.get(`image-bitmap:${e}`);if(a!==void 0){if(i.manager.itemStart(e),a.then){a.then(n=>{Vo.has(a)===!0?(r&&r(Vo.get(a)),i.manager.itemError(e),i.manager.itemEnd(e)):(t&&t(n),i.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin===`anonymous`?`same-origin`:`include`,o.headers=this.requestHeader,o.signal=typeof AbortSignal.any==`function`?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let s=fetch(e,o).then(function(e){return e.blob()}).then(function(e){return createImageBitmap(e,Object.assign({},i.options,{colorSpaceConversion:`none`}))}).then(function(n){return co.add(`image-bitmap:${e}`,n),t&&t(n),i.manager.itemEnd(e),n}).catch(function(t){r&&r(t),Vo.set(s,t),co.remove(`image-bitmap:${e}`),i.manager.itemError(e),i.manager.itemEnd(e)});co.add(`image-bitmap:${e}`,s),i.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},Uo=-90,Wo=1,Go=class extends Hn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Mo(Uo,Wo,e,t);r.layers=this.layers,this.add(r);let i=new Mo(Uo,Wo,e,t);i.layers=this.layers,this.add(i);let a=new Mo(Uo,Wo,e,t);a.layers=this.layers,this.add(a);let o=new Mo(Uo,Wo,e,t);o.layers=this.layers,this.add(o);let s=new Mo(Uo,Wo,e,t);s.layers=this.layers,this.add(s);let c=new Mo(Uo,Wo,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Ko=class extends Mo{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},qo=`\\[\\]\\.:\\/`,Jo=RegExp(`[\\[\\]\\.:\\/]`,`g`),Yo=`[^\\[\\]\\.:\\/]`,Xo=`[^`+qo.replace(`\\.`,``)+`]`,Zo=`((?:WC+[\\/:])*)`.replace(`WC`,Yo),Qo=`(WCOD+)?`.replace(`WCOD`,Xo),$o=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Yo),es=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Yo),ts=RegExp(`^`+Zo+Qo+$o+es+`$`),ns=[`material`,`materials`,`bones`,`map`],rs=class{constructor(e,t,n){let r=n||is.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},is=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Jo,``)}static parseTrackName(e){let t=ts.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);ns.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){B(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){V(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){V(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){V(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){V(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){V(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){V(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){V(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;V(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){V(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){V(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};is.Composite=rs,is.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},is.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},is.prototype.GetterByBindingType=[is.prototype._getValue_direct,is.prototype._getValue_array,is.prototype._getValue_arrayElement,is.prototype._getValue_toArray],is.prototype.SetterByBindingTypeAndVersioning=[[is.prototype._setValue_direct,is.prototype._setValue_direct_setNeedsUpdate,is.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[is.prototype._setValue_array,is.prototype._setValue_array_setNeedsUpdate,is.prototype._setValue_array_setMatrixWorldNeedsUpdate],[is.prototype._setValue_arrayElement,is.prototype._setValue_arrayElement_setNeedsUpdate,is.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[is.prototype._setValue_fromArray,is.prototype._setValue_fromArray_setNeedsUpdate,is.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var as=new J,os=class{constructor(e,t,n=0,r=1/0){this.ray=new ai(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new En,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):V(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return as.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(as),this}intersectObject(e,t=!0,n=[]){return cs(e,this,n,t),n.sort(ss),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)cs(e[r],this,n,t);return n.sort(ss),n}};function ss(e,t){return e.distance-t.distance}function cs(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)cs(r[e],t,n,!0)}}var ls=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=H(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(H(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var us=class extends sa{constructor(e=10,t=10,n=4473924,r=8947848){n=new Y(n),r=new Y(r);let i=t/2,a=e/t,o=e/2,s=[],c=[];for(let e=0,l=0,u=-o;e<=t;e++,u+=a){s.push(-o,0,u,o,0,u),s.push(u,0,-o,u,0,o);let t=e===i?n:r;t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3}let l=new Gr;l.setAttribute(`position`,new Nr(s,3)),l.setAttribute(`color`,new Nr(c,3));let u=new Yi({vertexColors:!0,toneMapped:!1});super(l,u),this.type=`GridHelper`}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},ds=class extends xt{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function fs(e,t,n,r){let i=ps(r);switch(n){case le:return e*t;case fe:return e*t/i.components*i.byteLength;case pe:return e*t/i.components*i.byteLength;case me:return e*t*2/i.components*i.byteLength;case he:return e*t*2/i.components*i.byteLength;case P:return e*t*3/i.components*i.byteLength;case F:return e*t*4/i.components*i.byteLength;case ge:return e*t*4/i.components*i.byteLength;case _e:case ve:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ye:case be:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Se:case we:return Math.max(e,16)*Math.max(t,8)/4;case xe:case Ce:return Math.max(e,8)*Math.max(t,8)/2;case Te:case Ee:case Oe:case ke:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case De:case Ae:case je:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Me:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case I:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Ne:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Pe:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Fe:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case L:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Ie:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case R:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case z:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Le:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Re:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case ze:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Be:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Ve:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case He:case Ue:case We:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Ge:case Ke:return Math.ceil(e/4)*Math.ceil(t/4)*8;case qe:case Je:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function ps(e){switch(e){case A:case ee:return{byteLength:1,components:1};case te:case j:case ie:return{byteLength:2,components:1};case ae:case oe:return{byteLength:2,components:4};case re:case ne:case M:return{byteLength:4,components:1};case N:case ce:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?B(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function ms(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function hs(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var X={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Z={common:{diffuse:{value:new Y(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new K}},envmap:{envMap:{value:null},envMapRotation:{value:new K},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new K}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new K}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new K},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new K},normalScale:{value:new W(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new K},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new K}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new K}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new K}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Y(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new Y(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0},uvTransform:{value:new K}},sprite:{diffuse:{value:new Y(16777215)},opacity:{value:1},center:{value:new W(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}}},gs={basic:{uniforms:wa([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.fog]),vertexShader:X.meshbasic_vert,fragmentShader:X.meshbasic_frag},lambert:{uniforms:wa([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},envMapIntensity:{value:1}}]),vertexShader:X.meshlambert_vert,fragmentShader:X.meshlambert_frag},phong:{uniforms:wa([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},specular:{value:new Y(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:X.meshphong_vert,fragmentShader:X.meshphong_frag},standard:{uniforms:wa([Z.common,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.roughnessmap,Z.metalnessmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag},toon:{uniforms:wa([Z.common,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.gradientmap,Z.fog,Z.lights,{emissive:{value:new Y(0)}}]),vertexShader:X.meshtoon_vert,fragmentShader:X.meshtoon_frag},matcap:{uniforms:wa([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,{matcap:{value:null}}]),vertexShader:X.meshmatcap_vert,fragmentShader:X.meshmatcap_frag},points:{uniforms:wa([Z.points,Z.fog]),vertexShader:X.points_vert,fragmentShader:X.points_frag},dashed:{uniforms:wa([Z.common,Z.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:X.linedashed_vert,fragmentShader:X.linedashed_frag},depth:{uniforms:wa([Z.common,Z.displacementmap]),vertexShader:X.depth_vert,fragmentShader:X.depth_frag},normal:{uniforms:wa([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,{opacity:{value:1}}]),vertexShader:X.meshnormal_vert,fragmentShader:X.meshnormal_frag},sprite:{uniforms:wa([Z.sprite,Z.fog]),vertexShader:X.sprite_vert,fragmentShader:X.sprite_frag},background:{uniforms:{uvTransform:{value:new K},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:X.background_vert,fragmentShader:X.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new K}},vertexShader:X.backgroundCube_vert,fragmentShader:X.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:X.cube_vert,fragmentShader:X.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:X.equirect_vert,fragmentShader:X.equirect_frag},distance:{uniforms:wa([Z.common,Z.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:X.distance_vert,fragmentShader:X.distance_frag},shadow:{uniforms:wa([Z.lights,Z.fog,{color:{value:new Y(0)},opacity:{value:1}}]),vertexShader:X.shadow_vert,fragmentShader:X.shadow_frag}};gs.physical={uniforms:wa([gs.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new K},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new K},clearcoatNormalScale:{value:new W(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new K},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new K},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new K},sheen:{value:0},sheenColor:{value:new Y(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new K},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new K},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new K},transmissionSamplerSize:{value:new W},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new K},attenuationDistance:{value:0},attenuationColor:{value:new Y(0)},specularColor:{value:new Y(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new K},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new K},anisotropyVector:{value:new W},anisotropyMap:{value:null},anisotropyMapTransform:{value:new K}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag};var _s={r:0,b:0,g:0},vs=new J,ys=new K;ys.set(-1,0,0,0,1,0,0,0,1);function bs(e,t,n,r,i,a){let o=new Y(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new vi(new ba(1,1,1),new ja({name:`BackgroundCubeMaterial`,uniforms:Ca(gs.backgroundCube.uniforms),vertexShader:gs.backgroundCube.vertexShader,fragmentShader:gs.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(vs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(ys),l.material.toneMapped=q.getTransfer(i.colorSpace)!==st,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new vi(new Sa(2,2),new ja({name:`BackgroundMaterial`,uniforms:Ca(gs.background.uniforms),vertexShader:gs.background.vertexShader,fragmentShader:gs.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=q.getTransfer(i.colorSpace)!==st,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(_s,Da(e)),n.buffers.color.setClear(_s.r,_s.g,_s.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function xs(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Ss(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Cs(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(B(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&B(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function ws(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Qr,s=new K,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Ts=4,Es=6,Ds=20,Os=256,ks=new Lo,As=new Y,js=null,Ms=0,Ns=0,Ps=!1,Fs=new G,Is=new G,Ls=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Fs}=i;js=this._renderer.getRenderTarget(),Ms=this._renderer.getActiveCubeFace(),Ns=this._renderer.getActiveMipmapLevel(),Ps=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ws(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Us(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(js,Ms,Ns),this._renderer.xr.enabled=Ps,e.scissorTest=!1,Bs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),js=this._renderer.getRenderTarget(),Ms=this._renderer.getActiveCubeFace(),Ns=this._renderer.getActiveMipmapLevel(),Ps=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:D,minFilter:D,generateMipmaps:!1,type:ie,format:F,colorSpace:at,depthBuffer:!1},r=zs(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zs(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Rs(r)),this._blurMaterial=Hs(r,e,t),this._ggxMaterial=Vs(r,e,t)}return r}_compileMaterial(e){let t=new vi(new Gr,e);this._renderer.compile(t,ks)}_sceneToCubeUV(e,t,n,r,i){let a=new Mo(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(As),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new vi(new ba,new oi({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(As),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Bs(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ws()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Us());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Bs(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,ks)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-Ts?n-d+Ts:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Bs(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,ks),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Bs(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,ks)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Bs(t,3*l*(r>this._lodMax-Ts?r-this._lodMax+Ts:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,ks)}};function Rs(e){let t=[],n=[],r=e,i=e-Ts+1+Es;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Is.set(1,r,n):e===1?Is.set(-n,1,-r):e===2?Is.set(-n,r,1):e===3?Is.set(-1,r,-n):e===4?Is.set(-n,-1,r):Is.set(n,r,-1),Is.toArray(l,(e*6+t)*3)}}let u=new Gr;u.setAttribute(`position`,new Ar(c,3)),u.setAttribute(`outputDirection`,new Ar(l,3)),n.push(new vi(u,null)),r>Ts&&r--}return{lodMeshes:n,sizeLods:t}}function zs(e,t,n){let r=new pn(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Bs(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Vs(e,t,n){return new ja({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:Os,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Hs(e,t,n){return new ja({name:`SphericalGaussianBlur`,defines:{SAMPLES:Ds,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Us(){return new ja({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Ws(){return new ja({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Gs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ks=class extends pn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ga(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new ba(5,5,5),i=new ja({name:`CubemapFromEquirect`,uniforms:Ca(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new vi(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=D),new Go(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function qs(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Ks(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Ls(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Ls(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Js(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&vt(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Ys(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0||(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++),t}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?Mr:jr)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Xs(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Zs(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:V(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Qs(e,t,n){let r=new WeakMap,i=new dn;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new mn(h,p,m,u);g.type=M,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new W(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function $s(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var ec={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function tc(e,t,n,r,i,a){let o=new pn(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Gr;l.setAttribute(`position`,new Nr([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new Nr([0,2,0,0,2,0],2));let u=new Ma({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new vi(l,u),f=new Lo(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new pn(t,n,{type:ie,depthBuffer:!1,stencilBuffer:!1}),c=new pn(t,n,{type:ie,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},q.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=ec[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var nc=new un,rc=new _a(1,1),ic=new mn,ac=new hn,oc=new ga,sc=[],cc=[],lc=new Float32Array(16),uc=new Float32Array(9),dc=new Float32Array(4);function fc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=sc[i];if(a===void 0&&(a=new Float32Array(i),sc[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function pc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function mc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function hc(e,t){let n=cc[t];n===void 0&&(n=new Int32Array(t),cc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function gc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function _c(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pc(n,t))return;e.uniform2fv(this.addr,t),mc(n,t)}}function vc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(pc(n,t))return;e.uniform3fv(this.addr,t),mc(n,t)}}function yc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pc(n,t))return;e.uniform4fv(this.addr,t),mc(n,t)}}function bc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),mc(n,t)}else{if(pc(n,r))return;dc.set(r),e.uniformMatrix2fv(this.addr,!1,dc),mc(n,r)}}function xc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),mc(n,t)}else{if(pc(n,r))return;uc.set(r),e.uniformMatrix3fv(this.addr,!1,uc),mc(n,r)}}function Sc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(pc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),mc(n,t)}else{if(pc(n,r))return;lc.set(r),e.uniformMatrix4fv(this.addr,!1,lc),mc(n,r)}}function Cc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function wc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pc(n,t))return;e.uniform2iv(this.addr,t),mc(n,t)}}function Tc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(pc(n,t))return;e.uniform3iv(this.addr,t),mc(n,t)}}function Ec(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pc(n,t))return;e.uniform4iv(this.addr,t),mc(n,t)}}function Dc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Oc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(pc(n,t))return;e.uniform2uiv(this.addr,t),mc(n,t)}}function kc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(pc(n,t))return;e.uniform3uiv(this.addr,t),mc(n,t)}}function Ac(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(pc(n,t))return;e.uniform4uiv(this.addr,t),mc(n,t)}}function jc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(rc.compareFunction=n.isReversedDepthBuffer()?518:515,a=rc):a=nc,n.setTexture2D(t||a,i)}function Mc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||ac,i)}function Nc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||oc,i)}function Pc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||ic,i)}function Fc(e){switch(e){case 5126:return gc;case 35664:return _c;case 35665:return vc;case 35666:return yc;case 35674:return bc;case 35675:return xc;case 35676:return Sc;case 5124:case 35670:return Cc;case 35667:case 35671:return wc;case 35668:case 35672:return Tc;case 35669:case 35673:return Ec;case 5125:return Dc;case 36294:return Oc;case 36295:return kc;case 36296:return Ac;case 35678:case 36198:case 36298:case 36306:case 35682:return jc;case 35679:case 36299:case 36307:return Mc;case 35680:case 36300:case 36308:case 36293:return Nc;case 36289:case 36303:case 36311:case 36292:return Pc}}function Ic(e,t){e.uniform1fv(this.addr,t)}function Lc(e,t){let n=fc(t,this.size,2);e.uniform2fv(this.addr,n)}function Rc(e,t){let n=fc(t,this.size,3);e.uniform3fv(this.addr,n)}function zc(e,t){let n=fc(t,this.size,4);e.uniform4fv(this.addr,n)}function Bc(e,t){let n=fc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Vc(e,t){let n=fc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Hc(e,t){let n=fc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Uc(e,t){e.uniform1iv(this.addr,t)}function Wc(e,t){e.uniform2iv(this.addr,t)}function Gc(e,t){e.uniform3iv(this.addr,t)}function Kc(e,t){e.uniform4iv(this.addr,t)}function qc(e,t){e.uniform1uiv(this.addr,t)}function Jc(e,t){e.uniform2uiv(this.addr,t)}function Yc(e,t){e.uniform3uiv(this.addr,t)}function Xc(e,t){e.uniform4uiv(this.addr,t)}function Zc(e,t,n){let r=this.cache,i=t.length,a=hc(n,i);pc(r,a)||(e.uniform1iv(this.addr,a),mc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?rc:nc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Qc(e,t,n){let r=this.cache,i=t.length,a=hc(n,i);pc(r,a)||(e.uniform1iv(this.addr,a),mc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||ac,a[e])}function $c(e,t,n){let r=this.cache,i=t.length,a=hc(n,i);pc(r,a)||(e.uniform1iv(this.addr,a),mc(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||oc,a[e])}function el(e,t,n){let r=this.cache,i=t.length,a=hc(n,i);pc(r,a)||(e.uniform1iv(this.addr,a),mc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||ic,a[e])}function tl(e){switch(e){case 5126:return Ic;case 35664:return Lc;case 35665:return Rc;case 35666:return zc;case 35674:return Bc;case 35675:return Vc;case 35676:return Hc;case 5124:case 35670:return Uc;case 35667:case 35671:return Wc;case 35668:case 35672:return Gc;case 35669:case 35673:return Kc;case 5125:return qc;case 36294:return Jc;case 36295:return Yc;case 36296:return Xc;case 35678:case 36198:case 36298:case 36306:case 35682:return Zc;case 35679:case 36299:case 36307:return Qc;case 35680:case 36300:case 36308:case 36293:return $c;case 36289:case 36303:case 36311:case 36292:return el}}var nl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Fc(t.type)}},rl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=tl(t.type)}},il=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},al=/(\w+)(\])?(\[|\.)?/g;function ol(e,t){e.seq.push(t),e.map[t.id]=t}function sl(e,t,n){let r=e.name,i=r.length;for(al.lastIndex=0;;){let a=al.exec(r),o=al.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){ol(n,l===void 0?new nl(s,e,t):new rl(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new il(s),ol(n,e)),n=e}}}var cl=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);sl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function ll(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var ul=37297,dl=0;function fl(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var pl=new K;function ml(e){q._getMatrix(pl,q.workingColorSpace,e);let t=`mat3( ${pl.elements.map(e=>e.toFixed(4))} )`;switch(q.getTransfer(e)){case ot:return[t,`LinearTransferOETF`];case st:return[t,`sRGBTransferOETF`];default:return B(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function hl(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+fl(e.getShaderSource(t),r)}return i}function gl(e,t){let n=ml(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var _l={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function vl(e,t){let n=_l[t];return n===void 0?(B(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var yl=new G;function bl(){return q.getLuminanceCoefficients(yl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${yl.x.toFixed(4)}, ${yl.y.toFixed(4)}, ${yl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function xl(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(wl).join(`
`)}function Sl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Cl(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function wl(e){return e!==``}function Tl(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function El(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Dl=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ol(e){return e.replace(Dl,Al)}var kl=new Map;function Al(e,t){let n=X[t];if(n===void 0){let e=kl.get(t);if(e!==void 0)n=X[e],B(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Ol(n)}var jl=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ml(e){return e.replace(jl,Nl)}function Nl(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Pl(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Fl={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Il(e){return Fl[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ll={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Rl(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Ll[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var zl={302:`ENVMAP_MODE_REFRACTION`};function Bl(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:zl[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Vl={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Hl(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Vl[e.combine]||`ENVMAP_BLENDING_NONE`}function Ul(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Wl(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Il(n),l=Rl(n),u=Bl(n),d=Hl(n),f=Ul(n),p=xl(n),m=Sl(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(wl).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(wl).join(`
`),_.length>0&&(_+=`
`)):(g=[Pl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(wl).join(`
`),_=[Pl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:X.tonemapping_pars_fragment,n.toneMapping===0?``:vl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,X.colorspace_pars_fragment,gl(`linearToOutputTexel`,n.outputColorSpace),bl(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(wl).join(`
`)),o=Ol(o),o=Tl(o,n),o=El(o,n),s=Ol(s),s=Tl(s,n),s=El(s,n),o=Ml(o),s=Ml(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=ll(i,i.VERTEX_SHADER,y),S=ll(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=hl(i,x,`vertex`),n=hl(i,S,`fragment`);V(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):B(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new cl(i,h),T=Cl(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,ul)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=dl++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Gl=0,Kl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ql(e),t.set(e,n)),n}},ql=class{constructor(e){this.id=Gl++,this.code=e,this.usedTimes=0}};function Jl(e){return e===1030||e===37490||e===36285}function Yl(e,t,n,r,i,a){let o=new En,s=new Kl,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&B(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=gs[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let ee=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),te=h.isInstancedMesh===!0,ne=h.isBatchedMesh===!0,re=!!i.map,M=!!i.matcap,ie=!!x,ae=!!i.aoMap,oe=!!i.lightMap,se=!!i.bumpMap&&i.wireframe===!1,N=!!i.normalMap,ce=!!i.displacementMap,le=!!i.emissiveMap,P=!!i.metalnessMap,F=!!i.roughnessMap,ue=i.anisotropy>0,de=i.clearcoat>0,fe=i.dispersion>0,pe=i.retroreflectivity>0,me=i.iridescence>0,he=i.sheen>0,ge=i.transmission>0,_e=ue&&!!i.anisotropyMap,ve=de&&!!i.clearcoatMap,ye=de&&!!i.clearcoatNormalMap,be=de&&!!i.clearcoatRoughnessMap,xe=me&&!!i.iridescenceMap,Se=me&&!!i.iridescenceThicknessMap,Ce=he&&!!i.sheenColorMap,we=he&&!!i.sheenRoughnessMap,Te=!!i.specularMap,Ee=!!i.specularColorMap,De=!!i.specularIntensityMap,Oe=ge&&!!i.transmissionMap,ke=ge&&!!i.thicknessMap,Ae=!!i.gradientMap,je=!!i.alphaMap,Me=i.alphaTest>0,I=!!i.alphaHash,Ne=!!i.extensions,Pe=0;i.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Pe=e.toneMapping);let Fe={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:ne,batchingColor:ne&&h._colorsTexture!==null,instancing:te,instancingColor:te&&h.instanceColor!==null,instancingMorph:te&&h.morphTexture!==null,outputColorSpace:ee===null?e.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:q.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:re,matcap:M,envMap:ie,envMapMode:ie&&x.mapping,envMapCubeUVHeight:S,aoMap:ae,lightMap:oe,bumpMap:se,normalMap:N,displacementMap:ce,emissiveMap:le,normalMapObjectSpace:N&&i.normalMapType===1,normalMapTangentSpace:N&&i.normalMapType===0,packedNormalMap:N&&i.normalMapType===0&&Jl(i.normalMap.format),metalnessMap:P,roughnessMap:F,anisotropy:ue,anisotropyMap:_e,clearcoat:de,clearcoatMap:ve,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,dispersion:fe,retroreflection:pe,iridescence:me,iridescenceMap:xe,iridescenceThicknessMap:Se,sheen:he,sheenColorMap:Ce,sheenRoughnessMap:we,specularMap:Te,specularColorMap:Ee,specularIntensityMap:De,transmission:ge,transmissionMap:Oe,thicknessMap:ke,gradientMap:Ae,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:je,alphaTest:Me,alphaHash:I,combine:i.combine,mapUv:re&&m(i.map.channel),aoMapUv:ae&&m(i.aoMap.channel),lightMapUv:oe&&m(i.lightMap.channel),bumpMapUv:se&&m(i.bumpMap.channel),normalMapUv:N&&m(i.normalMap.channel),displacementMapUv:ce&&m(i.displacementMap.channel),emissiveMapUv:le&&m(i.emissiveMap.channel),metalnessMapUv:P&&m(i.metalnessMap.channel),roughnessMapUv:F&&m(i.roughnessMap.channel),anisotropyMapUv:_e&&m(i.anisotropyMap.channel),clearcoatMapUv:ve&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ye&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:xe&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Ce&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:we&&m(i.sheenRoughnessMap.channel),specularMapUv:Te&&m(i.specularMap.channel),specularColorMapUv:Ee&&m(i.specularColorMap.channel),specularIntensityMapUv:De&&m(i.specularIntensityMap.channel),transmissionMapUv:Oe&&m(i.transmissionMap.channel),thicknessMapUv:ke&&m(i.thicknessMap.channel),alphaMapUv:je&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(N||ue),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(re||je),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&N===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Pe,decodeVideoTexture:re&&i.map.isVideoTexture===!0&&q.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:le&&i.emissiveMap.isVideoTexture===!0&&q.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ne&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ne&&i.extensions.multiDraw===!0||ne)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Fe.vertexUv1s=c.has(1),Fe.vertexUv2s=c.has(2),Fe.vertexUv3s=c.has(3),c.clear(),Fe}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=gs[t];n=Oa.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Wl(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Xl(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Zl(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Ql(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function $l(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Zl),r.length>1&&r.sort(t||Ql),i.length>1&&i.sort(t||Ql)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function eu(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new $l,e.set(t,[i])):n>=r.length?(i=new $l,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function tu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new G,color:new Y};break;case`SpotLight`:n={position:new G,direction:new G,color:new Y,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new G,color:new Y,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new G,skyColor:new Y,groundColor:new Y};break;case`RectAreaLight`:n={color:new Y,position:new G,halfWidth:new G,halfHeight:new G}}return e[t.id]=n,n}}}function nu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var ru=0;function iu(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function au(e){let t=new tu,n=nu(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new G);let i=new G,a=new J,o=new J;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(iu);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Z.LTC_FLOAT_1,r.rectAreaLTC2=Z.LTC_FLOAT_2):(r.rectAreaLTC1=Z.LTC_HALF_1,r.rectAreaLTC2=Z.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=ru++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function ou(e){let t=new au(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function su(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new ou(e),t.set(n,[a])):r>=i.length?(a=new ou(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var cu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,lu=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,uu=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],du=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],fu=new J,pu=new G,mu=new G;function hu(e,t,n){let r=new Ji,i=new W,a=new W,o=new dn,s=new Fa,c=new Ia,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new ja({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new W},radius:{value:4}},vertexShader:cu,fragmentShader:lu}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Gr;m.setAttribute(`position`,new Ar(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new vi(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(B(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){B(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){B(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new pn(i.x,i.y,{format:me,type:ie,minFilter:D,magFilter:D,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new _a(i.x,i.y,M),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=ue,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=w,d.map.depthTexture.magFilter=w}else l.isPointLight?(d.map=new Ks(i.x),d.map.depthTexture=new va(i.x,re)):(d.map=new pn(i.x,i.y),d.map.depthTexture=new _a(i.x,i.y,re)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=ue,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=D,d.map.depthTexture.magFilter=D):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=w,d.map.depthTexture.magFilter=w);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),pu.setFromMatrixPosition(l.matrixWorld),e.position.copy(pu),mu.copy(e.position),mu.add(uu[t]),e.up.copy(du[t]),e.lookAt(mu),e.updateMatrixWorld(),n.makeTranslation(-pu.x,-pu.y,-pu.z),fu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(fu,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new pn(i.x,i.y,{format:me,type:ie}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function gu(e,t){function n(){let t=!1,n=new dn,r=null,i=new dn(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?P(e.DEPTH_TEST):F(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=bt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?P(e.STENCIL_TEST):F(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,j=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),te=!1,ne=0,re=e.getParameter(e.VERSION);re.indexOf(`WebGL`)===-1?re.indexOf(`OpenGL ES`)!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(re)[1]),te=ne>=2):(ne=parseFloat(/^WebGL (\d)/.exec(re)[1]),te=ne>=1);let M=null,ie={},ae=e.getParameter(e.SCISSOR_BOX),oe=e.getParameter(e.VIEWPORT),se=new dn().fromArray(ae),N=new dn().fromArray(oe);function ce(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let le={};le[e.TEXTURE_2D]=ce(e.TEXTURE_2D,e.TEXTURE_2D,1),le[e.TEXTURE_CUBE_MAP]=ce(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[e.TEXTURE_2D_ARRAY]=ce(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),le[e.TEXTURE_3D]=ce(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),P(e.DEPTH_TEST),o.setFunc(3),_e(!1),ve(1),P(e.CULL_FACE),he(0);function P(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function F(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ue(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function de(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function fe(t){return h!==t&&(e.useProgram(t),h=t,!0)}let pe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};pe[103]=e.MIN,pe[104]=e.MAX;let me={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function he(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(F(e.BLEND),g=!1);else if(g===!1&&(P(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:V(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:V(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:V(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:V(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(pe[n],pe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(me[r],me[i],me[o],me[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ge(t,n){t.side===2?F(e.CULL_FACE):P(e.CULL_FACE);let r=t.side===1;n&&(r=!r),_e(r),t.blending===1&&t.transparent===!1?he(0):he(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),be(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?P(e.SAMPLE_ALPHA_TO_COVERAGE):F(e.SAMPLE_ALPHA_TO_COVERAGE)}function _e(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ve(t){t===0?F(e.CULL_FACE):(P(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function ye(t){t!==k&&(te&&e.lineWidth(t),k=t)}function be(t,n,r){t?(P(e.POLYGON_OFFSET_FILL),(A!==n||ee!==r)&&(A=n,ee=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):F(e.POLYGON_OFFSET_FILL)}function xe(t){t?P(e.SCISSOR_TEST):F(e.SCISSOR_TEST)}function Se(t){t===void 0&&(t=e.TEXTURE0+j-1),M!==t&&(e.activeTexture(t),M=t)}function Ce(t,n,r){r===void 0&&(r=M===null?e.TEXTURE0+j-1:M);let i=ie[r];i===void 0&&(i={type:void 0,texture:void 0},ie[r]=i),(i.type!==t||i.texture!==n)&&(M!==r&&(e.activeTexture(r),M=r),e.bindTexture(t,n||le[t]),i.type=t,i.texture=n)}function we(){let t=ie[M];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Te(){try{e.compressedTexImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Ee(){try{e.compressedTexImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function De(){try{e.texSubImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Oe(){try{e.texSubImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function ke(){try{e.compressedTexSubImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Ae(){try{e.compressedTexSubImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function je(){try{e.texStorage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Me(){try{e.texStorage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function I(){try{e.texImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Ne(){try{e.texImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Pe(t){return d[t]===void 0?e.getParameter(t):d[t]}function Fe(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function L(t){se.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),se.copy(t))}function Ie(t){N.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),N.copy(t))}function R(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function z(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Le(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},M=null,ie={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,se.set(0,0,e.canvas.width,e.canvas.height),N.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:P,disable:F,bindFramebuffer:ue,drawBuffers:de,useProgram:fe,setBlending:he,setMaterial:ge,setFlipSided:_e,setCullFace:ve,setLineWidth:ye,setPolygonOffset:be,setScissorTest:xe,activeTexture:Se,bindTexture:Ce,unbindTexture:we,compressedTexImage2D:Te,compressedTexImage3D:Ee,texImage2D:I,texImage3D:Ne,pixelStorei:Fe,getParameter:Pe,updateUBOMapping:R,uniformBlockBinding:z,texStorage2D:je,texStorage3D:Me,texSubImage2D:De,texSubImage3D:Oe,compressedTexSubImage2D:ke,compressedTexSubImage3D:Ae,scissor:L,viewport:Ie,reset:Le}}function _u(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new W,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):pt(`canvas`)}function g(e,t,n){let r=1,i=Pe(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),B(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&B(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];B(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||B(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?ot:q.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function A(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,B(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function ee(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function j(e){let t=e.target;t.removeEventListener(`dispose`,j),ne(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),M(t)}function ne(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&re(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function re(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function M(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let ie=0;function ae(){ie=0}function oe(){return ie}function se(e){ie=e}function N(){let e=ie;return e>=i.maxTextures&&B(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),ie+=1,e}function ce(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function le(t,i){let a=r.get(t);if(t.isVideoTexture&&I(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)B(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)B(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ye(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function P(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?ye(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function F(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?ye(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function ue(t,i){let a=r.get(t);t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version?be(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let fe={[x]:e.REPEAT,[S]:e.CLAMP_TO_EDGE,[C]:e.MIRRORED_REPEAT},pe={[w]:e.NEAREST,[T]:e.NEAREST_MIPMAP_NEAREST,[E]:e.NEAREST_MIPMAP_LINEAR,[D]:e.LINEAR,[O]:e.LINEAR_MIPMAP_NEAREST,[k]:e.LINEAR_MIPMAP_LINEAR},me={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function he(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&B(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,fe[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,fe[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,fe[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,pe[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,pe[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,me[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ge(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,j));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=ce(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&re(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function _e(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ve(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=_e(n.start,r.width,4),c=_e(t.start,r.width,4);n.start<=i+1&&a===c&&_e(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function ye(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ge(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=Ne(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);he(c,o);let h,y=o.mipmaps,x=o.isVideoTexture!==!0,S=f.__version===void 0||l===!0,C=u.dataReady,w=ee(o,t);if(o.isDepthTexture)m=A(o.format===de,o.type),S&&(x?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){x&&S&&n.texStorage2D(e.TEXTURE_2D,w,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],x?C&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else x?(S&&n.texStorage2D(e.TEXTURE_2D,w,m,t.width,t.height),C&&ve(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){x&&S&&n.texStorage3D(e.TEXTURE_2D_ARRAY,w,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(x){if(C){if(o.layerUpdates.size>0){let t=fs(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else x?C&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{x&&S&&n.texStorage2D(e.TEXTURE_2D,w,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?x?C&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):x?C&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(x){if(S&&n.texStorage3D(e.TEXTURE_2D_ARRAY,w,m,t.width,t.height,t.depth),C){if(o.layerUpdates.size>0){let i=fs(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)x?(S&&n.texStorage3D(e.TEXTURE_3D,w,m,t.width,t.height,t.depth),C&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(S){if(x)n.texStorage2D(e.TEXTURE_2D,w,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<w;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(x&&S){let t=Pe(y[0]);n.texStorage2D(e.TEXTURE_2D,w,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],x?C&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(x){if(S){let r=Pe(t);n.texStorage2D(e.TEXTURE_2D,w,m,r.width,r.height)}C&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function be(t,o,s){if(o.image.length!==6)return;let c=ge(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ne(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),S=b(o.internalFormat,y,x,o.normalized,o.colorSpace),C=o.isVideoTexture!==!0,w=u.__version===void 0||c===!0,T=l.dataReady,E=ee(o,h);he(e.TEXTURE_CUBE_MAP,o);let D;if(f){C&&w&&n.texStorage2D(e.TEXTURE_CUBE_MAP,E,S,h.width,h.height);for(let t=0;t<6;t++){D=m[t].mipmaps;for(let r=0;r<D.length;r++){let i=D[r];o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,S,i.width,i.height,0,y,x,i.data):y===null?B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,S,i.width,i.height,0,i.data)}}}else{if(D=o.mipmaps,C&&w){D.length>0&&E++;let t=Pe(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,E,S,t.width,t.height)}for(let t=0;t<6;t++)if(p){C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<D.length;r++){let i=D[r].image[t].image;C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,i.width,i.height,0,y,x,i.data)}}else{C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,y,x,m[t]);for(let r=0;r<D.length;r++){let i=D[r];C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function xe(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),Me(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,je(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Se(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=A(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Me(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,je(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);Me(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,je(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ce(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,j)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),he(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else le(i.depthTexture,0);let u=l.__webglTexture,d=je(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)Me(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)Me(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function we(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Ce(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?Ce(i.__webglFramebuffer[0],t,0):Ce(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),Se(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),Se(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Te(t,n,i){let a=r.get(t);n!==void 0&&xe(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&we(t)}function Ee(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,te);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&Me(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=je(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),Se(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),he(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)xe(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else xe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),he(c,a),xe(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),he(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)xe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else xe(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&we(t)}function De(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let Oe=[],ke=[];function Ae(t){if(t.samples>0){if(Me(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(Oe.length=0,ke.length=0,Oe.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(Oe.push(l),ke.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,ke)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Oe))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function je(e){return Math.min(i.maxSamples,e.samples)}function Me(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function I(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ne(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(q.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&B(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):V(`WebGLTextures: Unsupported texture color space:`,n)),t}function Pe(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=N,this.resetTextureUnits=ae,this.getTextureUnits=oe,this.setTextureUnits=se,this.setTexture2D=le,this.setTexture2DArray=P,this.setTexture3D=F,this.setTextureCube=ue,this.rebindTextures=Te,this.setupRenderTarget=Ee,this.updateRenderTargetMipmap=De,this.updateMultisampleRenderTarget=Ae,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=Me,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function vu(e,t){function n(n,r=``){let i,a=q.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var yu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,bu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,xu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ya(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new ja({vertexShader:yu,fragmentShader:bu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new vi(new Sa(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Su=class extends xt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new xu,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new W,C=null,w=null,T=new Mo;T.viewport=new dn;let E=new Mo;E.viewport=new dn;let D=[T,E],O=new Ko,k=null,ee=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Gn,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Gn,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Gn,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function te(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,te),r.removeEventListener(`inputsourceschange`,ne);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,ee=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,P.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&B(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&B(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,te),r.addEventListener(`inputsourceschange`,ne),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?de:ue,a=_.stencil?se:re);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new pn(d.textureWidth,d.textureHeight,{format:F,type:A,depthTexture:new _a(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new pn(f.framebufferWidth,f.framebufferHeight,{format:F,type:A,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),P.setContext(r),P.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function ne(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let M=new G,ie=new G;function ae(e,t,n){M.setFromMatrixPosition(t.matrixWorld),ie.setFromMatrixPosition(n.matrixWorld);let r=M.distanceTo(ie),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function oe(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||ee!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,ee=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;oe(O,i);for(let e=0;e<a.length;e++)oe(a[e],i);a.length===2?ae(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),N(e,O,i)};function N(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Tt*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ce=null;function le(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Mo,o.layers.enable(n),o.viewport=new dn,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new ya,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ce&&ce(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let P=new ms;P.setAnimationLoop(le),this.setAnimationLoop=function(e){ce=e},this.dispose=function(){}}},Cu=new J,wu=new K;wu.set(-1,0,0,0,1,0,0,0,1);function Tu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Da(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Cu.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(wu),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Eu(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return V(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?B(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):B(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var Du=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ou=null;function ku(){return Ou===null&&(Ou=new Mi(Du,16,16,me,ie),Ou.name=`DFG_LUT`,Ou.minFilter=D,Ou.magFilter=D,Ou.wrapS=S,Ou.wrapT=S,Ou.generateMipmaps=!1,Ou.needsUpdate=!0),Ou}var Au=class{constructor(e={}){let{canvas:t=mt(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=A}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([ge,he,pe]),g=new Set([A,re,te,se,ae,oe]),_=new Uint32Array(4),v=new Int32Array(4),y=new G,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,ee=null,j=null;this._outputColorSpace=it;let ne=0,M=0,N=null,ce=-1,le=null,P=new dn,F=new dn,ue=null,de=new Y(0),fe=0,me=t.width,_e=t.height,ve=1,ye=null,be=null,xe=new dn(0,0,me,_e),Se=new dn(0,0,me,_e),Ce=!1,we=new Ji,Te=!1,Ee=!1,De=new J,Oe=new G,ke=new dn,Ae={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},je=!1;function Me(){return N===null?ve:1}let I=n;function Ne(e,n){return t.getContext(e,n)}let Pe,Fe,L,Ie,R,z,Le,Re,ze,Be,Ve,He,Ue,We,Ge,Ke,qe,Je,Ye,Xe,Ze,Qe,$e;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,nt,!1),t.addEventListener(`webglcontextrestored`,rt,!1),t.addEventListener(`webglcontextcreationerror`,at,!1),I===null){let t=`webgl2`;if(I=Ne(t,e),I===null)throw Ne(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}et()}catch(e){throw t.removeEventListener(`webglcontextlost`,nt,!1),t.removeEventListener(`webglcontextrestored`,rt,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),V(`WebGLRenderer: `+e.message),e}function et(){Pe=new Js(I),Pe.init(),Ze=new vu(I,Pe),Fe=new Cs(I,Pe,e,Ze),L=new gu(I,Pe),Fe.reversedDepthBuffer&&d&&L.buffers.depth.setReversed(!0),O=I.createFramebuffer(),ee=I.createFramebuffer(),j=I.createFramebuffer(),Ie=new Zs(I),R=new Xl,z=new _u(I,Pe,L,R,Fe,Ze,Ie),Le=new qs(T),Re=new hs(I),Qe=new xs(I,Re),ze=new Ys(I,Re,Ie,Qe),Be=new $s(I,ze,Re,Qe,Ie),Je=new Qs(I,Fe,z),Ge=new ws(R),Ve=new Yl(T,Le,Pe,Fe,Qe,Ge),He=new Tu(T,R),Ue=new eu,We=new su(Pe),qe=new bs(T,Le,L,Be,p,s),Ke=new hu(T,Be,Fe),$e=new Eu(I,Ie,Fe,L),Ye=new Ss(I,Pe,Ie),Xe=new Xs(I,Pe,Ie),Ie.programs=Ve.programs,T.capabilities=Fe,T.extensions=Pe,T.properties=R,T.renderLists=Ue,T.shadowMap=Ke,T.state=L,T.info=Ie}m!==1009&&(w=new tc(m,t.width,t.height,o,r,i));let tt=new Su(T,I);this.xr=tt,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let e=Pe.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Pe.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ve},this.setPixelRatio=function(e){e!==void 0&&(ve=e,this.setSize(me,_e,!1))},this.getSize=function(e){return e.set(me,_e)},this.setSize=function(e,n,r=!0){tt.isPresenting?B(`WebGLRenderer: Can't change size while VR device is presenting.`):(me=e,_e=n,t.width=Math.floor(e*ve),t.height=Math.floor(n*ve),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(me*ve,_e*ve).floor()},this.setDrawingBufferSize=function(e,n,r){me=e,_e=n,ve=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)V(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){B(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(P)},this.getViewport=function(e){return e.copy(xe)},this.setViewport=function(e,t,n,r){e.isVector4?xe.set(e.x,e.y,e.z,e.w):xe.set(e,t,n,r),L.viewport(P.copy(xe).multiplyScalar(ve).round())},this.getScissor=function(e){return e.copy(Se)},this.setScissor=function(e,t,n,r){e.isVector4?Se.set(e.x,e.y,e.z,e.w):Se.set(e,t,n,r),L.scissor(F.copy(Se).multiplyScalar(ve).round())},this.getScissorTest=function(){return Ce},this.setScissorTest=function(e){L.setScissorTest(Ce=e)},this.setOpaqueSort=function(e){ye=e},this.setTransparentSort=function(e){be=e},this.getClearColor=function(e){return e.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor(...arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=qe.getClearColor(),r=qe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,I.clearBufferuiv(I.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,I.clearBufferiv(I.COLOR,0,v))}else r|=I.COLOR_BUFFER_BIT}t&&(r|=I.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&I.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,nt,!1),t.removeEventListener(`webglcontextrestored`,rt,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),qe.dispose(),Ue.dispose(),We.dispose(),R.dispose(),Le.dispose(),Be.dispose(),Qe.dispose(),$e.dispose(),Ve.dispose(),tt.dispose(),tt.removeEventListener(`sessionstart`,pt),tt.removeEventListener(`sessionend`,ht),_t.stop()};function nt(e){e.preventDefault(),gt(`WebGLRenderer: Context Lost.`),E=!0}function rt(){gt(`WebGLRenderer: Context Restored.`),E=!1;let e=Ie.autoReset,t=Ke.enabled,n=Ke.autoUpdate,r=Ke.needsUpdate,i=Ke.type;et(),Ie.autoReset=e,Ke.enabled=t,Ke.autoUpdate=n,Ke.needsUpdate=r,Ke.type=i}function at(e){V(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function ot(e){let t=e.target;t.removeEventListener(`dispose`,ot),st(t)}function st(e){ct(e),R.remove(e)}function ct(e){let t=R.get(e).programs;t!==void 0&&(t.forEach(function(e){Ve.releaseProgram(e)}),e.isShaderMaterial&&Ve.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ae);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Dt(e,t,n,r,i);L.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=ze.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Qe.setup(i,r,s,n,c);let h,g=Ye;if(c!==null&&(h=Re.get(c),g=Xe,g.setIndex(h)),i.isMesh)r.wireframe===!0?(L.setLineWidth(r.wireframeLinewidth*Me()),g.setMode(I.LINES)):g.setMode(I.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),L.setLineWidth(e*Me()),i.isLineSegments?g.setMode(I.LINES):i.isLineLoop?g.setMode(I.LINE_LOOP):g.setMode(I.LINE_STRIP)}else i.isPoints?g.setMode(I.POINTS):i.isSprite&&g.setMode(I.TRIANGLES);if(i.isBatchedMesh){if(Pe.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Re.get(c).bytesPerElement:1,o=R.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(I,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function lt(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),Te===!0&&Ge.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,wt(e,t,r),e.side=0,e.needsUpdate=!0,wt(e,t,r),e.side=2):wt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=We.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),Ee=this.localClippingEnabled,Te=Ge.init(this.clippingPlanes,Ee),Te===!0&&Ge.setGlobalState(this.clippingPlanes,t),D!==null&&Ke.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];lt(o,n,t,e),r.add(o)}else lt(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=R.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Pe.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let dt=null;function ft(e){dt&&dt(e)}function pt(){_t.stop()}function ht(){_t.start()}let _t=new ms;_t.setAnimationLoop(ft),typeof self<`u`&&_t.setContext(self),this.setAnimationLoop=function(e){dt=e,tt.setAnimationLoop(e),e===null?_t.stop():_t.start()},tt.addEventListener(`sessionstart`,pt),tt.addEventListener(`sessionend`,ht),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){V(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=tt.enabled===!0&&tt.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),tt.enabled===!0&&tt.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(tt.cameraAutoUpdate===!0&&tt.updateCamera(t),t=tt.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=We.get(e,C.length),x.init(t),x.state.textureUnits=z.getTextureUnits(),C.push(x),De.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),we.setFromProjectionMatrix(De,ut,t.reversedDepth),Ee=this.localClippingEnabled,Te=Ge.init(this.clippingPlanes,Ee),b=Ue.get(e,S.length),b.init(),S.push(b),tt.enabled===!0&&tt.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&vt(e,t,-1/0,T.sortObjects)}vt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(ye,be),je=tt.enabled===!1||tt.isPresenting===!1||tt.hasDepthSensing()===!1,je&&qe.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Te===!0&&Ge.beginShadows();let i=x.state.shadowsArray;if(Ke.render(i,e,t),Te===!0&&Ge.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];xt(n,r,e,a)}je&&qe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];bt(b,e,n,n.viewport)}}else r.length>0&&xt(n,r,e,t),je&&qe.render(e),bt(b,e,t)}N!==null&&M===0&&(z.updateMultisampleRenderTarget(N),z.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Qe.resetDefaultState(),ce=-1,le=null,C.pop(),C.length>0?(x=C[C.length-1],z.setTextureUnits(x.state.textureUnits),Te===!0&&Ge.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function vt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(we)){r&&ke.setFromMatrixPosition(e.matrixWorld).applyMatrix4(De);let i=Be.update(e),a=e.material;a.visible&&b.push(e,i,a,n,ke.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(we))){let i=Be.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),ke.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),ke.copy(e.boundingSphere.center)),ke.applyMatrix4(e.matrixWorld).applyMatrix4(De)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,ke.z,s,t)}}else a.visible&&b.push(e,i,a,n,ke.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)vt(i[e],t,n,r)}function bt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),Te===!0&&Ge.setGlobalState(T.clippingPlanes,n),r&&L.viewport(P.copy(r)),i.length>0&&St(i,t,n),a.length>0&&St(a,t,n),o.length>0&&St(o,t,n),L.buffers.depth.setTest(!0),L.buffers.depth.setMask(!0),L.buffers.color.setMask(!0),L.setPolygonOffset(!1)}function xt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Pe.has(`EXT_color_buffer_half_float`)||Pe.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new pn(1,1,{generateMipmaps:!0,type:e?ie:A,minFilter:k,samples:Math.max(4,Fe.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:q.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||P;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(de),fe=T.getClearAlpha(),fe<1&&T.setClearColor(16777215,.5),T.clear(),je&&qe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),Te===!0&&Ge.setGlobalState(T.clippingPlanes,r),St(e,n,r),z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a),Pe.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Ct(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(de,fe),d!==void 0&&(r.viewport=d),T.toneMapping=u}function St(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Ct(o,t,n,s,l,c)}}function Ct(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function wt(e,t,n){t.isScene!==!0&&(t=Ae);let r=R.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Ve.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Ve.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Le.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,ot),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Et(e,s),d}else s.uniforms=Ve.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Ve.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ge.uniform),Et(e,s),r.needsLights=kt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function Tt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=cl.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Et(e,t){let n=R.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function H(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function Dt(e,t,n,r,i){t.isScene!==!0&&(t=Ae),z.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:q.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Le.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=R.get(r),y=x.state.lights;if(Te===!0&&(Ee===!0||e!==le)){let t=e===le&&r.id===ce;Ge.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ge.numPlanes||v.numIntersection!==Ge.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=wt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(L.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==ce&&(ce=r.id,w=!0),v.needsLights){let e=H(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||le!==e){L.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(I,`projectionMatrix`,e.projectionMatrix),O.setValue(I,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(I,Oe.setFromMatrixPosition(e.matrixWorld)),Fe.logarithmicDepthBuffer&&O.setValue(I,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(I,`isOrthographic`,e.isOrthographicCamera===!0),le!==e&&(le=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(I,`sunShadowMap`,y.state.sunShadowMap,z),y.state.directionalShadowMap.length>0&&O.setValue(I,`directionalShadowMap`,y.state.directionalShadowMap,z),y.state.spotShadowMap.length>0&&O.setValue(I,`spotShadowMap`,y.state.spotShadowMap,z),y.state.pointShadowMap.length>0&&O.setValue(I,`pointShadowMap`,y.state.pointShadowMap,z)),i.isSkinnedMesh){O.setOptional(I,i,`bindMatrix`),O.setOptional(I,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(I,`boneTexture`,e.boneTexture,z))}i.isBatchedMesh&&(O.setOptional(I,i,`batchingTexture`),O.setValue(I,`batchingTexture`,i._matricesTexture,z),O.setOptional(I,i,`batchingIdTexture`),O.setValue(I,`batchingIdTexture`,i._indirectTexture,z),O.setOptional(I,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(I,`batchingColorTexture`,i._colorsTexture,z));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Je.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(I,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=ku()),w){if(O.setValue(I,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&Ot(k,E),a&&r.fog===!0&&He.refreshFogUniforms(k,a),He.refreshMaterialUniforms(k,r,ve,_e,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}cl.upload(I,Tt(v),k,z)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(cl.upload(I,Tt(v),k,z),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(I,`center`,i.center),O.setValue(I,`modelViewMatrix`,i.modelViewMatrix),O.setValue(I,`normalMatrix`,i.normalMatrix),O.setValue(I,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];$e.update(n,S),$e.bind(n,S)}}return S}function Ot(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function kt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ne},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=R.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),R.get(e.texture).__webglTexture=t,R.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=R.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,ne=t,M=n;let r=null,i=!1,a=!1;if(e){let o=R.get(e);if(o.__useDefaultFramebuffer!==void 0){L.bindFramebuffer(I.FRAMEBUFFER,o.__webglFramebuffer),P.copy(e.viewport),F.copy(e.scissor),ue=e.scissorTest,L.viewport(P),L.scissor(F),L.setScissorTest(ue),ce=-1;return}if(o.__webglFramebuffer===void 0)z.setupRenderTarget(e);else if(o.__hasExternalTextures)z.rebindTextures(e,R.get(e.texture).__webglTexture,R.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&R.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);z.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=R.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&z.useMultisampledRTT(e)===!1?R.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,P.copy(e.viewport),F.copy(e.scissor),ue=e.scissorTest}else P.copy(xe).multiplyScalar(ve).floor(),F.copy(Se).multiplyScalar(ve).floor(),ue=Ce;if(n!==0&&(r=O),L.bindFramebuffer(I.FRAMEBUFFER,r)&&L.drawBuffers(e,r),L.viewport(P),L.scissor(F),L.setScissorTest(ue),i){let r=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=R.get(e.textures[t]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,t.__webglTexture,n)}ce=-1};function At(e){let t=R.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Fe.textureFormatReadable(e.format),t.__typeReadable=Fe.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){L.bindFramebuffer(I.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let u=At(o);if(u.__formatReadable===!1){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&I.readPixels(t,n,r,i,Ze.convert(c),Ze.convert(l),a)}finally{let e=N===null?null:R.get(N).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){L.bindFramebuffer(I.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let d=At(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.bufferData(I.PIXEL_PACK_BUFFER,a.byteLength,I.STREAM_READ),I.readPixels(t,n,r,i,Ze.convert(l),Ze.convert(u),0),I.bindBuffer(I.PIXEL_PACK_BUFFER,null);let p=N===null?null:R.get(N).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,p);let m=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await yt(I,m,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,a),I.bindBuffer(I.PIXEL_PACK_BUFFER,null),I.deleteBuffer(f),I.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;z.setTexture2D(e,0),I.copyTexSubImage2D(I.TEXTURE_2D,n,0,0,o,s,i,a),L.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ze.convert(t.format),_=Ze.convert(t.type),v;t.isData3DTexture?(z.setTexture3D(t,0),v=I.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(z.setTexture2DArray(t,0),v=I.TEXTURE_2D_ARRAY):(z.setTexture2D(t,0),v=I.TEXTURE_2D),L.activeTexture(I.TEXTURE0),L.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,t.flipY),L.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),L.pixelStorei(I.UNPACK_ALIGNMENT,t.unpackAlignment);let y=L.getParameter(I.UNPACK_ROW_LENGTH),b=L.getParameter(I.UNPACK_IMAGE_HEIGHT),x=L.getParameter(I.UNPACK_SKIP_PIXELS),S=L.getParameter(I.UNPACK_SKIP_ROWS),C=L.getParameter(I.UNPACK_SKIP_IMAGES);L.pixelStorei(I.UNPACK_ROW_LENGTH,h.width),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,h.height),L.pixelStorei(I.UNPACK_SKIP_PIXELS,l),L.pixelStorei(I.UNPACK_SKIP_ROWS,u),L.pixelStorei(I.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=R.get(e),r=R.get(t),h=R.get(n.__renderTarget),g=R.get(r.__renderTarget);L.bindFramebuffer(I.READ_FRAMEBUFFER,h.__webglFramebuffer),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(e).__webglTexture,i,d+n),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(t).__webglTexture,a,m+n)),I.blitFramebuffer(l,u,o,s,f,p,o,s,I.DEPTH_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||R.has(e)){let n=R.get(e),r=R.get(t);L.bindFramebuffer(I.READ_FRAMEBUFFER,ee),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,j);for(let e=0;e<c;e++)w?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,n.__webglTexture,i),T?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,r.__webglTexture,a),i===0?T?I.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):I.copyTexSubImage2D(v,a,f,p,l,u,o,s):I.blitFramebuffer(l,u,o,s,f,p,o,s,I.COLOR_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?I.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h);L.pixelStorei(I.UNPACK_ROW_LENGTH,y),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,b),L.pixelStorei(I.UNPACK_SKIP_PIXELS,x),L.pixelStorei(I.UNPACK_SKIP_ROWS,S),L.pixelStorei(I.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&I.generateMipmap(v),L.unbindTexture()},this.initRenderTarget=function(e){R.get(e).__webglFramebuffer===void 0&&z.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?z.setTextureCube(e,0):e.isData3DTexture?z.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?z.setTexture2DArray(e,0):z.setTexture2D(e,0),L.unbindTexture()},this.resetState=function(){ne=0,M=0,N=null,L.reset(),Qe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return ut}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=q._getDrawingBufferColorSpace(e),t.unpackColorSpace=q._getUnpackColorSpace()}},ju=class extends fo{constructor(e){super(e)}load(e,t,n,r){let i=this,a=new ho(this.manager);a.setPath(this.path),a.setResponseType(`arraybuffer`),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(n){try{t(i.parse(n))}catch(t){r?r(t):console.error(t),i.manager.itemError(e)}},n,r)}parse(e){function t(e){let t=new DataView(e);if(84+t.getUint32(80,!0)*50===t.byteLength)return!0;let r=[115,111,108,105,100];for(let e=0;e<5;e++)if(n(r,t,e))return!1;return!0}function n(e,t,n){for(let r=0,i=e.length;r<i;r++)if(e[r]!==t.getUint8(n+r))return!1;return!0}function r(e){let t=new DataView(e),n=t.getUint32(80,!0),r,i,a,o=!1,s,c,l,u,d;for(let e=0;e<70;e++)t.getUint32(e,!1)==1129270351&&t.getUint8(e+4)==82&&t.getUint8(e+5)==61&&(o=!0,s=new Float32Array(n*3*3),c=t.getUint8(e+6)/255,l=t.getUint8(e+7)/255,u=t.getUint8(e+8)/255,d=t.getUint8(e+9)/255);let f=new Gr,p=new Float32Array(n*3*3),m=new Float32Array(n*3*3),h=new Y;for(let e=0;e<n;e++){let n=84+e*50,d=t.getFloat32(n,!0),f=t.getFloat32(n+4,!0),g=t.getFloat32(n+8,!0);if(o){let e=t.getUint16(n+48,!0);e&32768?(r=c,i=l,a=u):(r=(e&31)/31,i=(e>>5&31)/31,a=(e>>10&31)/31)}for(let c=1;c<=3;c++){let l=n+c*12,u=e*3*3+(c-1)*3;p[u]=t.getFloat32(l,!0),p[u+1]=t.getFloat32(l+4,!0),p[u+2]=t.getFloat32(l+8,!0),m[u]=d,m[u+1]=f,m[u+2]=g,o&&(h.setRGB(r,i,a,it),s[u]=h.r,s[u+1]=h.g,s[u+2]=h.b)}}return f.setAttribute(`position`,new Ar(p,3)),f.setAttribute(`normal`,new Ar(m,3)),o&&(f.setAttribute(`color`,new Ar(s,3)),f.hasColors=!0,f.alpha=d),f}function i(e){let t=new Gr,n=/solid([\s\S]*?)endsolid/g,r=/facet([\s\S]*?)endfacet/g,i=/solid\s(.+)/,a=0,o=`[\\s]+([+-]?(?:\\d*)(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)`,s=RegExp(`vertex`+o+o+o,`g`),c=RegExp(`normal`+o+o+o,`g`),l=[],u=[],d=[],f=new G,p,m=0,h=0,g=0;for(;(p=n.exec(e))!==null;){h=g;let e=p[0],n=(p=i.exec(e))===null?``:p[1];for(d.push(n);(p=r.exec(e))!==null;){let e=0,t=0,n=p[0];for(;(p=c.exec(n))!==null;)f.x=parseFloat(p[1]),f.y=parseFloat(p[2]),f.z=parseFloat(p[3]),t++;for(;(p=s.exec(n))!==null;)l.push(parseFloat(p[1]),parseFloat(p[2]),parseFloat(p[3])),u.push(f.x,f.y,f.z),e++,g++;t!==1&&console.error(`THREE.STLLoader: Something isn't right with the normal of face number `+a),e!==3&&console.error(`THREE.STLLoader: Something isn't right with the vertices of face number `+a),a++}let o=h,_=g-h;t.userData.groupNames=d,t.addGroup(o,_,m),m++}return t.setAttribute(`position`,new Nr(l,3)),t.setAttribute(`normal`,new Nr(u,3)),t}function a(e){return typeof e==`string`?e:new TextDecoder().decode(e)}function o(e){if(typeof e==`string`){let t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n)&255;return t.buffer||t}return e}let s=o(e);return t(s)?r(s):i(a(e))}},Mu={type:`change`},Nu={type:`start`},Pu={type:`end`},Fu=new ai,Iu=new Qr,Lu=Math.cos(70*Kt.DEG2RAD),Ru=new G,zu=2*Math.PI,Q={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Bu=1e-6,Vu=class extends ds{constructor(e,t=null){super(e,t),this.state=Q.NONE,this.target=new G,this.cursor=new G,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:v.ROTATE,MIDDLE:v.DOLLY,RIGHT:v.PAN},this.touches={ONE:y.ROTATE,TWO:y.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new G,this._lastQuaternion=new qt,this._lastTargetPosition=new G,this._quat=new qt().setFromUnitVectors(e.up,new G(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ls,this._sphericalDelta=new ls,this._scale=1,this._panOffset=new G,this._rotateStart=new W,this._rotateEnd=new W,this._rotateDelta=new W,this._panStart=new W,this._panEnd=new W,this._panDelta=new W,this._dollyStart=new W,this._dollyEnd=new W,this._dollyDelta=new W,this._dollyDirection=new G,this._mouse=new W,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Uu.bind(this),this._onPointerDown=Hu.bind(this),this._onPointerUp=Wu.bind(this),this._onContextMenu=Zu.bind(this),this._onMouseWheel=qu.bind(this),this._onKeyDown=Ju.bind(this),this._onTouchStart=Yu.bind(this),this._onTouchMove=Xu.bind(this),this._onMouseDown=Gu.bind(this),this._onMouseMove=Ku.bind(this),this._interceptControlDown=Qu.bind(this),this._interceptControlUp=$u.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=Q.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Mu),this.update(),this.state=Q.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Ru.copy(t).sub(this.target),Ru.applyQuaternion(this._quat),this._spherical.setFromVector3(Ru),this.autoRotate&&this.state===Q.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=zu:n>Math.PI&&(n-=zu),r<-Math.PI?r+=zu:r>Math.PI&&(r-=zu),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(Ru.setFromSpherical(this._spherical),Ru.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ru),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=Ru.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new G(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new G(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=Ru.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(Fu.origin.copy(this.object.position),Fu.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Fu.direction))<Lu?this.object.lookAt(this.target):(Iu.setFromNormalAndCoplanarPoint(this.object.up,this.target),Fu.intersectPlane(Iu,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>Bu||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Bu||this._lastTargetPosition.distanceToSquared(this.target)>Bu?(this.dispatchEvent(Mu),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?zu/60/60*this.autoRotateSpeed:zu/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ru.setFromMatrixColumn(t,0),Ru.multiplyScalar(-e),this._panOffset.add(Ru)}_panUp(e,t){this.screenSpacePanning===!0?Ru.setFromMatrixColumn(t,1):(Ru.setFromMatrixColumn(t,0),Ru.crossVectors(this.object.up,Ru)),Ru.multiplyScalar(e),this._panOffset.add(Ru)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;Ru.copy(r).sub(this.target);let i=Ru.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(zu*this._rotateDelta.x/t.clientHeight),this._rotateUp(zu*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(zu*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-zu*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(zu*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-zu*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(zu*this._rotateDelta.x/t.clientHeight),this._rotateUp(zu*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new W,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Hu(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Uu(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function Wu(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(Pu),this.state=Q.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Gu(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case v.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=Q.DOLLY;break;case v.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Q.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Q.ROTATE}break;case v.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Q.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Q.PAN}break;default:this.state=Q.NONE}this.state!==Q.NONE&&this.dispatchEvent(Nu)}function Ku(e){switch(this.state){case Q.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case Q.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case Q.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function qu(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===Q.NONE&&(e.preventDefault(),this.dispatchEvent(Nu),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(Pu))}function Ju(e){this.enabled!==!1&&this._handleKeyDown(e)}function Yu(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case y.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=Q.TOUCH_ROTATE;break;case y.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=Q.TOUCH_PAN;break;default:this.state=Q.NONE}break;case 2:switch(this.touches.TWO){case y.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=Q.TOUCH_DOLLY_PAN;break;case y.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=Q.TOUCH_DOLLY_ROTATE;break;default:this.state=Q.NONE}break;default:this.state=Q.NONE}this.state!==Q.NONE&&this.dispatchEvent(Nu)}function Xu(e){switch(this._trackPointer(e),this.state){case Q.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case Q.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case Q.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case Q.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=Q.NONE}}function Zu(e){this.enabled!==!1&&e.preventDefault()}function Qu(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function $u(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var ed={front:{id:`front`,file:`front.stl`,name:`Front shell`,defaultColor:`#86bfea`},rear:{id:`rear`,file:`rear.stl`,name:`Rear shell`,defaultColor:`#70acd9`},battery_door:{id:`battery_door`,file:`battery_door.stl`,name:`Battery door`,defaultColor:`#fff0b5`}};function td(e,t={}){let n=e.querySelector(`#stl-viewport`),r=e.querySelector(`#stl-current-name`),i=e.querySelector(`#stl-viewer-status`),a=e.querySelector(`#stl-file-info`),o=e.querySelector(`#stl-reset-camera`),s=e.querySelectorAll(`[data-stl-select]`),c=new Zn;c.background=new Y(`#fff8eb`);let u=new Mo(40,1,1,3e3),d=new Au({antialias:!0,alpha:!1});d.setPixelRatio(Math.min(window.devicePixelRatio,2)),d.outputColorSpace=it,d.domElement.tabIndex=0,d.domElement.setAttribute(`aria-label`,l(`stl.aria`)),n.append(d.domElement);let f=new Vu(u,d.domElement);f.enableDamping=!0,f.dampingFactor=.12,f.minDistance=30,f.maxDistance=2500;let p=new bo(`#ffffff`,`#9aaa8e`,2.3),m=new zo(`#fff8eb`,2.8);m.position.set(200,400,350);let h=new zo(`#dce7ff`,1.6);h.position.set(-200,-100,-300),c.add(p,m,h);let g=new us(800,40,`#e5d8b8`,`#ede3ca`);g.position.y=-60,c.add(g);let _=new ju,v=new Map,y=`front`,b={...t.initialColors},x=null,S=!0;function C(){let e=n.clientWidth,t=n.clientHeight;e&&t&&(u.aspect=e/t,u.updateProjectionMatrix(),d.setSize(e,t))}let w=new ResizeObserver(C);w.observe(n);function T(){if(!x)return;C(),x.geometry.computeBoundingSphere();let e=(x.geometry.boundingSphere?.radius||100)*2.3;u.position.set(e*.7,e*.6,e*.9),u.lookAt(0,0,0),f.target.set(0,0,0),f.update()}function E(e){return b[e]||ed[e]?.defaultColor||`#86bfea`}function D(e){let t=ed[e];if(!t)return;let n=l(`part.${e}`);r&&(r.textContent=n),a&&(a.textContent=t.file),i&&(i.textContent=l(`stl.loaded`,{name:n})),s.forEach(t=>{let n=t.dataset.stlSelect===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}),document.querySelectorAll(`.stl-view-button`).forEach(t=>{let n=t.dataset.stl===e;t.setAttribute(`aria-pressed`,String(n))})}async function O(e){ed[e]||(e=`front`),y=e,D(e),i&&(i.textContent=l(`stl.loading`,{file:ed[e].file}));let t=v.get(e);if(!t)try{let n=new URL(`./cloud/${ed[e].file}`,document.baseURI).href;t=await _.loadAsync(n),t.computeVertexNormals(),t.center(),v.set(e,t)}catch(t){i&&(i.textContent=l(`stl.failed`,{file:ed[e].file,message:t.message}));return}if(x)x.geometry=t,x.material.color.set(E(e));else{let n=new Na({color:E(e),roughness:.65,metalness:.08});x=new vi(t,n),c.add(x)}t.computeBoundingBox(),t.boundingBox&&(g.position.y=t.boundingBox.min.y-1),T(),D(e)}function k(e){b={...b,...e},x&&y&&x.material.color.set(E(y))}return d.setAnimationLoop(()=>{S&&!document.hidden&&n.clientWidth&&(f.update(),d.render(c,u))}),o?.addEventListener(`click`,T),s.forEach(e=>{e.addEventListener(`click`,()=>{O(e.dataset.stlSelect)})}),document.querySelectorAll(`.stl-view-button`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.stl;n&&(O(n),e.scrollIntoView({behavior:`smooth`,block:`nearest`}))})}),O(`front`),{loadPart:O,setPartColors:k,resetCamera:T,setActive(e){S=e,e&&C()},dispose(){w.disconnect(),f.dispose(),d.setAnimationLoop(null),v.forEach(e=>e.dispose()),v.clear(),x?.material?.dispose(),d.dispose()}}}var nd=[{id:`ctrl-pi3`,name:`Raspberry Pi 3 Model B / B+`,function:`Main controller running offline Python player & alphabet engine`,priceText:`~150 – 180 zł`,min:150,max:180,caseType:`all`,controllerType:`pi3`,links:[{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/komputery-stacjonarne-raspberry-pi-i-akcesoria-257211?string=Raspberry%20Pi%203%20Model%20B`},{name:`Botland ↗`,url:`https://botland.com.pl/16-moduly-glowne-raspberry-pi`}]},{id:`ctrl-pico`,name:`Raspberry Pi Pico 2 WH`,function:`Microcontroller running lightweight player with PIO I2S audio & SPI LCD`,priceText:`~38 – 45 zł`,min:38,max:45,caseType:`all`,controllerType:`pico`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/szukaj?s=Raspberry+Pi+Pico+2+WH`},{name:`Kamami ↗`,url:`https://kamami.pl/szukaj?s=Pico+2+WH`}]},{id:`periph-lcd`,name:`Waveshare 2″ IPS LCD (ST7789, SPI)`,function:`240×320 colour display for letter animations & feedback (SKU 17344)`,priceText:`~45 – 50 zł`,min:45,max:50,caseType:`all`,controllerType:`all`,links:[{name:`Kamami (17344) ↗`,url:`https://kamami.pl/wyswietlacze-lcd-tft/577038-wyswietlacz-lcd-ips-2-240x320-spi-waveshare-17344.html`},{name:`Botland ↗`,url:`https://botland.com.pl/wyswietlacze-lcd-tft-i-ips/16016-wyswietlacz-ips-tft-2-240x320px-spi-waveshare-17344.html`}]},{id:`periph-keypad`,name:`AD-Key 5-button analog keypad`,function:`Five front tactile control buttons on single analog ADC line`,priceText:`~10,49 zł`,min:10.49,max:10.49,caseType:`all`,controllerType:`all`,links:[{name:`sklep.msalamon.pl ↗`,url:`https://sklep.msalamon.pl/produkt/modul-ad-key-klawiatura-5-przyciskow/`}]},{id:`periph-dac`,name:`MAX98357A I2S 3W Class-D DAC & Amp`,function:`Direct I2S digital audio output powering the internal speaker`,priceText:`~10,30 zł`,min:10.3,max:10.3,caseType:`all`,controllerType:`all`,links:[{name:`Gotronik ↗`,url:`https://www.gotronik.pl/modul-wzmacniacza-audio-i2s-3w-klasa-d-dacmax98357-p-13866.html`}]},{id:`periph-adc`,name:`ADS1115 16-bit 4-channel I2C ADC`,function:`High-resolution ADC converter reading analog key resistor divider`,priceText:`~18 – 24 zł`,min:18,max:24,caseType:`all`,controllerType:`all`,links:[{name:`Gotronik ↗`,url:`https://www.gotronik.pl/ads1115-modul-czterokanalowego-przetwornika-adc-16-bit-i2c-p-4187.html`},{name:`Botland ↗`,url:`https://botland.com.pl/przetworniki-a-c-i-c-a/4187-ads1115-przetwornik-ac-16-bitowy-4-kanalowy-i2c.html`}]},{id:`periph-speaker`,name:`Universal speaker 40 mm 4Ω 3W`,function:`Front-firing sound reproduction with soft gasket`,priceText:`~6,70 – 10 zł`,min:6.7,max:10,caseType:`all`,controllerType:`all`,links:[{name:`Kamami ↗`,url:`https://kamami.pl/glosniki/577543-glosnik-uniwersalny-3w-40mm.html`},{name:`Botland ↗`,url:`https://botland.com.pl/74-glosniki`}]},{id:`periph-powerbank`,name:`Baseus 5000 mAh power bank (slim)`,function:`Removable internal battery bank (exact fit: 69 × 106 × 14 mm)`,priceText:`~75 – 89 zł`,min:75,max:89,caseType:`all`,controllerType:`all`,links:[{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/akcesoria-gsm-powerbanki-250157?string=Baseus%20Magnetic%20Mini%205000mAh`},{name:`Media Expert ↗`,url:`https://www.mediaexpert.pl/smartfony-i-zegarki/akcesoria-do-telefonow/powerbanki/powerbank-baseus-magnetic-mini-5000mah-20w-czarny`}]},{id:`periph-switch`,name:`Power switch (slide / rocker)`,function:`Main battery power disconnect switch on rear upper shoulder`,priceText:`~3 – 6 zł`,min:3,max:6,caseType:`all`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/58-przelaczniki-kolyskowe`}]},{id:`case-3d-filament`,name:`PETG filament 1 kg spool`,function:`Rosa3D / Devil Design / Fiberlogy for durable printable shells (~440 g needed)`,priceText:`~59 – 79 zł`,min:59,max:79,caseType:`3d-print`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/701-filamenty-petg`},{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/druk-3d-filamenty-259163?string=filament%20PETG%201kg`}]},{id:`case-3d-fasteners`,name:`Fasteners, perfboard & wiring`,function:`3× M3×55, 1× M3×12, 4× M3 nuts, 8× M2.5×6 screws, 10kΩ resistors, perfboard, cable ties`,priceText:`~15 – 20 zł`,min:15,max:20,caseType:`3d-print`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/921-sruby-nakretki-podkladki`}]},{id:`case-ply-house-sheet`,name:`Birch plywood 6 mm sheet (600 × 400 mm)`,function:`Laser-cut or CNC milled body, opening roof & carry handle`,priceText:`~35 – 50 zł`,min:35,max:50,caseType:`plywood-house`,controllerType:`all`,links:[{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/materialy-plyty-sklejki-319524?string=sklejka%20brzozowa%206mm`}]},{id:`case-ply-house-hw`,name:`Hardware: brass hinges, handle & screws`,function:`2× brass hinges for opening roof, wooden handle dowel, magnets & M3 wood screws`,priceText:`~20 – 30 zł`,min:20,max:30,caseType:`plywood-house`,controllerType:`all`,links:[{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/okucia-i-akcesoria-zawiasy-111956?string=zawias%20mosiezny%20maly`}]},{id:`case-ply-house-wiring`,name:`Perfboard, resistors & internal wiring`,function:`Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires`,priceText:`~10 – 15 zł`,min:10,max:15,caseType:`plywood-house`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/plytki-uniwersalne/2005-plytka-uniwersalna-pcb-drukowana-5x7cm-jednostronna.html`}]},{id:`case-ply-case-sheet`,name:`Birch plywood 6 mm sheet (600 × 300 mm)`,function:`Laser-cut front faceplate, frame ribs and removable rear cover`,priceText:`~30 – 45 zł`,min:30,max:45,caseType:`plywood-case`,controllerType:`all`,links:[{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/materialy-plyty-sklejki-319524?string=sklejka%20brzozowa%206mm`}]},{id:`case-ply-case-hw`,name:`Hardware: brass standoffs, brackets & screws`,function:`4× M3 brass standoffs, corner brackets & machine screws for mounting`,priceText:`~15 – 25 zł`,min:15,max:25,caseType:`plywood-case`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/921-sruby-nakretki-podkladki`},{name:`Allegro ↗`,url:`https://allegro.pl/kategoria/narzedzia-i-artykuly-montazowe-okucia-i-laczniki-254425`}]},{id:`case-ply-case-wiring`,name:`Perfboard, resistors & internal wiring`,function:`Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires`,priceText:`~10 – 15 zł`,min:10,max:15,caseType:`plywood-case`,controllerType:`all`,links:[{name:`Botland ↗`,url:`https://botland.com.pl/plytki-uniwersalne/2005-plytka-uniwersalna-pcb-drukowana-5x7cm-jednostronna.html`}]}];function rd(e,t){return o[c()]?.[`item.${e.id}.${t}`]??e[t]}function id(e,t,n,r){let i=Math.round(n/4.3),a=Math.round(r/4.3);return l(`pricing.sub.${e}.${t===`pico`?`pico`:`pi3`}`,{euroMin:i,euroMax:a})}function ad(e=document.querySelector(`#cloud-pricing`)){if(!e)return;let t=e.querySelector(`#pricing-case`),n=e.querySelector(`#pricing-controller`),r=e.querySelector(`.pricing-total-value`),i=e.querySelector(`.pricing-subtext`),a=e.querySelector(`#pricing-tbody`),s=e.querySelectorAll(`.pricing-sort-btn`),u=e.querySelector(`#pricing-material-card`),d=e.querySelector(`#material-section-number`),f=e.querySelector(`#material-title`),p=e.querySelector(`#material-badge`),m=e.querySelector(`#material-desc`),h=e.querySelector(`#material-stats`),g={key:null,direction:`asc`};function _(e){if(u&&o.en[`material.${e}.section`]&&(d&&(d.textContent=l(`material.${e}.section`)),f&&(f.textContent=l(`material.${e}.title`)),p&&(p.textContent=l(`material.${e}.badge`)),m&&(m.textContent=l(`material.${e}.desc`)),h)){h.replaceChildren();for(let t=0;t<5;t++){let n=document.createElement(`div`);n.className=`filament-stat${t===4?` total`:``}`;let r=document.createElement(`dt`);r.textContent=l(`material.${e}.s${t}.dt`);let i=document.createElement(`dd`);i.textContent=l(`material.${e}.s${t}.dd`);let a=document.createElement(`small`);a.textContent=l(`material.${e}.s${t}.small`),n.append(r,i,a),h.append(n)}}}function v(){let e=t?t.value:`3d-print`,r=n?n.value:`pi3`;return nd.filter(t=>{let n=t.caseType===`all`||t.caseType===e,i=t.controllerType===`all`||t.controllerType===r;return n&&i})}function y(e){if(!g.key)return e;let{key:t,direction:n}=g,r=n===`desc`?-1:1;return[...e].sort((e,n)=>{let i=c()===`en`?`en`:`pl`;if(t===`name`)return r*rd(e,`name`).localeCompare(rd(n,`name`),i,{sensitivity:`base`});if(t===`function`)return r*rd(e,`function`).localeCompare(rd(n,`function`),i,{sensitivity:`base`});if(t===`price`){let t=e.min,i=n.min;return t===i?r*(e.max-n.max):r*(t-i)}if(t===`supplier`){let t=e.links.map(e=>e.name).join(` `),i=n.links.map(e=>e.name).join(` `);return r*t.localeCompare(i,c()===`en`?`en`:`pl`,{sensitivity:`base`})}return 0})}function b(){let e=t?t.value:`3d-print`,o=n?n.value:`pi3`,c=v(),l=y(c),u=c.reduce((e,t)=>e+t.min,0),d=c.reduce((e,t)=>e+t.max,0),f=Math.floor(u/10)*10,p=Math.ceil(d/10)*10;if(r&&(r.innerHTML=`~${f} – ${p} <small>PLN</small>`),i&&(i.innerHTML=id(e,o,f,p)),_(e),a){a.replaceChildren();for(let e of l){let t=document.createElement(`tr`),n=document.createElement(`td`),r=document.createElement(`strong`);r.textContent=rd(e,`name`),n.append(r);let i=document.createElement(`td`);i.textContent=rd(e,`function`);let o=document.createElement(`td`),s=document.createElement(`strong`);s.textContent=e.priceText,o.append(s);let c=document.createElement(`td`),l=document.createElement(`div`);l.className=`shop-links-cell`;for(let t of e.links){let e=document.createElement(`a`);e.href=t.url,e.target=`_blank`,e.rel=`noopener`,e.className=`shop-badge`,e.textContent=t.name,l.append(e)}c.append(l),t.append(n,i,o,c),a.append(t)}}for(let e of s){let t=e.dataset.sortKey,n=e.closest(`th`),r=e.querySelector(`.sort-icon`);g.key===t?(e.classList.add(`is-sorted`),n&&n.setAttribute(`aria-sort`,g.direction===`asc`?`ascending`:`descending`),r&&(r.textContent=g.direction===`asc`?`▲`:`▼`)):(e.classList.remove(`is-sorted`),n&&n.setAttribute(`aria-sort`,`none`),r&&(r.textContent=`↕`))}}for(let e of s)e.addEventListener(`click`,()=>{let t=e.dataset.sortKey;g.key===t?g.direction=g.direction===`asc`?`desc`:`asc`:(g.key=t,g.direction=`asc`),b()});t&&t.addEventListener(`change`,b),n&&n.addEventListener(`change`,b),b()}var od=`flowchart TB
  CLI["python -m app"] --> Config["Settings.load · one config.json"]
  Config --> Startup["Startup · prepared media + resource acquisition"]
  Splash["Optional boot splash · Unix socket handoff"] --> Startup
  Startup --> Loop["Control loop · app/app.py"]
  ADC["Keypad → ADS1x15 / I2C"] --> Guard["Calibration · Debouncer · PressGuard"]
  Guard --> Loop
  Keyboard["SSH keyboard"] --> Loop
  Loop --> Player["PlayerSession · navigation and actions"]
  Cache["app.media · PNG / WAV / RGB565 cache"] --> Player
  Player --> Lessons["LetterLesson / CharacterAnimation"]
  Player --> Frame["frame + render_key"]
  Lessons --> Frame
  Frame --> Presenter["AnimationPresenter / WireFrames"]
  Presenter --> Display["ST7789 · RGB565 over SPI"]
  Presenter --> Preview["PreviewDisplay · simulated PNG"]
  Player --> Audio["StreamingAudioPlayer · PCM worker + volume cap"]
  Audio --> ALSA["aplay / ALSA → I2S → MAX98357A + speaker"]
  Loop --> Watchdog["ServiceWatchdog → systemd"]
  Loop --> Cleanup["On exit · stop audio and release resources"]
  classDef entry fill:#e7ddfa,color:#39305b,stroke:#8b7bad,stroke-width:2px
  classDef physical fill:#fff0b5,color:#39305b,stroke:#b39754
  classDef simulation fill:#d6f2e3,color:#39305b,stroke:#7caa94
  class CLI,Loop,Player entry
  class ADC,Display,ALSA physical
  class Preview simulation
`,sd={components:[{id:`pi`,title:`Raspberry Pi · physical pin numbers`,position:[0,0,45],size:[350,230],color:`#287557`},{id:`lcd`,title:`Waveshare LCD (back)`,position:[-440,0,-180],size:[166,96],color:`#1e6094`},{id:`keypad`,title:`AD-Key · your photographed five-button board`,position:[-460,0,190],size:[110,250],color:`#272c36`},{id:`adc`,title:`ADS1115 / ADS1015 · your board`,position:[350,65,220],size:[78,210],color:`#48205f`},{id:`amp`,title:`MAX98357A · your photographed board`,position:[350,0,-185],size:[150,156],color:`#684b95`},{id:`speaker`,title:`Passive speaker`,position:[535,0,-180],size:[91,91],color:`#2e3540`}],points:{P1:[-134.4,44.8,-30.6],P2:[-134.4,44.8,-55.8],P3:[-120.4,44.8,-30.6],P4:[-120.4,44.8,-55.8],P5:[-106.4,44.8,-30.6],P6:[-106.4,44.8,-55.8],P7:[-92.4,44.8,-30.6],P8:[-92.4,44.8,-55.8],P9:[-78.4,44.8,-30.6],P10:[-78.4,44.8,-55.8],P11:[-64.4,44.8,-30.6],P12:[-64.4,44.8,-55.8],P13:[-50.4,44.8,-30.6],P14:[-50.4,44.8,-55.8],P15:[-36.4,44.8,-30.6],P16:[-36.4,44.8,-55.8],P17:[-22.4,44.8,-30.6],P18:[-22.4,44.8,-55.8],P19:[-8.4,44.8,-30.6],P20:[-8.4,44.8,-55.8],P21:[5.6,44.8,-30.6],P22:[5.6,44.8,-55.8],P23:[19.6,44.8,-30.6],P24:[19.6,44.8,-55.8],P25:[33.6,44.8,-30.6],P26:[33.6,44.8,-55.8],P27:[47.6,44.8,-30.6],P28:[47.6,44.8,-55.8],P29:[61.6,44.8,-30.6],P30:[61.6,44.8,-55.8],P31:[75.6,44.8,-30.6],P32:[75.6,44.8,-55.8],P33:[89.6,44.8,-30.6],P34:[89.6,44.8,-55.8],P35:[103.6,44.8,-30.6],P36:[103.6,44.8,-55.8],P37:[117.6,44.8,-30.6],P38:[117.6,44.8,-55.8],P39:[131.6,44.8,-30.6],P40:[131.6,44.8,-55.8],USB:[-123.2,28,168.2],LVCC:[-500,16.5,-139.5],LGND:[-483.5,16.5,-139.5],LDIN:[-467,16.5,-139.5],LCLK:[-450.5,16.5,-139.5],LCS:[-434,16.5,-139.5],LDC:[-417.5,16.5,-139.5],LRST:[-401,16.5,-139.5],LBL:[-384.5,16.5,-139.5],KGND:[-355,12,276],KVCC:[-355,12,262],KOUT:[-355,12,248],AVDD:[375,20,130],AGND:[375,20,150],ASCL:[375,20,170],ASDA:[375,20,190],AADDR:[375,20,210],AA0:[375,20,250],MVIN:[410,53,-121],MGND:[390,53,-121],MBCLK:[310,53,-121],MLRC:[290,53,-121],MDIN:[330,53,-121],"M+":[366,21,-262],"M-":[334,21,-262],"S+":[498.75,13.75,-165],"S-":[498.75,13.75,-192.5],RIN:[-350,18,245],J:[-240,18,245],RGND:[-240,18,345],POWER:[5,12,310],MGAIN:[350,53,-121],MSD:[370,53,-121],AALERT:[375,20,230],AA1:[375,20,270],AA2:[375,20,290],AA3:[375,20,310],GND_JOIN:[450,20,150]},wires:[{group:`LCD`,from:`P1`,to:`LVCC`,color:`#8050be`,title:`VCC → Pi 1 · purple`,local:0,id:`L1`,path:[[-134.4,44.8,-30.6],[-134.4,60,-30.6],[-134.4,60,-106],[-265,60,-106],[-500,60,-139.5],[-500,60,-139.5],[-500,16.5,-139.5]],colorName:`purple`},{group:`LCD`,from:`P6`,to:`LGND`,color:`#f4f4f0`,title:`GND → Pi 6 · white`,local:1,id:`L2`,path:[[-106.4,44.8,-55.8],[-106.4,63,-55.8],[-106.4,63,-127],[-278,63,-127],[-483.5,63,-139.5],[-483.5,63,-139.5],[-483.5,16.5,-139.5]],colorName:`white`},{group:`LCD`,from:`P19`,to:`LDIN`,color:`#157c6e`,title:`DIN → Pi 19 · green`,local:2,id:`L3`,path:[[-8.4,44.8,-30.6],[-8.4,66,-30.6],[-8.4,66,-148],[-291,66,-148],[-467,66,-139.5],[-467,66,-139.5],[-467,16.5,-139.5]],colorName:`green`},{group:`LCD`,from:`P23`,to:`LCLK`,color:`#ef7b19`,title:`CLK → Pi 23 · orange`,local:3,id:`L4`,path:[[19.6,44.8,-30.6],[19.6,69,-30.6],[19.6,69,-169],[-304,69,-169],[-450.5,69,-139.5],[-450.5,69,-139.5],[-450.5,16.5,-139.5]],colorName:`orange`},{group:`LCD`,from:`P24`,to:`LCS`,color:`#ecc52b`,title:`CS → Pi 24 · yellow`,local:4,id:`L5`,path:[[19.6,44.8,-55.8],[19.6,72,-55.8],[19.6,72,-190],[-317,72,-190],[-434,72,-139.5],[-434,72,-139.5],[-434,16.5,-139.5]],colorName:`yellow`},{group:`LCD`,from:`P22`,to:`LDC`,color:`#2f51b5`,title:`DC → Pi 22 · blue`,local:5,id:`L6`,path:[[5.6,44.8,-55.8],[5.6,75,-55.8],[5.6,75,-211],[-330,75,-211],[-417.5,75,-139.5],[-417.5,75,-139.5],[-417.5,16.5,-139.5]],colorName:`blue`},{group:`LCD`,from:`P13`,to:`LRST`,color:`#93522d`,title:`RST → Pi 13 · brown`,local:6,id:`L7`,path:[[-50.4,44.8,-30.6],[-50.4,78,-30.6],[-50.4,78,-232],[-343,78,-232],[-401,78,-139.5],[-401,78,-139.5],[-401,16.5,-139.5]],colorName:`brown`},{group:`LCD`,from:`P18`,to:`LBL`,color:`#a2a6a8`,title:`BL → Pi 18 · gray`,local:7,id:`L8`,path:[[-22.4,44.8,-55.8],[-22.4,81,-55.8],[-22.4,81,-253],[-356,81,-253],[-384.5,81,-139.5],[-384.5,81,-139.5],[-384.5,16.5,-139.5]],colorName:`gray`},{group:`Audio`,from:`P2`,to:`MVIN`,color:`#d43235`,title:`VIN → Pi 2`,local:0,id:`S1`,path:[[-134.4,44.8,-55.8],[-134.4,104,-55.8],[-134.4,104,51],[410,104,51],[410,104,-121],[410,53,-121]]},{group:`Audio`,from:`P9`,to:`MGND`,color:`#293440`,title:`GND → Pi 9`,local:1,id:`S2`,path:[[-78.4,44.8,-30.6],[-78.4,98,-30.6],[-78.4,98,34],[390,98,34],[390,98,-121],[390,53,-121]]},{group:`Audio`,from:`P12`,to:`MBCLK`,color:`#247cc4`,title:`BCLK → Pi 12`,local:2,id:`S3`,path:[[-64.4,44.8,-55.8],[-64.4,74,-55.8],[-64.4,74,-34],[310,74,-34],[310,74,-121],[310,53,-121]]},{group:`Audio`,from:`P35`,to:`MLRC`,color:`#229a69`,title:`LRC → Pi 35`,local:3,id:`S4`,path:[[103.6,44.8,-30.6],[103.6,68,-30.6],[103.6,68,-51],[290,68,-51],[290,68,-121],[290,53,-121]]},{group:`Audio`,from:`P40`,to:`MDIN`,color:`#8850c7`,title:`DIN → Pi 40`,local:4,id:`S5`,path:[[131.6,44.8,-55.8],[131.6,80,-55.8],[131.6,80,-17],[330,80,-17],[330,80,-121],[330,53,-121]]},{group:`Audio`,from:`M+`,to:`S+`,color:`#ecc52b`,title:`OUT+ → speaker +`,local:5,id:`S6`,path:[[366,21,-262],[366,21,-277],[366,21,-277],[455,21,-277],[455,21,-165],[498.75,21,-165],[498.75,13.75,-165]]},{group:`Audio`,from:`M-`,to:`S-`,color:`#157c6e`,title:`OUT- → speaker - (not GND)`,local:6,id:`S7`,path:[[334,21,-262],[334,21,-277],[334,30,-277],[442,30,-277],[442,30,-192.5],[498.75,30,-192.5],[498.75,13.75,-192.5]]},{group:`ADC`,from:`P17`,to:`AVDD`,color:`#dc8119`,title:`V (VDD) → Pi 17 (3.3 V)`,local:0,id:`A1`,path:[[-22.4,44.8,-30.6],[-22.4,85,-30.6],[-22.4,85,360],[485,85,360],[485,85,130],[397,85,130],[397,20,130],[375,20,130]]},{group:`ADC`,from:`P20`,to:`GND_JOIN`,color:`#e3b51f`,title:`Controller GND → ADC ground join (Pi 20)`,local:1,id:`A2`,path:[[-8.4,44.8,-55.8],[-8.4,96,-55.8],[-8.4,96,380],[501,96,380],[501,96,132],[450,96,132],[450,20,132],[450,20,150]]},{group:`ADC`,from:`P3`,to:`ASDA`,color:`#247cc4`,title:`SDA → Pi 3`,local:2,id:`A3`,path:[[-120.4,44.8,-30.6],[-120.4,107,-30.6],[-120.4,107,400],[517,107,400],[517,107,190],[397,107,190],[397,20,190],[375,20,190]]},{group:`ADC`,from:`P5`,to:`ASCL`,color:`#229a69`,title:`SCL → Pi 5`,local:3,id:`A4`,path:[[-106.4,44.8,-30.6],[-106.4,118,-30.6],[-106.4,118,420],[533,118,420],[533,118,170],[397,118,170],[397,20,170],[375,20,170]]},{group:`ADC`,from:`AADDR`,to:`GND_JOIN`,color:`#e3b51f`,title:`ADDR → ground join (0x48)`,local:4,id:`A5`,path:[[375,20,210],[397,20,210],[397,35,210],[450,35,210],[450,35,150],[450,20,150]]},{group:`Keypad`,from:`P4`,to:`KVCC`,color:`#d43235`,title:`VCC → Pi 4 (5 V)`,local:0,id:`K1`,path:[[-120.4,44.8,-55.8],[-120.4,70,-55.8],[-120.4,70,345],[-323,70,345],[-323,70,262],[-323,12,262],[-355,12,262]]},{group:`Keypad`,from:`P14`,to:`KGND`,color:`#293440`,title:`GND → Pi 14`,local:1,id:`K2`,path:[[-50.4,44.8,-55.8],[-50.4,90,-55.8],[-50.4,90,367],[-305,90,367],[-305,90,276],[-305,12,276],[-355,12,276]]},{group:`Keypad`,from:`KOUT`,to:`RIN`,color:`#b79510`,title:`OUT → R1 input`,local:2,id:`K3`,path:[[-355,12,248],[-333,12,248],[-333,38,248],[-350,38,248],[-350,38,245],[-350,18,245]]},{group:`Keypad`,from:`J`,to:`AA0`,color:`#8850c7`,title:`R1/R2 junction → ADC A0`,local:3,id:`K4`,path:[[-240,18,245],[-240,129,245],[-240,129,440],[549,129,440],[549,129,250],[397,129,250],[397,20,250],[375,20,250]]},{group:`Keypad`,from:`RGND`,to:`GND_JOIN`,color:`#e3b51f`,title:`R2 lower lead → ground join`,local:4,id:`K5`,path:[[-240,18,345],[-240,140,345],[-240,140,460],[565,140,460],[565,140,150],[565,20,150],[450,20,150]]},{group:`Power`,from:`POWER`,to:`USB`,color:`#293440`,title:`5 V micro-USB power → Pi power socket`,local:0,id:`USB`,path:[[5,12,310],[5,60,310],[5,22,300],[-123.2,22,300],[-123.2,60,168.2],[-123.2,28,168.2]]},{id:`A6`,group:`ADC`,from:`AGND`,to:`GND_JOIN`,color:`#e3b51f`,title:`G → shared ground join`,local:5,path:[[375,20,150],[450,20,150]]}],lcdColorReference:`photos/colors.jpg`,amplifierReferences:[`photos/max4.jpg`,`photos/max1.jpg`,`photos/max2.jpg`,`photos/max3.jpg`]},cd={name:`Alfa`,title:`Little House Radio`,revision:`1`,outer_mm:[178.3,278,100],handle:{grip_length:88,finger_gap:41.2,grip_diameter:22},wood_colors:[`#d8b384`,`#b38f62`,`#b4553e`],modules:{lcd:{min:[-51.5,59,-19.6],max:[-16.5,117,-6]},keypad:{min:[17,17.5,-12.1],max:[67,82.5,-1]},speaker:{min:[-20,132,-8.2],max:[20,172,-7]},pi:{min:[-69,23,-80],max:[-36.9,110,-20]},battery:{min:[-34.5,6,-94],max:[34.5,112,-78]},power:{min:[-6,112,-88.25],max:[6,134,-81.75]},switch:{min:[28,98,-98],max:[62,138,-82]},amp:{min:[-43,6,-45],max:[-23,14,-30]},adc:{min:[-19,6,-59],max:[-10,14,-30]},divider:{min:[-43,6,-70],max:[-27,14,-50]},handle:{min:[-11,242,-100],max:[11,264,0]}},modes:[`assembled`,`roof_open`,`inside`,`exploded`],wires:[{id:`L1`,group:`LCD`,from:`P1`,to:`LVCC`,title:`VCC → Pi 1 · purple`,color:`#8050be`,route:[[-36.9,102.5,-24.77],[-33.9,102.5,-24.77],[-33.9,115.6,-24.77],[-33.9,115.6,-19.6],[-25.11,115.6,-19.6],[-25.11,114.6,-19.6]],route_length_mm:31.1,suggested_length_mm:150},{id:`L2`,group:`LCD`,from:`P6`,to:`LGND`,title:`GND → Pi 6 · white`,color:`#f4f4f0`,route:[[-36.9,97.42,-22.23],[-33.35,97.42,-22.23],[-33.35,116,-22.23],[-33.35,116,-19.6],[-27.65,116,-19.6],[-27.65,114.6,-19.6]],route_length_mm:31.9,suggested_length_mm:150},{id:`L3`,group:`LCD`,from:`P19`,to:`LDIN`,title:`DIN → Pi 19 · green`,color:`#157c6e`,route:[[-36.9,79.64,-24.77],[-32.8,79.64,-24.77],[-32.8,116.39999999999999,-24.77],[-32.8,116.39999999999999,-19.6],[-30.189999999999998,116.39999999999999,-19.6],[-30.189999999999998,114.6,-19.6]],route_length_mm:50.4,suggested_length_mm:200},{id:`L4`,group:`LCD`,from:`P23`,to:`LCLK`,title:`CLK → Pi 23 · orange`,color:`#ef7b19`,route:[[-36.9,74.56,-24.77],[-32.25,74.56,-24.77],[-32.25,116.8,-24.77],[-32.25,116.8,-19.6],[-32.73,116.8,-19.6],[-32.73,114.6,-19.6]],route_length_mm:54.7,suggested_length_mm:200},{id:`L5`,group:`LCD`,from:`P24`,to:`LCS`,title:`CS → Pi 24 · yellow`,color:`#ecc52b`,route:[[-36.9,74.56,-22.23],[-31.7,74.56,-22.23],[-31.7,117.19999999999999,-22.23],[-31.7,117.19999999999999,-19.6],[-35.269999999999996,117.19999999999999,-19.6],[-35.269999999999996,114.6,-19.6]],route_length_mm:56.6,suggested_length_mm:200},{id:`L6`,group:`LCD`,from:`P22`,to:`LDC`,title:`DC → Pi 22 · blue`,color:`#2f51b5`,route:[[-36.9,77.1,-22.23],[-31.15,77.1,-22.23],[-31.15,117.6,-22.23],[-31.15,117.6,-19.6],[-37.81,117.6,-19.6],[-37.81,114.6,-19.6]],route_length_mm:58.5,suggested_length_mm:200},{id:`L7`,group:`LCD`,from:`P13`,to:`LRST`,title:`RST → Pi 13 · brown`,color:`#93522d`,route:[[-36.9,87.26,-24.77],[-30.599999999999998,87.26,-24.77],[-30.599999999999998,118,-24.77],[-30.599999999999998,118,-19.6],[-40.35,118,-19.6],[-40.35,114.6,-19.6]],route_length_mm:55.4,suggested_length_mm:200},{id:`L8`,group:`LCD`,from:`P18`,to:`LBL`,title:`BL → Pi 18 · gray`,color:`#a2a6a8`,route:[[-36.9,82.18,-22.23],[-30.049999999999997,82.18,-22.23],[-30.049999999999997,118.39999999999999,-22.23],[-30.049999999999997,118.39999999999999,-19.6],[-42.89,118.39999999999999,-19.6],[-42.89,114.6,-19.6]],route_length_mm:62.3,suggested_length_mm:200},{id:`S1`,group:`Audio`,from:`P2`,to:`MVIN`,title:`VIN → Pi 2`,color:`#d43235`,route:[[-36.9,102.5,-22.23],[-29.5,102.5,-22.23],[-29.5,24,-22.23],[-29.5,24,-43],[-25.379999999999995,24,-43],[-25.379999999999995,14,-43]],route_length_mm:120.8,suggested_length_mm:250},{id:`S2`,group:`Audio`,from:`P9`,to:`MGND`,title:`GND → Pi 9`,color:`#293440`,route:[[-36.9,92.34,-24.77],[-33.9,92.34,-24.77],[-33.9,20,-24.77],[-33.9,20,-43],[-27.919999999999998,20,-43],[-27.919999999999998,14,-43]],route_length_mm:105.6,suggested_length_mm:250},{id:`S3`,group:`Audio`,from:`P12`,to:`MBCLK`,title:`BCLK → Pi 12`,color:`#247cc4`,route:[[-36.9,89.8,-22.23],[-33.35,89.8,-22.23],[-33.35,20.5,-22.23],[-33.35,20.5,-43],[-38.08,20.5,-43],[-38.08,14,-43]],route_length_mm:104.8,suggested_length_mm:250},{id:`S4`,group:`Audio`,from:`P35`,to:`MLRC`,title:`LRC → Pi 35`,color:`#229a69`,route:[[-36.9,59.32,-24.77],[-32.8,59.32,-24.77],[-32.8,21,-24.77],[-32.8,21,-43],[-40.62,21,-43],[-40.62,14,-43]],route_length_mm:75.5,suggested_length_mm:200},{id:`S5`,group:`Audio`,from:`P40`,to:`MDIN`,title:`DIN → Pi 40`,color:`#8850c7`,route:[[-36.9,54.24,-22.23],[-32.25,54.24,-22.23],[-32.25,21.5,-22.23],[-32.25,21.5,-43],[-35.54,21.5,-43],[-35.54,14,-43]],route_length_mm:69,suggested_length_mm:200},{id:`S6`,group:`Audio`,from:`M+`,to:`S+`,title:`OUT+ → speaker +`,color:`#ecc52b`,route:[[-29,12,-32],[-29,12,-30.2],[-29,128,-30.2],[4,128,-30.2],[4,128,-12],[4,133,-12]],route_length_mm:174,suggested_length_mm:250},{id:`S7`,group:`Audio`,from:`M-`,to:`S-`,title:`OUT- → speaker - (not GND)`,color:`#157c6e`,route:[[-37,12,-32],[-37,12,-30.5],[-37,128,-30.5],[-4,128,-30.5],[-4,128,-12],[-4,133,-12]],route_length_mm:174,suggested_length_mm:250},{id:`A1`,group:`ADC`,from:`P17`,to:`AVDD`,title:`V (VDD) → Pi 17 (3.3 V)`,color:`#dc8119`,route:[[-36.9,82.18,-24.77],[-30.599999999999998,82.18,-24.77],[-30.599999999999998,23,-24.77],[-30.599999999999998,23,-33.07],[-11.5,23,-33.07],[-11.5,14,-33.07]],route_length_mm:101.9,suggested_length_mm:250},{id:`A2`,group:`ADC`,from:`P20`,to:`GND_JOIN`,title:`Controller GND → ADC ground join (Pi 20)`,color:`#e3b51f`,route:[[-36.9,79.64,-22.23],[-30.049999999999997,79.64,-22.23],[-30.049999999999997,23.5,-22.23],[-30.049999999999997,23.5,-55],[-29,23.5,-55],[-29,14,-55]],route_length_mm:106.3,suggested_length_mm:250},{id:`A3`,group:`ADC`,from:`P3`,to:`ASDA`,title:`SDA → Pi 3`,color:`#247cc4`,route:[[-36.9,99.96,-24.77],[-29.5,99.96,-24.77],[-29.5,24,-24.77],[-29.5,24,-40.69],[-11.5,24,-40.69],[-11.5,14,-40.69]],route_length_mm:127.3,suggested_length_mm:250},{id:`A4`,group:`ADC`,from:`P5`,to:`ASCL`,title:`SCL → Pi 5`,color:`#229a69`,route:[[-36.9,97.42,-24.77],[-33.9,97.42,-24.77],[-33.9,20,-24.77],[-33.9,20,-38.15],[-11.5,20,-38.15],[-11.5,14,-38.15]],route_length_mm:122.2,suggested_length_mm:250},{id:`A5`,group:`ADC`,from:`AADDR`,to:`GND_JOIN`,title:`ADDR → ground join (0x48)`,color:`#e3b51f`,route:[[-11.5,14,-43.230000000000004],[-11.5,18.4,-43.230000000000004],[-29,18.4,-43.230000000000004],[-29,18.4,-55],[-29,14,-55]],route_length_mm:38.1,suggested_length_mm:100},{id:`K1`,group:`Keypad`,from:`P4`,to:`KVCC`,title:`VCC → Pi 4 (5 V)`,color:`#d43235`,route:[[-36.9,99.96,-22.23],[-32.8,99.96,-22.23],[-32.8,33.96,-22.23],[67.8,33.96,-22.23],[67.8,33.96,-10.1],[67,33.96,-10.1]],route_length_mm:183.6,suggested_length_mm:300},{id:`K2`,group:`Keypad`,from:`P14`,to:`KGND`,title:`GND → Pi 14`,color:`#293440`,route:[[-36.9,87.26,-22.23],[-32.25,87.26,-22.23],[-32.25,31.42,-22.23],[67.95,31.42,-22.23],[67.95,31.42,-10.1],[67,31.42,-10.1]],route_length_mm:173.8,suggested_length_mm:300},{id:`K3`,group:`Keypad`,from:`KOUT`,to:`RIN`,title:`OUT → R1 input`,color:`#b79510`,route:[[67,36.5,-10.1],[67.8,36.5,-10.1],[67.8,36.5,-24],[67.8,20,-24],[67.8,20,-55],[-41,20,-55],[-41,14,-55]],route_length_mm:177,suggested_length_mm:250},{id:`K4`,group:`Keypad`,from:`J`,to:`AA0`,title:`R1/R2 junction → ADC A0`,color:`#8850c7`,route:[[-35,14,-62],[-35,20,-62],[-11.5,20,-62],[-11.5,20,-48.31],[-11.5,14,-48.31]],route_length_mm:49.2,suggested_length_mm:100},{id:`K5`,group:`Keypad`,from:`RGND`,to:`GND_JOIN`,title:`R2 lower lead → ground join`,color:`#e3b51f`,route:[[-29,14,-68],[-29,20.4,-68],[-29,20.4,-55],[-29,14,-55]],route_length_mm:25.8,suggested_length_mm:100},{id:`USB`,group:`Power`,from:`POWER`,to:`USB`,title:`5 V micro-USB power → Pi power socket`,color:`#293440`,route:[[0,134,-85],[0,142,-85],[45,142,-88],[45,138,-88],[45,98,-88],[45,94,-88],[45,94,-70],[-31.4,94,-70],[-31.4,99.4,-75],[-39.4,99.4,-75]],route_length_mm:210.9,suggested_length_mm:350},{id:`A6`,group:`ADC`,from:`AGND`,to:`GND_JOIN`,title:`G → shared ground join`,color:`#e3b51f`,route:[[-11.5,14,-35.61],[-11.5,21.2,-35.61],[-29,21.2,-35.61],[-29,21.2,-55],[-29,14,-55]],route_length_mm:51.3,suggested_length_mm:100}],fasteners:[{id:`A`,title:`Back gable to corner blocks`,designation:`M3 × 25 countersunk (ISO 10642)`,count:4},{id:`B`,title:`Hinge leaf to wall`,designation:`M3 × 12 countersunk (ISO 10642)`,count:8},{id:`C`,title:`Hinge leaf to roof eave`,designation:`M3 × 10 countersunk (ISO 10642)`,count:8},{id:`D`,title:`Knob to roof board`,designation:`wood screw 3 × 16 countersunk`,count:2},{id:`E`,title:`Dowel handle ends`,designation:`wood screw 4 × 25 pan head`,count:2},{id:`F`,title:`LCD to front gable`,designation:`M2.5 × 16 countersunk (ISO 10642)`,count:4},{id:`G`,title:`Speaker to front gable`,designation:`M3 × 12 countersunk (ISO 10642)`,count:4},{id:`H`,title:`Keypad to front gable tabs`,designation:`M2.5 × 12 countersunk (ISO 10642)`,count:4},{id:`I`,title:`Pi standoffs to left wall`,designation:`M2.5 × 10 countersunk (ISO 10642)`,count:4},{id:`J`,title:`Pi board to standoffs`,designation:`M2.5 × 5 pan head (ISO 7045)`,count:4},{id:`K`,title:`Small boards to floor`,designation:`M2.5 × 16 nylon pan head (ISO 7045)`,count:6},{id:`L`,title:`Switch clamp through back gable`,designation:`M3 × 30 countersunk (ISO 10642)`,count:2}],cut_list:[{part:`front_gable`,title:`FRONT GABLE`,size_mm:[150,278],quantity:1},{part:`back_gable`,title:`BACK GABLE`,size_mm:[150,278],quantity:1},{part:`left_wall`,title:`LEFT WALL`,size_mm:[88,121.5],quantity:1},{part:`right_wall`,title:`RIGHT WALL`,size_mm:[88,121.5],quantity:1},{part:`floor`,title:`FLOOR`,size_mm:[88,138],quantity:1},{part:`corner_block`,title:`BLOCK PAD`,size_mm:[12,12],quantity:8},{part:`battery_fence`,title:`BATTERY FENCE`,size_mm:[12,69],quantity:1},{part:`switch_clamp`,title:`SWITCH CLAMP`,size_mm:[18,38],quantity:1},{part:`roof_board`,title:`ROOF BOARD`,size_mm:[86,120.1],quantity:2},{part:`magnet_wedge`,title:`MAGNET WEDGE`,size_mm:[16,16],quantity:12}],checks:{passed:!0,count:50},mass_g:829,tip_angles_deg:{left:38,right:39.3,back:25.4,front:30.6},documents:{plan:`/design/house-radio/PDF/Alfa.pdf`,assembly:`/design/house-radio/PDF/Alfa-assembly.pdf`,templates:`/design/house-radio/PDF/Alfa-cut-templates.pdf`,step:`/design/house-radio/STEP/house_assembled.step`}},ld={parameters:{units:`mm`,revision:`A`,case:{width:150,height:200,depth:64,plywood:6,saw_gap:5},battery:{size:[69,106,14],origin:[73,82,9],confidence:`user dimensions`,mass_g:150},pi:{size:[56,85,1.6],origin:[28,55,48.4],standoff:8,mount_holes:[[31.5,58.5],[80.5,58.5],[31.5,116.5],[80.5,116.5]],confidence:`manufacturer drawing; rotated portrait; connectors simplified`},lcd:{size:[35,58,10],origin:[24.5,18,6],window:[26,24,32,46],mount_holes:[[27,20.5],[57,20.5],[27,73.5],[57,73.5]],confidence:`manufacturer outline and 30 x 53 hole pitch; active-area offset inferred`},keypad:{size:[30,65,1.6],origin:[22,110,7],button_centres:[[37,118],[29.5,133],[44.5,133],[37,148],[37,167]],cap_diameter:12,cap_height:6,confidence:`user PCB dimensions; button positions and heights approximate; transfer mounting holes`},speaker:{size:[40,40,20],origin:[92,12,6],centre:[112,32],confidence:`user overall dimensions; frame, magnet and mounting holes simplified`},adc:{size:[9,29,1.6],origin:[59,135,9],confidence:`user PCB dimensions; header and mounting details approximate`},amp:{size:[20,15,1.6],origin:[51,89,10],confidence:`user PCB dimensions; header and terminal heights approximate`},divider:{size:[16,20,1.6],origin:[54,174,9],confidence:`new small perfboard with two 10 kohm resistors`},switch:{size:[18,40,22],origin:[0,140,21],confidence:`PROVISIONAL clearance envelope; supplier does not publish housing dimensions`,reference:`https://thepihut.com/products/micro-usb-cable-with-on-off-switch`,supplier_sku:`103418`,actuator_diameter:16},switch_cover:{size:[40,72],origin_yz:[124,12],screw_holes:[[20,8],[20,64]]},rear_screws:[[12,12],[138,12],[12,188],[138,188]],notes:[`All origins are the top-left-front of each envelope in the assembled case.`,`Exported CAD coordinates map drawing x,y,z to x,-y,-z; drawing y increases downward, z goes into the box.`,`Only 5 existing keypad buttons; no additional GPIO power button.`,`Four M3 screws release the entire rear panel for battery and connector access.`,`No router, laser cutter or 3D printer is required.`,`Mounting holes on the keypad, speaker, ADC and amplifier must be transferred from the actual parts.`,`Confirm the inline switch housing and actuator before cutting its opening and cover.`,`The Baseus USB-C socket is shared for charging and output. Remove the rear panel and unplug the Pi power cable to recharge the bank.`]},points:{P1:[79.23,62.5,30.4],P2:[81.77,62.5,30.4],P3:[79.23,65.04,30.4],P4:[81.77,65.04,30.4],P5:[79.23,67.58,30.4],P6:[81.77,67.58,30.4],P7:[79.23,70.12,30.4],P8:[81.77,70.12,30.4],P9:[79.23,72.66,30.4],P10:[81.77,72.66,30.4],P11:[79.23,75.2,30.4],P12:[81.77,75.2,30.4],P13:[79.23,77.74,30.4],P14:[81.77,77.74,30.4],P15:[79.23,80.28,30.4],P16:[81.77,80.28,30.4],P17:[79.23,82.82,30.4],P18:[81.77,82.82,30.4],P19:[79.23,85.36,30.4],P20:[81.77,85.36,30.4],P21:[79.23,87.9,30.4],P22:[81.77,87.9,30.4],P23:[79.23,90.44,30.4],P24:[81.77,90.44,30.4],P25:[79.23,92.98,30.4],P26:[81.77,92.98,30.4],P27:[79.23,95.52000000000001,30.4],P28:[81.77,95.52000000000001,30.4],P29:[79.23,98.06,30.4],P30:[81.77,98.06,30.4],P31:[79.23,100.6,30.4],P32:[81.77,100.6,30.4],P33:[79.23,103.14,30.4],P34:[81.77,103.14,30.4],P35:[79.23,105.68,30.4],P36:[81.77,105.68,30.4],P37:[79.23,108.22,30.4],P38:[81.77,108.22,30.4],P39:[79.23,110.75999999999999,30.4],P40:[81.77,110.75999999999999,30.4],LVCC:[50.89,20.4,17],LGND:[48.35,20.4,17],LDIN:[45.81,20.4,17],LCLK:[43.27,20.4,17],LCS:[40.730000000000004,20.4,17],LDC:[38.19,20.4,17],LRST:[35.65,20.4,17],LBL:[33.11,20.4,17],MLRC:[53.38,102,20],MBCLK:[55.92,102,20],MDIN:[58.46,102,20],MGAIN:[61,102,20],MSD:[63.540000000000006,102,20],MGND:[66.08,102,20],MVIN:[68.62,102,20],"M-":[58,91,15],"M+":[64,91,15],AVDD:[66.5,138.07,16],AGND:[66.5,140.60999999999999,16],ASCL:[66.5,143.15,16],ASDA:[66.5,145.69,16],AADDR:[66.5,148.23,16],AALERT:[66.5,150.76999999999998,16],AA0:[66.5,153.31,16],AA1:[66.5,155.85,16],AA2:[66.5,158.39,16],AA3:[66.5,160.93,16],GND_JOIN:[68,186,12],KOUT:[58,156,10],KVCC:[58,158.54,10],KGND:[58,161.08,10],RIN:[56,180,12],J:[66,180,12],RGND:[66,190,12],"S+":[95,31,18],"S-":[95,35,18],POWER:[107.5,82,16],USB:[28,65.6,43],SW_IN:[9,140,32],SW_OUT:[9,180,32]},wires:[{group:`LCD`,from:`P1`,to:`LVCC`,color:`#8050be`,title:`VCC → Pi 1 · purple`,local:0,id:`L1`,path:[[-134.4,44.8,-30.6],[-134.4,60,-30.6],[-134.4,60,-106],[-265,60,-106],[-500,60,-139.5],[-500,60,-139.5],[-500,16.5,-139.5]],colorName:`purple`,route:[[79.23,62.5,30.4],[79.23,62.5,26],[69.1,62.5,26],[69.1,20.4,26],[50.89,20.4,26],[50.89,20.4,17]],route_length_mm:83.8,suggested_length_mm:200},{group:`LCD`,from:`P6`,to:`LGND`,color:`#f4f4f0`,title:`GND → Pi 6 · white`,local:1,id:`L2`,path:[[-106.4,44.8,-55.8],[-106.4,63,-55.8],[-106.4,63,-127],[-278,63,-127],[-483.5,63,-139.5],[-483.5,63,-139.5],[-483.5,16.5,-139.5]],colorName:`white`,route:[[81.77,67.58,30.4],[81.77,67.58,26.65],[69.5,67.58,26.65],[69.5,20.4,26.65],[48.35,20.4,26.65],[48.35,20.4,17]],route_length_mm:94,suggested_length_mm:200},{group:`LCD`,from:`P19`,to:`LDIN`,color:`#157c6e`,title:`DIN → Pi 19 · green`,local:2,id:`L3`,path:[[-8.4,44.8,-30.6],[-8.4,66,-30.6],[-8.4,66,-148],[-291,66,-148],[-467,66,-139.5],[-467,66,-139.5],[-467,16.5,-139.5]],colorName:`green`,route:[[79.23,85.36,30.4],[79.23,85.36,27.3],[69.89999999999999,85.36,27.3],[69.89999999999999,20.4,27.3],[45.81,20.4,27.3],[45.81,20.4,17]],route_length_mm:111.8,suggested_length_mm:250},{group:`LCD`,from:`P23`,to:`LCLK`,color:`#ef7b19`,title:`CLK → Pi 23 · orange`,local:3,id:`L4`,path:[[19.6,44.8,-30.6],[19.6,69,-30.6],[19.6,69,-169],[-304,69,-169],[-450.5,69,-139.5],[-450.5,69,-139.5],[-450.5,16.5,-139.5]],colorName:`orange`,route:[[79.23,90.44,30.4],[79.23,90.44,27.95],[70.3,90.44,27.95],[70.3,20.4,27.95],[43.27,20.4,27.95],[43.27,20.4,17]],route_length_mm:119.4,suggested_length_mm:250},{group:`LCD`,from:`P24`,to:`LCS`,color:`#ecc52b`,title:`CS → Pi 24 · yellow`,local:4,id:`L5`,path:[[19.6,44.8,-55.8],[19.6,72,-55.8],[19.6,72,-190],[-317,72,-190],[-434,72,-139.5],[-434,72,-139.5],[-434,16.5,-139.5]],colorName:`yellow`,route:[[81.77,90.44,30.4],[81.77,90.44,28.6],[69.1,90.44,28.6],[69.1,20.4,28.6],[40.730000000000004,20.4,28.6],[40.730000000000004,20.4,17]],route_length_mm:124.5,suggested_length_mm:250},{group:`LCD`,from:`P22`,to:`LDC`,color:`#2f51b5`,title:`DC → Pi 22 · blue`,local:5,id:`L6`,path:[[5.6,44.8,-55.8],[5.6,75,-55.8],[5.6,75,-211],[-330,75,-211],[-417.5,75,-139.5],[-417.5,75,-139.5],[-417.5,16.5,-139.5]],colorName:`blue`,route:[[81.77,87.9,30.4],[81.77,87.9,26],[69.5,87.9,26],[69.5,20.4,26],[38.19,20.4,26],[38.19,20.4,17]],route_length_mm:124.5,suggested_length_mm:250},{group:`LCD`,from:`P13`,to:`LRST`,color:`#93522d`,title:`RST → Pi 13 · brown`,local:6,id:`L7`,path:[[-50.4,44.8,-30.6],[-50.4,78,-30.6],[-50.4,78,-232],[-343,78,-232],[-401,78,-139.5],[-401,78,-139.5],[-401,16.5,-139.5]],colorName:`brown`,route:[[79.23,77.74,30.4],[79.23,77.74,26.65],[69.89999999999999,77.74,26.65],[69.89999999999999,20.4,26.65],[35.65,20.4,26.65],[35.65,20.4,17]],route_length_mm:114.3,suggested_length_mm:250},{group:`LCD`,from:`P18`,to:`LBL`,color:`#a2a6a8`,title:`BL → Pi 18 · gray`,local:7,id:`L8`,path:[[-22.4,44.8,-55.8],[-22.4,81,-55.8],[-22.4,81,-253],[-356,81,-253],[-384.5,81,-139.5],[-384.5,81,-139.5],[-384.5,16.5,-139.5]],colorName:`gray`,route:[[81.77,82.82,30.4],[81.77,82.82,27.3],[70.3,82.82,27.3],[70.3,20.4,27.3],[33.11,20.4,27.3],[33.11,20.4,17]],route_length_mm:124.5,suggested_length_mm:250},{group:`Audio`,from:`P2`,to:`MVIN`,color:`#d43235`,title:`VIN → Pi 2`,local:0,id:`S1`,path:[[-134.4,44.8,-55.8],[-134.4,104,-55.8],[-134.4,104,51],[410,104,51],[410,104,-121],[410,53,-121]],route:[[81.77,62.5,30.4],[81.77,62.5,27.95],[69.1,62.5,27.95],[69.1,102,27.95],[68.62,102,27.95],[68.62,102,20]],route_length_mm:63,suggested_length_mm:200},{group:`Audio`,from:`P9`,to:`MGND`,color:`#293440`,title:`GND → Pi 9`,local:1,id:`S2`,path:[[-78.4,44.8,-30.6],[-78.4,98,-30.6],[-78.4,98,34],[390,98,34],[390,98,-121],[390,53,-121]],route:[[79.23,72.66,30.4],[79.23,72.66,28.6],[69.5,72.66,28.6],[69.5,102,28.6],[66.08,102,28.6],[66.08,102,20]],route_length_mm:52.9,suggested_length_mm:200},{group:`Audio`,from:`P12`,to:`MBCLK`,color:`#247cc4`,title:`BCLK → Pi 12`,local:2,id:`S3`,path:[[-64.4,44.8,-55.8],[-64.4,74,-55.8],[-64.4,74,-34],[310,74,-34],[310,74,-121],[310,53,-121]],route:[[81.77,75.2,30.4],[81.77,75.2,26],[69.89999999999999,75.2,26],[69.89999999999999,102,26],[55.92,102,26],[55.92,102,20]],route_length_mm:63,suggested_length_mm:200},{group:`Audio`,from:`P35`,to:`MLRC`,color:`#229a69`,title:`LRC → Pi 35`,local:3,id:`S4`,path:[[103.6,44.8,-30.6],[103.6,68,-30.6],[103.6,68,-51],[290,68,-51],[290,68,-121],[290,53,-121]],route:[[79.23,105.68,30.4],[79.23,105.68,26.65],[70.3,105.68,26.65],[70.3,102,26.65],[53.38,102,26.65],[53.38,102,20]],route_length_mm:39.9,suggested_length_mm:150},{group:`Audio`,from:`P40`,to:`MDIN`,color:`#8850c7`,title:`DIN → Pi 40`,local:4,id:`S5`,path:[[131.6,44.8,-55.8],[131.6,80,-55.8],[131.6,80,-17],[330,80,-17],[330,80,-121],[330,53,-121]],route:[[81.77,110.75999999999999,30.4],[81.77,110.75999999999999,27.3],[69.1,110.75999999999999,27.3],[69.1,102,27.3],[58.46,102,27.3],[58.46,102,20]],route_length_mm:42.5,suggested_length_mm:150},{group:`Audio`,from:`M+`,to:`S+`,color:`#ecc52b`,title:`OUT+ → speaker +`,local:5,id:`S6`,path:[[366,21,-262],[366,21,-277],[366,21,-277],[455,21,-277],[455,21,-165],[498.75,21,-165],[498.75,13.75,-165]],route:[[64,91,15],[64,78,18],[87,78,18],[87,31,18],[95,31,18]],route_length_mm:91.3,suggested_length_mm:150},{group:`Audio`,from:`M-`,to:`S-`,color:`#157c6e`,title:`OUT- → speaker - (not GND)`,local:6,id:`S7`,path:[[334,21,-262],[334,21,-277],[334,30,-277],[442,30,-277],[442,30,-192.5],[498.75,30,-192.5],[498.75,13.75,-192.5]],route:[[58,91,15],[58,78,18],[87,78,18],[87,35,18],[95,35,18]],route_length_mm:93.3,suggested_length_mm:150},{group:`ADC`,from:`P17`,to:`AVDD`,color:`#dc8119`,title:`V (VDD) → Pi 17 (3.3 V)`,local:0,id:`A1`,path:[[-22.4,44.8,-30.6],[-22.4,85,-30.6],[-22.4,85,360],[485,85,360],[485,85,130],[397,85,130],[397,20,130],[375,20,130]],route:[[79.23,82.82,30.4],[79.23,82.82,26],[70.3,82.82,26],[70.3,138.07,26],[66.5,138.07,26],[66.5,138.07,16]],route_length_mm:82.4,suggested_length_mm:200},{group:`ADC`,from:`P20`,to:`GND_JOIN`,color:`#e3b51f`,title:`Controller GND → ADC ground join (Pi 20)`,local:1,id:`A2`,path:[[-8.4,44.8,-55.8],[-8.4,96,-55.8],[-8.4,96,380],[501,96,380],[501,96,132],[450,96,132],[450,20,132],[450,20,150]],route:[[81.77,85.36,30.4],[81.77,85.36,26.65],[69.1,85.36,26.65],[69.1,186,26.65],[68,186,26.65],[68,186,12]],route_length_mm:132.8,suggested_length_mm:250},{group:`ADC`,from:`P3`,to:`ASDA`,color:`#247cc4`,title:`SDA → Pi 3`,local:2,id:`A3`,path:[[-120.4,44.8,-30.6],[-120.4,107,-30.6],[-120.4,107,400],[517,107,400],[517,107,190],[397,107,190],[397,20,190],[375,20,190]],route:[[79.23,65.04,30.4],[79.23,65.04,27.3],[69.5,65.04,27.3],[69.5,145.69,27.3],[66.5,145.69,27.3],[66.5,145.69,16]],route_length_mm:107.8,suggested_length_mm:250},{group:`ADC`,from:`P5`,to:`ASCL`,color:`#229a69`,title:`SCL → Pi 5`,local:3,id:`A4`,path:[[-106.4,44.8,-30.6],[-106.4,118,-30.6],[-106.4,118,420],[533,118,420],[533,118,170],[397,118,170],[397,20,170],[375,20,170]],route:[[79.23,67.58,30.4],[79.23,67.58,27.95],[69.89999999999999,67.58,27.95],[69.89999999999999,143.15,27.95],[66.5,143.15,27.95],[66.5,143.15,16]],route_length_mm:102.7,suggested_length_mm:250},{group:`ADC`,from:`AADDR`,to:`GND_JOIN`,color:`#e3b51f`,title:`ADDR → ground join (0x48)`,local:4,id:`A5`,path:[[375,20,210],[397,20,210],[397,35,210],[450,35,210],[450,35,150],[450,20,150]],route:[[66.5,148.23,16],[66.5,148.23,19],[68,148.23,19],[68,186,19],[68,186,12]],route_length_mm:49.3,suggested_length_mm:100},{group:`Keypad`,from:`P4`,to:`KVCC`,color:`#d43235`,title:`VCC → Pi 4 (5 V)`,local:0,id:`K1`,path:[[-120.4,44.8,-55.8],[-120.4,70,-55.8],[-120.4,70,345],[-323,70,345],[-323,70,262],[-323,12,262],[-355,12,262]],route:[[81.77,65.04,30.4],[81.77,65.04,26],[69.1,65.04,26],[69.1,158.54,26],[58,158.54,26],[58,158.54,10]],route_length_mm:137.7,suggested_length_mm:250},{group:`Keypad`,from:`P14`,to:`KGND`,color:`#293440`,title:`GND → Pi 14`,local:1,id:`K2`,path:[[-50.4,44.8,-55.8],[-50.4,90,-55.8],[-50.4,90,367],[-305,90,367],[-305,90,276],[-305,12,276],[-355,12,276]],route:[[81.77,77.74,30.4],[81.77,77.74,26.65],[69.5,77.74,26.65],[69.5,161.08,26.65],[58,161.08,26.65],[58,161.08,10]],route_length_mm:127.5,suggested_length_mm:250},{group:`Keypad`,from:`KOUT`,to:`RIN`,color:`#b79510`,title:`OUT → R1 input`,local:2,id:`K3`,path:[[-355,12,248],[-333,12,248],[-333,38,248],[-350,38,248],[-350,38,245],[-350,18,245]],route:[[58,156,10],[58,156,19],[56,156,19],[56,180,19],[56,180,12]],route_length_mm:42,suggested_length_mm:100},{group:`Keypad`,from:`J`,to:`AA0`,color:`#8850c7`,title:`R1/R2 junction → ADC A0`,local:3,id:`K4`,path:[[-240,18,245],[-240,129,245],[-240,129,440],[549,129,440],[549,129,250],[397,129,250],[397,20,250],[375,20,250]],route:[[66,180,12],[66,180,19],[66.5,180,19],[66.5,153.31,19],[66.5,153.31,16]],route_length_mm:37.2,suggested_length_mm:100},{group:`Keypad`,from:`RGND`,to:`GND_JOIN`,color:`#e3b51f`,title:`R2 lower lead → ground join`,local:4,id:`K5`,path:[[-240,18,345],[-240,140,345],[-240,140,460],[565,140,460],[565,140,150],[565,20,150],[450,20,150]],route:[[66,190,12],[66,190,19],[68,190,19],[68,186,19],[68,186,12]],route_length_mm:20,suggested_length_mm:50},{group:`Power`,from:`POWER`,to:`USB`,color:`#293440`,title:`5 V micro-USB power → Pi power socket`,local:0,id:`USB`,path:[[5,12,310],[5,60,310],[5,22,300],[-123.2,22,300],[-123.2,60,168.2],[-123.2,28,168.2]],route:[[107.5,82,16],[107.5,60,16],[107.5,60,25],[87,78,25],[16,78,25],[16,136,25],[9,140,32],[9,180,32],[16,190,40],[16,82,40],[16,65.6,43],[28,65.6,43]],route_length_mm:389.2,suggested_length_mm:500},{id:`A6`,group:`ADC`,from:`AGND`,to:`GND_JOIN`,color:`#e3b51f`,title:`G → shared ground join`,local:5,path:[[375,20,150],[450,20,150]],route:[[66.5,140.60999999999999,16],[66.5,140.60999999999999,19],[68,140.60999999999999,19],[68,186,19],[68,186,12]],route_length_mm:56.9,suggested_length_mm:100}]},ud={size:[150,156],headerZ:64,pitch:20,references:[`max4.jpg`,`max1.jpg`,`max2.jpg`,`max3.jpg`],pins:[{key:`MLRC`,name:`LRC`,x:-60,cable:`S4`,pi:35,pico:15,signal:`GPIO19 / GP11`,purpose:`I2S left/right clock`,color:`#229a69`},{key:`MBCLK`,name:`BCLK`,x:-40,cable:`S3`,pi:12,pico:14,signal:`GPIO18 / GP10`,purpose:`I2S bit clock`,color:`#247cc4`},{key:`MDIN`,name:`DIN`,x:-20,cable:`S5`,pi:40,pico:16,signal:`GPIO21 / GP12`,purpose:`Digital sound samples`,color:`#8850c7`},{key:`MGAIN`,name:`GAIN`,x:0,cable:null,purpose:`Leave unwired: board default gain`,color:`#8b9093`},{key:`MSD`,name:`SD`,x:20,cable:null,purpose:`Leave unwired: board default mode`,color:`#8b9093`},{key:`MGND`,name:`GND`,x:40,cable:`S2`,pi:9,pico:13,signal:`Ground`,purpose:`Shared ground`,color:`#293440`},{key:`MVIN`,name:`VIN`,x:60,cable:`S1`,pi:2,pico:40,signal:`5 V / USB VBUS`,purpose:`Amplifier power`,color:`#d43235`}]};function dd(e){for(let t of e.wires.filter(e=>e.group===`Audio`)){let n=e.points[t.from],r=e.points[t.to],i=ud.pins.findIndex(e=>e.key===t.to);if(i>=0){let e=68+i*6,a=r[2]+70+i*17;t.path=[n,[n[0],e,n[2]],[n[0],e,a],[r[0],e,a],[r[0],e,r[2]],r]}else{let e=t.from===`M+`?21:30,i=t.from===`M+`?455:442;t.path=[n,[n[0],n[1],n[2]-15],[n[0],e,n[2]-15],[i,e,n[2]-15],[i,e,r[2]],[r[0],e,r[2]],r]}}return e}var fd={controllerGround:`#e3b51f`,resistorGround:`#e3b51f`,address:`#e3b51f`},pd={size:[78,210],headerX:25,pitch:20,connectorY:-45,references:[`but2.jpg`,`but1.jpg`],pins:[{key:`AVDD`,name:`V`,signal:`VDD`,z:-90,pi:17,pico:36,color:`#dc8119`,purpose:`3.3 V supply`,cables:[`A1`]},{key:`AGND`,name:`G`,signal:`GND`,z:-70,pi:20,pico:8,color:fd.controllerGround,purpose:`Common ground for controller, ADDR and R2`,cables:[`A2`,`A5`,`K5`,`A6`]},{key:`ASCL`,name:`SCL`,z:-50,pi:5,pico:7,color:`#229a69`,purpose:`I2C clock`,cables:[`A4`]},{key:`ASDA`,name:`SDA`,z:-30,pi:3,pico:6,color:`#247cc4`,purpose:`I2C data`,cables:[`A3`]},{key:`AADDR`,name:`ADDR`,z:-10,color:fd.address,purpose:`Connect to G to select I2C address 0x48`,cables:[`A5`]},{key:`AALERT`,name:`ALERT`,z:10,color:`#8b9093`,purpose:`No external connection in this setup`,cables:[]},{key:`AA0`,name:`A0`,z:30,color:`#8850c7`,purpose:`Input from the shared R1 / R2 join`,cables:[`K4`]},{key:`AA1`,name:`A1`,z:50,color:`#8b9093`,purpose:`Unused analog input`,cables:[]},{key:`AA2`,name:`A2`,z:70,color:`#8b9093`,purpose:`Unused analog input`,cables:[]},{key:`AA3`,name:`A3`,z:90,color:`#8b9093`,purpose:`Unused analog input`,cables:[]}]};function md(e){let[t,n,r]=e;return Object.fromEntries(pd.pins.map(e=>[e.key,[t+pd.headerX,n+pd.connectorY,r+e.z]]))}function hd(e){return e.from.startsWith(`A`)||e.to.startsWith(`A`)||e.to===`GND_JOIN`}function gd(e){return[e[0]+100,e[1]+pd.connectorY,e[2]-70]}function _d(e){let t=e.components.find(e=>e.id===`adc`);Object.assign(e.points,md(t.position)),e.points.GND_JOIN=gd(t.position);for(let n of e.wires.filter(hd)){let r=e.points[n.from],i=e.points[n.to];if(n.id===`A6`)n.path=[r,i];else if(n.id===`A5`)n.path=[r,[r[0]+22,r[1],r[2]],[r[0]+22,35,r[2]],[i[0],35,r[2]],[i[0],35,i[2]],i];else{let e=n.id===`K4`?4:n.id===`K5`?5:n.local??0,a=85+e*11,o=t.position[0]+135+e*16,s=t.position[2]+140+e*20;if(n.id===`A2`)n.path=[r,[r[0],a,r[2]],[r[0],a,s],[o,a,s],[o,a,i[2]-18],[i[0],a,i[2]-18],[i[0],i[1],i[2]-18],i];else if(n.id===`K5`)n.path=[r,[r[0],a,r[2]],[r[0],a,s],[o,a,s],[o,a,i[2]],[o,i[1],i[2]],i];else{let e=i[0]+22;n.path=[r,[r[0],a,r[2]],[r[0],a,s],[o,a,s],[o,a,i[2]],[e,a,i[2]],[e,i[1],i[2]],i]}}}return e}var vd={size:[110,250],headerX:50,pinY:12,connectorX:105,reference:`signal-2026-10-11-22-16-05-518_003.jpg`,buttons:[[0,-88],[-29,-29],[29,-29],[0,29],[0,94]],pins:[{key:`KOUT`,name:`OUT`,z:58,cable:`K3`,color:`#b79510`},{key:`KVCC`,name:`VCC`,z:72,cable:`K1`,color:`#d43235`,pi:4,pico:40},{key:`KGND`,name:`GND`,z:86,cable:`K2`,color:`#293440`,pi:14,pico:18}]};function yd(e){let[t,n,r]=e;return Object.fromEntries(vd.pins.map(e=>[e.key,[t+vd.connectorX,n+vd.pinY,r+e.z]]))}function bd(e){let t=e.components.find(e=>e.id===`keypad`);Object.assign(e.points,yd(t.position));for(let n of e.wires.filter(e=>[`K1`,`K2`,`K3`].includes(e.id))){let r=e.points[n.from],i=e.points[n.to];if(n.id===`K3`)n.path=[r,[r[0]+22,r[1],r[2]],[r[0]+22,i[1]+20,r[2]],[i[0],i[1]+20,r[2]],[i[0],i[1]+20,i[2]],i];else{let e=n.id===`K1`?70:90,a=i[0]+32+(n.id===`K1`?0:18),o=t.position[2]+155+(n.id===`K1`?0:22);n.path=[r,[r[0],e,r[2]],[r[0],e,o],[a,e,o],[a,e,i[2]],[a,i[1],i[2]],i]}}return e}var xd=`GP0.GP1.GND.GP2.GP3.GP4.GP5.GND.GP6.GP7.GP8.GP9.GND.GP10.GP11.GP12.GP13.GND.GP14.GP15.GP16.GP17.GND.GP18.GP19.GP20.GP21.GND.GP22.RUN.GP26.GP27.AGND.GP28.ADC_VREF.3V3 OUT.3V3_EN.GND.VSYS.VBUS`.split(`.`),Sd={LVCC:36,LGND:3,LDIN:25,LCLK:24,LCS:22,LDC:21,LRST:26,LBL:27,MVIN:40,MGND:13,MBCLK:14,MLRC:15,MDIN:16,AVDD:36,AGND:8,GND_JOIN:8,ASDA:6,ASCL:7,KVCC:40,KGND:18};function Cd(){let e=structuredClone(sd);e.controller=`pico`,e.pinNames={};let t=e.components.find(e=>e.id===`pi`);Object.assign(t,{title:`Pico 2 WH · changed controller`,size:[88,210],color:`#168467`});for(let t=1;t<=40;t++)e.points[`P`+t]=[t<=20?-35:35,24,-54+(t<=20?t-1:40-t)*10.4],e.pinNames[`P`+t]=`pin ${t} · ${xd[t-1]}`;e.points.USB=[0,16,-73],e.points.V3=[133,18,24],e.points.V5=[133,18,78];for(let t of e.wires)if(t.previousTitle=sd.wires.find(e=>e.id===t.id).title,/^P\d+$/.test(t.from)){let n=Sd[t.to];t.previousPin=t.from,t.controllerPin=`P`+n,t.from=[`LVCC`,`AVDD`].includes(t.to)?`V3`:[`MVIN`,`KVCC`].includes(t.to)?`V5`:t.controllerPin,t.changed=!0,t.title=`${t.to===`GND_JOIN`?`G (GND)`:t.to===`LDIN`?`SPI0 MOSI`:t.to===`LCLK`?`SPI0 SCK`:t.to===`ASDA`?`I2C0 SDA`:t.to===`ASCL`?`I2C0 SCL`:t.to===`MBCLK`?`PIO BCLK`:t.to===`MLRC`?`PIO LRC`:t.to===`MDIN`?`PIO DIN`:t.to.slice(1)} → Pico ${e.pinNames[t.controllerPin]}`+(t.from===`V3`?` via 3.3 V join`:t.from===`V5`?` via USB 5 V join`:``);let r=e.points[t.from],i=e.points[t.to],a=60+(t.local??0)*6,o=t.group===`LCD`?-210-(t.local??0)*18:t.group===`Audio`?-165-(t.local??0)*16:185+(t.local??0)*24,s=r[0]<0?-205:205;t.path=[r,[r[0],a,r[2]],[s,a,r[2]],[s,a,o],[i[0],a,o],[i[0],a,i[2]],i]}else t.id===`USB`&&(t.changed=!0,t.title=`5 V micro-USB → Pico power / programming port`,t.path=[e.points.POWER,[5,50,310],[-108,50,310],[-108,50,-104],[0,50,-104],e.points.USB]);for(let[t,n,r,i,a]of[[`PWR3`,`P36`,`V3`,`#dc8119`,`NEW · pin 36 (3V3 OUT) → shared 3.3 V join`],[`PWR5`,`P40`,`V5`,`#d43235`,`NEW · pin 40 (VBUS) → shared USB 5 V join`]]){let o=e.points[n],s=e.points[r];e.wires.push({id:t,from:n,to:r,color:i,title:a,group:`Power`,changed:!0,added:!0,controllerPin:n,path:[o,[o[0],48,o[2]],[s[0],48,o[2]],[s[0],48,s[2]],s]})}return bd(_d(dd(e)))}var wd=[[`controller`,`hardware-controller`,`raspberry`,[`raspberry`,`pico`,`pcb`]],[`enclosure`,`obudowa-view`,`filament`,[`filament`,`plywood`]],[`pcb-mode`,`pcb-mode`,`assembled`,[`assembled`,`board`,`exploded`]],[`project`,`plywood-project`,`house`,[`house`,`case`]],[`assembly`,`assembly-mode`,`assembled`,[`assembled`,`roof_open`,`inside`,`exploded`,`enclosure`,`internals`]],[`cloud-mode`,`cloud-mode`,`assembled`,[`assembled`,`exploded`,`inside`,`battery_open`]],[`circuit`,`circuit-filter`,`all`,[`all`,`LCD`,`Audio`,`ADC`,`Keypad`,`Power`]]];function Td(e){let t=/(?:^|\/)pcb(?:\/|\/index\.html)?$/.test(e.pathname),n=Object.fromEntries(wd.map(([n,r,i,a])=>{let o=e.searchParams.get(n);return[r,a.includes(o)?o:n===`controller`&&t?`pcb`:i]})),r=e.hash.slice(1);r===`3dprint`?(r=`obudowa`,n[`obudowa-view`]=`filament`):r===`plywood`?(r=`obudowa`,n[`obudowa-view`]=`plywood`):r===`hardware`?r=`elektronika`:r===`software`&&(r=`oprogramowanie`);let i=[`glowna`,`obudowa`,`elektronika`,`oprogramowanie`,`inne`],a=[`raspberry`,`pico`,`pcb`].includes(e.searchParams.get(`controller`)),o=t||a?`elektronika`:`glowna`;return{tab:i.includes(r)?r:o,values:n}}function Ed(e,t,n){let r=new URL(e);for(let[e,t,i,a]of wd){let o=n[t];a.includes(o)&&(o===i&&!(e===`controller`&&/(?:^|\/)pcb\//.test(r.pathname))?r.searchParams.delete(e):r.searchParams.set(e,o))}return r.hash=t,r}var Dd={name:`alfa-pi3-shield`,revision:`A`,status:`engineering prototype; not released for production`,controller:`Raspberry Pi 3 Model B`,dimensions_mm:[65,56,1.6],mount_hole_pitch_mm:[58,49],mount_drill_mm:2.75,components:[{ref:`J1`,value:`Pi 3 underside socket`,footprint:`Alfa:Pi_40_Underside`,xy:[0,0],pins:{1:`+3V3`,2:`+5V`,3:`I2C_SDA`,4:`+5V`,5:`I2C_SCL`,6:`GND`,7:null,8:null,9:`GND`,10:null,11:null,12:`I2S_BCLK`,13:`LCD_RST`,14:`GND`,15:null,16:`AMP_ENABLE`,17:`+3V3`,18:`LCD_BL`,19:`LCD_MOSI`,20:`GND`,21:null,22:`LCD_DC`,23:`LCD_SCK`,24:`LCD_CS`,25:`GND`,26:null,27:null,28:null,29:null,30:`GND`,31:null,32:null,33:null,34:`GND`,35:`I2S_LRCLK`,36:null,37:null,38:null,39:`GND`,40:`I2S_DIN`},names:{1:`3V3`,2:`5V`,3:`GPIO2/SDA`,4:`5V`,5:`GPIO3/SCL`,6:`GND`,7:`GPIO4`,8:`GPIO14`,9:`GND`,10:`GPIO15`,11:`GPIO17`,12:`GPIO18/BCLK`,13:`GPIO27/RST`,14:`GND`,15:`GPIO22`,16:`GPIO23/ENABLE`,17:`3V3`,18:`GPIO24/BL`,19:`GPIO10/MOSI`,20:`GND`,21:`GPIO9`,22:`GPIO25/DC`,23:`GPIO11/SCK`,24:`GPIO8/CE0`,25:`GND`,26:`GPIO7`,27:`ID_SD/RESERVED`,28:`ID_SC/RESERVED`,29:`GPIO5`,30:`GND`,31:`GPIO6`,32:`GPIO12`,33:`GPIO13`,34:`GND`,35:`GPIO19/LRCLK`,36:`GPIO16`,37:`GPIO26`,38:`GPIO20`,39:`GND`,40:`GPIO21/DIN`},mpn:`SSQ-120-01-G-D`,maker:`Samtec`,angle:0,side:`bottom`,note:`2x20 female, 2.54 mm; select socket/standoff heights as a matched pair.`,schematic:[45,75]},{ref:`U1`,value:`ADS1115IDGSR`,footprint:`Package_SO:VSSOP-10_3x3mm_P0.5mm`,xy:[27,29],pins:{1:`GND`,2:null,3:`GND`,4:`KEY_SENSE`,5:`GND`,6:`GND`,7:`GND`,8:`+3V3`,9:`I2C_SDA`,10:`I2C_SCL`},names:{1:`ADDR`,2:`ALERT/RDY`,3:`GND`,4:`AIN0`,5:`AIN1`,6:`AIN2`,7:`AIN3`,8:`VDD`,9:`SDA`,10:`SCL`},mpn:`ADS1115IDGSR`,maker:`Texas Instruments`,angle:0,side:`top`,note:`16-bit ADC; address 0x48; A0 keypad input. Replaces ADS breakout.`,schematic:[115,48]},{ref:`U2`,value:`MAX98357AETE+T`,footprint:`Package_DFN_QFN:TQFN-16-1EP_3x3mm_P0.5mm_EP1.23x1.23mm`,xy:[47,29],pins:{1:`I2S_DIN`,2:null,3:`GND`,4:`AMP_SD`,5:null,6:null,7:`+5V`,8:`+5V`,9:`SPK_P`,10:`SPK_N`,11:`GND`,12:null,13:null,14:`I2S_LRCLK`,15:`GND`,16:`I2S_BCLK`,17:`GND`},names:{1:`DIN`,2:`GAIN_SLOT`,3:`GND`,4:`SD_MODE`,5:`NC`,6:`NC`,7:`VDD`,8:`VDD`,9:`OUTP`,10:`OUTN`,11:`GND`,12:`NC`,13:`NC`,14:`LRCLK`,15:`GND`,16:`BCLK`,17:`EP`},mpn:`MAX98357AETE+T`,maker:`Analog Devices`,angle:0,side:`top`,note:`I2S A variant, 16-pin TQFN, gain pin open = 9 dB; left channel.`,schematic:[195,58]},{ref:`J2`,value:`JST PH 8`,footprint:`Connector_JST:JST_PH_B8B-PH-K_1x08_P2.00mm_Vertical`,xy:[10,46],pins:{1:`+3V3`,2:`GND`,3:`LCD_MOSI`,4:`LCD_SCK`,5:`LCD_CS`,6:`LCD_DC`,7:`LCD_RST`,8:`LCD_BL`},names:{1:`VCC`,2:`GND`,3:`DIN`,4:`CLK`,5:`CS`,6:`DC`,7:`RST`,8:`BL`},mpn:`B8B-PH-K-S(LF)(SN)`,maker:`JST`,angle:0,side:`top`,note:`Through-hole; supplier can hand-assemble. Harness pin order is defined by this PCB.`,schematic:[115,105]},{ref:`J3`,value:`JST PH 2`,footprint:`Connector_JST:JST_PH_B2B-PH-K_1x02_P2.00mm_Vertical`,xy:[51,46],pins:{1:`SPK_P`,2:`SPK_N`},names:{1:`SPK+`,2:`SPK-`},mpn:`B2B-PH-K-S(LF)(SN)`,maker:`JST`,angle:0,side:`top`,note:`Through-hole; supplier can hand-assemble. Harness pin order is defined by this PCB.`,schematic:[255,48]},{ref:`J4`,value:`JST PH 3`,footprint:`Connector_JST:JST_PH_B3B-PH-K_1x03_P2.00mm_Vertical`,xy:[34,46],pins:{1:`KEY_OUT`,2:`+5V`,3:`GND`},names:{1:`OUT`,2:`5V`,3:`GND`},mpn:`B3B-PH-K-S(LF)(SN)`,maker:`JST`,angle:0,side:`top`,note:`Through-hole; supplier can hand-assemble. Harness pin order is defined by this PCB.`,schematic:[255,103]},{ref:`R1`,value:`10k 1%`,footprint:`Resistor_SMD:R_0805_2012Metric`,xy:[28,37],pins:{1:`KEY_OUT`,2:`KEY_SENSE`},names:{1:`1`,2:`2`},mpn:`RC0805FR-0710KL`,maker:`Yageo`,angle:0,side:`top`,note:``,schematic:[115,147]},{ref:`R2`,value:`10k 1%`,footprint:`Resistor_SMD:R_0805_2012Metric`,xy:[33,37],pins:{1:`KEY_SENSE`,2:`GND`},names:{1:`1`,2:`2`},mpn:`RC0805FR-0710KL`,maker:`Yageo`,angle:0,side:`top`,note:``,schematic:[145,147]},{ref:`R3`,value:`1k 1%`,footprint:`Resistor_SMD:R_0805_2012Metric`,xy:[40,24],pins:{1:`AMP_ENABLE`,2:`AMP_SD`},names:{1:`1`,2:`2`},mpn:`RC0805FR-071KL`,maker:`Yageo`,angle:0,side:`top`,note:``,schematic:[195,120]},{ref:`R4`,value:`100k 1%`,footprint:`Resistor_SMD:R_0805_2012Metric`,xy:[40,29],pins:{1:`AMP_SD`,2:`GND`},names:{1:`1`,2:`2`},mpn:`RC0805FR-07100KL`,maker:`Yageo`,angle:0,side:`top`,note:``,schematic:[225,120]},{ref:`C1`,value:`100nF 50V X7R`,footprint:`Capacitor_SMD:C_0805_2012Metric`,xy:[32.5,29],pins:{1:`+3V3`,2:`GND`},names:{1:`1`,2:`2`},mpn:`GRM21BR71H104KA01L`,maker:`Murata`,angle:0,side:`top`,note:``,schematic:[115,171]},{ref:`C2`,value:`100nF 50V X7R`,footprint:`Capacitor_SMD:C_0805_2012Metric`,xy:[46,34],pins:{1:`+5V`,2:`GND`},names:{1:`1`,2:`2`},mpn:`GRM21BR71H104KA01L`,maker:`Murata`,angle:0,side:`top`,note:``,schematic:[175,171]},{ref:`C3`,value:`10uF 10V X7R`,footprint:`Capacitor_SMD:C_1206_3216Metric`,xy:[50.5,34],pins:{1:`+5V`,2:`GND`},names:{1:`1`,2:`2`},mpn:`GRM31CR71A106KA01L`,maker:`Murata`,angle:0,side:`top`,note:``,schematic:[205,171]},{ref:`C4`,value:`47uF 10V X5R`,footprint:`Capacitor_SMD:C_1210_3225Metric`,xy:[56,34],pins:{1:`+5V`,2:`GND`},names:{1:`1`,2:`2`},mpn:`GRM32ER61A476KE20L`,maker:`Murata`,angle:0,side:`top`,note:``,schematic:[235,171]},{ref:`TP1`,value:`+5V`,footprint:`TestPoint:TestPoint_Pad_D1.5mm`,xy:[57,15],pins:{1:`+5V`},names:{1:`1`},mpn:``,maker:``,angle:0,side:`top`,note:`Bare copper test pad; no component to purchase.`,schematic:[35,147]},{ref:`TP2`,value:`+3V3`,footprint:`TestPoint:TestPoint_Pad_D1.5mm`,xy:[12,15],pins:{1:`+3V3`},names:{1:`1`},mpn:``,maker:``,angle:0,side:`top`,note:`Bare copper test pad; no component to purchase.`,schematic:[55,147]},{ref:`TP3`,value:`GND`,footprint:`TestPoint:TestPoint_Pad_D1.5mm`,xy:[17,15],pins:{1:`GND`},names:{1:`1`},mpn:``,maker:``,angle:0,side:`top`,note:`Bare copper test pad; no component to purchase.`,schematic:[35,171]},{ref:`TP4`,value:`KEY_SENSE`,footprint:`TestPoint:TestPoint_Pad_D1.5mm`,xy:[23,37],pins:{1:`KEY_SENSE`},names:{1:`1`},mpn:``,maker:``,angle:0,side:`top`,note:`Bare copper test pad; no component to purchase.`,schematic:[55,171]}],pi_nets:{1:`+3V3`,2:`+5V`,3:`I2C_SDA`,4:`+5V`,5:`I2C_SCL`,6:`GND`,9:`GND`,12:`I2S_BCLK`,13:`LCD_RST`,14:`GND`,16:`AMP_ENABLE`,17:`+3V3`,18:`LCD_BL`,19:`LCD_MOSI`,20:`GND`,22:`LCD_DC`,23:`LCD_SCK`,24:`LCD_CS`,25:`GND`,30:`GND`,34:`GND`,35:`I2S_LRCLK`,39:`GND`,40:`I2S_DIN`}},Od=new URL(`alfa-pi3-shield-prototype-DCrlp40u.zip`,import.meta.url).href,kd=new URL(`schematic-C7eL0Mz1.pdf`,import.meta.url).href,Ad=new URL(`shield-BdjIoHgB.step`,import.meta.url).href,jd=new URL(`fabrication-draft-DW0erOfe.zip`,import.meta.url).href,Md=`modulepreload`,Nd=function(e,t){return new URL(e,t).href},Pd={},Fd=function(e){return e.pathname.endsWith(`.css`)},Id=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Nd(t,n);let r=s(t);if(r.href in Pd)return;Pd[r.href]=!0;let i=Fd(r);if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let o=document.createElement(`link`);if(o.rel=i?`stylesheet`:Md,i||(o.as=`script`),o.crossOrigin=``,o.href=r.href,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),i)return new Promise((e,t)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>t(Error(`Unable to preload CSS for ${r}`)))})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},$=e=>document.querySelector(e),Ld=[...document.querySelectorAll(`[data-tab]`)],Rd=$(`#app-status`),zd=$(`#viewer-status`),Bd=()=>c()===`en`?e:t,Vd=()=>c()===`en`?n:r;function Hd(){return{house:{title:l(`plywood.model.house.title`),description:l(`plywood.model.house.description`),modes:[[`assembled`,l(`plywood.mode.assembled`)],[`roof_open`,l(`plywood.mode.roof`)],[`inside`,l(`plywood.mode.inside`)],[`exploded`,l(`plywood.mode.exploded`)]],size:cd.outer_mm,folder:`house-radio`},case:{title:l(`plywood.model.case.title`),description:l(`plywood.model.case.description`),modes:[[`enclosure`,l(`plywood.mode.assembled`)],[`internals`,l(`plywood.mode.internals`)],[`exploded`,l(`plywood.mode.exploded`)]],size:[ld.parameters.case.width,ld.parameters.case.height,ld.parameters.case.depth],folder:`wooden-case`}}}var Ud=Cd(),Wd,Gd,Kd=`glowna`,qd,Jd,Yd,Xd,Zd,Qd=0,$d=``,ef;function tf(e,t){if(e)for(let n of e.querySelectorAll(`.pill-btn`)){let e=n.dataset.value===t;n.classList.toggle(`active`,e),n.setAttribute(`aria-pressed`,String(e))}}function nf(e,t,n){if(e&&t)for(let r of e.querySelectorAll(`.pill-btn`))r.addEventListener(`click`,()=>{let i=r.dataset.value;t.value!==i&&(t.value=i,tf(e,i),t.dispatchEvent(new Event(`change`,{bubbles:!0})),n&&n(i))})}function rf(){for(let e of document.querySelectorAll(`a[hreflang][lang]`)){let t=e.getAttribute(`lang`)===`en`?`en/`:``,n=new URL(t,document.baseURI);n.search=location.search,n.hash=location.hash,e.href=n.href,/(?:^|\/)pcb\//.test(location.pathname)&&(n.searchParams.set(`controller`,$(`#hardware-controller`).value),n.hash=location.hash||`elektronika`,e.href=n.href)}}function af(){let e=Object.fromEntries(wd.map(([,e])=>[e,document.getElementById(e)?.value||``]));history.replaceState(null,``,Ed(new URL(location.href),Kd,e)),rf()}function of(e,t=!0){let n=$(`#obudowa-view`);n&&(n.value=e);for(let t of document.querySelectorAll(`[data-subview]`)){let n=t.dataset.subview===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}let r=$(`#subview-filament`),i=$(`#subview-sklejka`);r&&(r.hidden=e!==`filament`),i&&(i.hidden=e!==`sklejka`),Gd?.setActive(Kd===`obudowa`&&e===`filament`),Kd===`obudowa`&&uf(hf()),t&&af()}function sf(e,t=!0){let n=$(`#hardware-controller`);n&&(n.value=e);for(let t of document.querySelectorAll(`[data-controller]`)){let n=t.dataset.controller===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}$d=``,$(`#circuit-filter`).value=`all`,tf(document.querySelector(`[data-for="circuit-filter"]`),`all`),vf(),$(`#wire-detail`).textContent=l(`hw.choose`),Kd===`elektronika`&&uf(hf()),t&&af()}function cf(){let e=Td(new URL(location.href));Kd=e.tab;for(let[,t]of wd){if(t===`assembly-mode`)continue;let n=document.getElementById(t);if(!n)continue;n.value=e.values[t];let r=document.querySelector(`[data-for="${t}"]`);r&&tf(r,e.values[t])}of(e.values[`obudowa-view`]||`filament`,!1),sf(e.values[`hardware-controller`]||`raspberry`,!1),mf();let t=$(`#assembly-mode`);return t&&(t.value=e.values[`assembly-mode`],tf($(`#assembly-mode-group`),e.values[`assembly-mode`])),vf(),$d=``,rf(),e}function lf(e){Rd.textContent=l(`error.view`,{message:e.message}),zd.textContent=Rd.textContent,zd.dataset.error=`true`,console.error(e)}function uf(e){Promise.resolve(e).catch(lf)}function df(){return $(`#hardware-controller`).value===`pico`?Ud:sd}function ff(e,t){if(/^P\d+$/.test(e))return t.pinNames?.[e]?l(`endpoint.picoNamed`,{name:t.pinNames[e]}):l(`endpoint.piPin`,{pin:e.slice(1)});let n={GND_JOIN:`endpoint.gndJoin`,V3:`endpoint.v3`,V5:`endpoint.v5`,RIN:`endpoint.rin`,J:`endpoint.join`,RGND:`endpoint.rgnd`,POWER:`endpoint.power`,USB:`endpoint.usb`,"M+":`endpoint.speakerPlus`,"M-":`endpoint.speakerMinus`};if(n[e])return l(n[e]);let r={L:`endpoint.module.L`,A:`endpoint.module.A`,M:`endpoint.module.M`,K:`endpoint.module.K`,S:`endpoint.module.S`};return r[e[0]]?`${l(r[e[0]])} ${e.slice(1)}`:e}async function pf(){return qd||=Id(async()=>{let{createViewer:e}=await import(`./viewer-Dodxuo-b.js`);return{createViewer:e}},__vite__mapDeps([0,1]),import.meta.url).then(({createViewer:e})=>(Jd=e($(`#viewport`),e=>{if(e.wire)Kd===`elektronika`?_f(e.wire.id):zd.textContent=`${e.wire.id} · ${u(e.wire.title)}`;else if(e.frame)zd.textContent=`${e.frame.id} · ${e.frame.title}`;else if(e.module){let t=Jd.current?.data.components?.find(t=>t.id===e.module);zd.textContent=t?.title?u(t.title):l(`selection.component`,{id:e.module})}}),Jd)),qd}function mf(){let e=Hd()[$(`#plywood-project`).value];$(`#plywood-title`).textContent=e.title,$(`#plywood-description`).textContent=e.description,$(`#plywood-source`).href=`${ef}/tree/main/design/${e.folder}`;let t=$(`#assembly-mode-group`);if(t){let n=$(`#assembly-mode`).value,r=e.modes.some(([e])=>e===n)?n:e.modes[0][0];$(`#assembly-mode`).value=r,t.replaceChildren(...e.modes.map(([e,n])=>{let i=document.createElement(`button`);return i.type=`button`,i.className=`pill-btn ${e===r?`active`:``}`,i.dataset.value=e,i.setAttribute(`aria-pressed`,String(e===r)),i.textContent=n,i.addEventListener(`click`,()=>{$(`#assembly-mode`).value=e,tf(t,e),uf(Jd?.setMode(e)),$(`#assembly-mode`).dispatchEvent(new Event(`change`,{bubbles:!0}))}),i}))}$(`#plywood-facts`).replaceChildren();for(let[t,n]of[[l(`facts.width`),`${e.size[0]} mm`],[l(`facts.height`),`${e.size[1]} mm`],[l(`facts.depth`),`${e.size[2]} mm`],[l(`facts.material`),l(`facts.plywood`)]]){let e=document.createElement(`div`),r=document.createElement(`dt`),i=document.createElement(`dd`);r.textContent=t,i.textContent=n,e.append(r,i),$(`#plywood-facts`).append(e)}}async function hf(){let e=++Qd,t=Kd===`obudowa`,n=Kd===`elektronika`;if(!t&&!n)return;let r=t&&$(`#obudowa-view`).value===`filament`,i=t&&$(`#obudowa-view`).value===`sklejka`;$(r?`#print-slot`:i?`#plywood-slot`:`#hardware-slot`).append($(`#viewer-card`)),$(`#viewport`).dataset.loaded=`false`,zd.textContent=l(n?`viewer.loadingWiring`:`viewer.loadingCad`),delete zd.dataset.error,$(`#scene-label`).textContent=l(r?`viewer.sceneCloud`:n?`viewer.sceneHardware`:`viewer.scenePlywood`);let a=await pf();if(e!==Qd)return;a.setActive(!0);let o=r?`cloud`:n?$(`#hardware-controller`).value:$(`#plywood-project`).value,s=await a.setScene(o);if(s&&e===Qd){if(r)await a.setMode($(`#cloud-mode`).value),a.setLabels($(`#cloud-labels`).checked),a.setClearances($(`#cloud-clearances`).checked),gf(s.data),a.setPartColors(Wd.getColors());else if(i){let e=$(`#assembly-mode`).value;s.getMode()!==e&&await a.setMode(e),a.setWood($(`#show-wood`).checked),a.setLabels($(`#show-labels`).checked)}else $(`#hardware-controller`).value===`pcb`?(await a.setMode($(`#pcb-mode`).value),a.setLabels($(`#pcb-labels`).checked)):(a.filter($(`#circuit-filter`).value),$d&&a.selectWire($d));e===Qd&&(zd.textContent=n&&$(`#hardware-controller`).value===`pcb`?l(`pcb.ready`):l(n?`viewer.readyHardware`:r?`viewer.readyCloud`:`viewer.readyPlywood`),Rd.textContent=l(`status.ready`),document.documentElement.dataset.ready=`true`)}}function gf(e){$(`#cloud-revision`).textContent=l(`cloud.revision`,{revision:e.revision.replace(`prototype-`,`PROTOTYPE `)}),$(`#cloud-facts`).replaceChildren();for(let[t,n]of[[l(`facts.width`),`${e.outer_mm[0]} mm`],[l(`facts.height`),`${e.outer_mm[1]} mm`],[l(`facts.depth`),`${e.outer_mm[2]} mm`],[l(`facts.material`),e.material],...e.handle?.grip_depth?[[l(`facts.grip`),`${e.handle.grip_depth} mm`],[l(`facts.battery`),l(`facts.batteryHorizontal`)]]:[]]){let e=document.createElement(`div`),r=document.createElement(`dt`),i=document.createElement(`dd`);r.textContent=t,i.textContent=n,e.append(r,i),$(`#cloud-facts`).append(e)}$(`#cloud-verification`).textContent=l(`cloud.checks`,{count:e.checks_count}),$(`#cloud-hardware`).replaceChildren();for(let t of e.components){let e=document.createElement(`tr`);for(let n of[`${t.id} · ${u(t.title)}`,t.size.join(` × `),`${t.uncertain?l(`cloud.provisionalPrefix`):``}${u(t.source)}`]){let t=document.createElement(`td`);t.textContent=n,e.append(t)}$(`#cloud-hardware`).append(e)}$(`#cloud-frame`).replaceChildren();for(let t of[...(e.frame_parts||[]).map(e=>({...e,part:e.name})),...e.frame_features||[]]){let e=document.createElement(`tr`);for(let n of[t.id,u(t.title),l(`part.${t.part}`)]){let t=document.createElement(`td`);t.textContent=n,e.append(t)}$(`#cloud-frame`).append(e)}}function _f(e){let t=df(),n=t.wires.find(t=>t.id===e);$d=n?.id||``,n?($(`#wire-detail`).textContent=`${n.id} · ${u(n.title)}\n${ff(n.from,t)} → ${ff(n.to,t)}`,$(`#circuit-filter`).value!==`all`&&$(`#circuit-filter`).value!==n.group&&($(`#circuit-filter`).value=n.group,tf(document.querySelector(`[data-for="circuit-filter"]`),n.group),Jd?.filter(n.group),vf())):$(`#wire-detail`).textContent=l(`hw.choose`),Jd?.selectWire($d);for(let e of document.querySelectorAll(`[data-wire]`))e.setAttribute(`aria-pressed`,String(e.dataset.wire===$d)),e.closest(`tr`).dataset.selected=String(e.dataset.wire===$d)}function vf(){let e=$(`#hardware-controller`).value===`pcb`;$(`#pcb-controls`).hidden=!e,$(`#pcb-details`).hidden=!e;for(let t of document.querySelectorAll(`#panel-elektronika .wiring-heading, #wiring-table, #panel-elektronika .selected-wire, #panel-elektronika [data-for="circuit-filter"], #panel-elektronika .field-label[data-i18n="hw.circuitLabel"], #hardware-wiring-note, #hardware-diagram-card`))t.hidden=e;if(e){$(`#controller-title`).textContent=l(`pcb.title`),$(`#controller-description`).textContent=l(`pcb.description`),$(`#pico-notice`).hidden=!0,$(`#pcb-parts`).replaceChildren(...Dd.components.filter(e=>!e.ref.startsWith(`TP`)).map(e=>{let t=document.createElement(`tr`);for(let n of[e.ref,e.value,e.ref===`J1`?l(`pcb.bottom`):e.ref.startsWith(`J`)?l(`pcb.tht`):l(`pcb.smt`)]){let e=document.createElement(`td`);e.textContent=n,t.append(e)}return t}));for(let[e,t]of[[`pcb-archive`,Od],[`pcb-schematic`,kd],[`pcb-step`,Ad],[`pcb-gerbers`,jd]])$(e.startsWith(`#`)?e:`#${e}`).href=t;return}let t=df(),n=$(`#hardware-controller`).value===`pico`,r=$(`#circuit-filter`).value,i=t.wires.filter(e=>r===`all`||e.group===r);$(`#controller-title`).textContent=l(n?`controller.pico.title`:`controller.pi.title`),$(`#controller-description`).textContent=l(n?`controller.pico.description`:`controller.pi.description`),$(`#pico-notice`).hidden=!n,$(`#wiring-caption`).textContent=l(n?`wiring.caption.pico`:`wiring.caption.pi`),$(`#wire-count`).textContent=l(`hw.count`,{shown:i.length,total:t.wires.length}),$(`#wiring-body`).replaceChildren();for(let e of i){let n=document.createElement(`tr`),r=document.createElement(`td`),i=document.createElement(`button`);i.className=`wire-button`,i.dataset.wire=e.id,i.setAttribute(`aria-label`,l(`hw.trace`,{id:e.id})),i.setAttribute(`aria-pressed`,String($d===e.id));let a=document.createElement(`i`);a.className=`wire-dot`,a.style.setProperty(`--wire-color`,e.color),i.append(a,document.createTextNode(e.id)),i.addEventListener(`click`,()=>_f(e.id)),r.append(i),n.append(r);let o=document.createElement(`td`),s=document.createElement(`small`);o.textContent=u(e.title),s.textContent=l(`group.${e.group}`),o.append(s),n.append(o);for(let r of[e.from,e.to]){let e=document.createElement(`td`);e.textContent=ff(r,t),n.append(e)}$(`#wiring-body`).append(n)}}async function yf(){let e=$(`#teaching-adr-content code.language-mermaid`);if(!e)return;let t=document.createElement(`div`);t.className=`teaching-diagram`,t.setAttribute(`aria-busy`,`true`),e.parentElement.replaceWith(t);let{renderArchitecture:n}=await Id(async()=>{let{renderArchitecture:e}=await import(`./software-B6OGHqkZ.js`);return{renderArchitecture:e}},__vite__mapDeps([2,3,4,1,5,6,7,8,9,10,11,12,13,14,15,16,17]),import.meta.url);await n(t,e.textContent,{id:`teaching-architecture`,label:l(`teaching.diagramLabel`)})}async function bf(){Yd??=Id(async()=>{let{renderArchitecture:e}=await import(`./software-B6OGHqkZ.js`);return{renderArchitecture:e}},__vite__mapDeps([2,3,4,1,5,6,7,8,9,10,11,12,13,14,15,16,17]),import.meta.url).then(({renderArchitecture:e})=>e($(`#architecture-diagram`),od,{label:l(`software.diagramLabel`)})),await Yd,Zd??=Id(async()=>{let{mountDevice:e}=await import(`./device-app-Ds37vkM8.js`);return{mountDevice:e}},[],import.meta.url).then(({mountDevice:e})=>e($(`#device-demo`))),(await Zd).setActive(!0)}async function xf(e,t=!0){[`glowna`,`obudowa`,`elektronika`,`oprogramowanie`,`inne`].includes(e)||(e=`glowna`),Kd=e,$(`#viewer-card`).hidden=![`obudowa`,`elektronika`].includes(e);for(let t of Ld){let n=t.dataset.tab===e;t.setAttribute(`aria-selected`,String(n)),t.classList.toggle(`active`,n),t.tabIndex=n?0:-1;let r=$(`#panel-${t.dataset.tab}`);r&&(r.hidden=!n)}if(t&&af(),Gd?.setActive(e===`obudowa`&&$(`#obudowa-view`).value===`filament`),[`obudowa`,`elektronika`].includes(e))(await Zd)?.setActive(!1),await hf();else{Qd++,Jd?.setActive(!1),Rd.textContent=``;let t=await Zd;e===`oprogramowanie`?await bf():t?.setActive(!1),e===`inne`&&($(`#teaching-adr-content`).hidden||(Xd??=yf(),await Xd))}}async function Sf(){let e=await fetch(`./data/manifest.json`);if(!e.ok)throw Error(`Specifications returned HTTP ${e.status}`);ef=(await e.json()).repository,$(`#adr-content`).innerHTML=Bd(),$(`#teaching-adr-content`).innerHTML=Vd(),$(`#mermaid-source`).textContent=od,nf($(`[data-for="cloud-mode"]`),$(`#cloud-mode`),()=>uf(Jd?.setMode($(`#cloud-mode`).value))),nf($(`[data-for="pricing-case"]`),$(`#pricing-case`)),nf($(`[data-for="pricing-controller"]`),$(`#pricing-controller`)),nf($(`[data-for="plywood-project"]`),$(`#plywood-project`),()=>{mf(),uf(hf())}),nf($(`[data-for="circuit-filter"]`),$(`#circuit-filter`),e=>{$d=``,Jd?.filter(e),vf(),_f(``)}),nf($(`[data-for="pcb-mode"]`),$(`#pcb-mode`),e=>uf(Jd?.setMode(e))),$(`#assembly-mode`)?.addEventListener(`change`,()=>uf(Jd?.setMode($(`#assembly-mode`).value)));for(let e of document.querySelectorAll(`[data-subview]`))e.addEventListener(`click`,()=>of(e.dataset.subview));for(let e of document.querySelectorAll(`[data-controller]`))e.addEventListener(`click`,()=>sf(e.dataset.controller));for(let e of document.querySelectorAll(`.card-nav-btn`))e.addEventListener(`click`,()=>{let t=e.dataset.target;t&&uf(xf(t))});Ld.forEach((e,t)=>{e.addEventListener(`click`,()=>uf(xf(e.dataset.tab))),e.addEventListener(`keydown`,e=>{let n={ArrowRight:(t+1)%Ld.length,ArrowLeft:(t+Ld.length-1)%Ld.length,Home:0,End:Ld.length-1}[e.key];n!==void 0&&(e.preventDefault(),Ld[n].focus(),uf(xf(Ld[n].dataset.tab)))})}),$(`#show-wood`)?.addEventListener(`change`,()=>Jd?.setWood($(`#show-wood`).checked)),$(`#show-labels`)?.addEventListener(`change`,()=>Jd?.setLabels($(`#show-labels`).checked)),$(`#cloud-labels`)?.addEventListener(`change`,()=>Jd?.setLabels($(`#cloud-labels`).checked)),$(`#cloud-clearances`)?.addEventListener(`change`,()=>Jd?.setClearances($(`#cloud-clearances`).checked)),$(`#pcb-labels`)?.addEventListener(`change`,()=>Jd?.setLabels($(`#pcb-labels`).checked));let t=$(`#show-teaching-adr-btn`),n=$(`#teaching-adr-content`);t&&n&&t.addEventListener(`click`,async()=>{let e=n.hidden;n.hidden=!e,t.setAttribute(`aria-expanded`,String(e)),t.querySelector(`span`).textContent=l(e?`inne.hideAdr`:`inne.showAdr`),e&&(Xd??=yf(),await Xd)}),$(`#clear-wire`)?.addEventListener(`click`,()=>{$(`#circuit-filter`).value=`all`,tf(document.querySelector(`[data-for="circuit-filter"]`),`all`),Jd?.filter(`all`),$d=``,vf(),_f(``)}),$(`#reset-camera`)?.addEventListener(`click`,()=>Jd?.reset());for(let[,e]of wd){let t=document.getElementById(e);t&&t.addEventListener(`change`,af)}function r(){uf(xf(cf().tab,!1))}window.addEventListener(`hashchange`,r),window.addEventListener(`popstate`,r),window.addEventListener(`pagehide`,()=>{Jd?.dispose(),Gd?.dispose(),Zd?.then(e=>e.setActive(!1))},{once:!0}),Wd=_($(`#cloud-colors`),e=>{Jd?.setPartColors(e),Gd?.setPartColors(e)});let i=$(`#stl-viewer`);i&&(Gd=td(i,{initialColors:Wd.getColors()})),ad($(`#cloud-pricing`)),await xf(cf().tab,!1),document.documentElement.dataset.ready=`true`}Sf().catch(lf);export{w as $,Kr as A,k as B,ho as C,G as Ct,Ho as D,u as Dt,bo as E,l as Et,ra as F,ei as G,at as H,Yi as I,vi as J,Kt as K,ca as L,Ha as M,Ye as N,Ii as O,Xe as P,C as Q,sa as R,zo as S,W as St,Un as T,c as Tt,fo as U,O as V,Bo as W,Pa as X,oi as Y,Na as Z,Gr as _,Ai as _t,pd as a,Mo as at,q as b,un as bt,cd as c,la as ct,Au as d,no as dt,E as et,ao as f,os as ft,Ar as g,Fi as gt,ba as h,Zn as ht,vd as i,Lo as it,Jr as j,Wi as k,sd as l,is as lt,fr as m,it as mt,Dd as n,eo as nt,ud as o,Io as ot,ji as p,x as pt,J as q,Cd as r,Hn as rt,ld as s,ma as st,Id as t,T as tt,Vu as u,qt as ut,S as v,Lr as vt,us as w,io as wt,xa as x,vo as xt,Y as y,Po as yt,D as z};