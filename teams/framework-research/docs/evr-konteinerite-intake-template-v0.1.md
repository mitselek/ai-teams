# Konteineri tarne taotlus — intake-vorm

Käesolev vorm on aluseks iga uue ad-hoc dockeriseeritud paigalduse taotlemisele EVR taristus. Vormi täidab arendaja või tooteomanik enne uue konteineri juurutust ning esitab Jira ülesandena projekti **TPS** (ITOps), kus see määratakse vastuvõtva tiimi assignee külge (TBD — Stage 1 käigus identifitseeritav).

Iga väli on kohustuslik, kui ei ole märgitud teisiti. Standard, millele see vorm viitab, on **[EVR sisene konteinerite standard](https://eestiraudtee.atlassian.net/wiki/spaces/V2/pages/1715798017/EVR+sisene+konteinerite+standard)** (V2 Confluence ruum).

---

## Väljad

### 1. Taotleja (isik + tiim)

Taotlust esitava isiku nimi, EVR-i e-post ning tiim/üksus. Lisa ka tooteomanik, kui see erineb taotlejast.

*Näide:* Mihkel Putrinš (<mihkel.putrinsh@evr.ee>), VJS 2 meeskond (juht: Ruth Türk). Sub-initsiatiiv: framework-research / apex-research. Tooteomanik: Ruth Türk.

### 2. Kasutuseesmärk (1-2 lauset)

Lühike kirjeldus selle kohta, mida konteinerisse paigaldatav teenus teeb ja mis äriprobleemi see lahendab.

*Näide:* Apex-research konteiner hostib AI-uurimismeeskonna jaoks read-only-juurdepääsu Oracle APEX-i metaandmete andmebaasidele, et uurida APEX-i migratsiooni võimalusi.

### 3. Kriitilisuse tase (0/1/2)

Märgi standardi-järgne tier-tase ning põhjenda valikut ühe lausega. Tier-i määratlemise abi on standardi peatükis "Tier-süsteem":

* **Tier 0 — KRIITILINE** — tootmislähedane, sisemised äriandmed, kriitiline äriprotsess
* **Tier 1 — KESKMINE** — sisetiimi tööriist, staging, EVR-sisesed andmed
* **Tier 2 — MADAL** — eksperimentaalne, kuni 4-nädalane PoC, ei kasuta tootmislähedasi andmeid

*Näide:* Tier 1 — sisetiimi uurimistööriist, andmed on EVR-i sisesed, tootmist ei mõjuta.

### 4. Oodatav eluiga

Kui kaua konteiner peaks töötama? Vali üks: **päevad / nädalad / kuud / püsiv** ning lisa orienteeruv kuupäev või "kuni eraldi otsuseni".

*Näide:* Kuud — kuni 2026-12 või kuni APEX-i migratsiooni otsuseni, kumb varem.

### 5. Arvutusressursside ulatus (orienteeruvalt)

Hinnang vajaminevate ressursside kohta: CPU (tuumade arv), RAM (GB), kettaruum (GB), võrgukasutus (nt Mbps või "väike / keskmine / suur"). Kui täpsust ei ole, anna ülemine piir, mille vastuvõttev tiim saab valideerida.

*Näide:* 2 vCPU, 4 GB RAM, 20 GB ketast, võrgukasutus väike (peamiselt SSH ja HTTP-päringud).

### 6. Avalikud teenused (HTTP / dashboard / API)

Loetle kõik HTTP-tasandi teenused, mille konteiner avalikustab (rakenduse UI, dashboard, API endpoint vms). Iga teenuse kohta märgi:

* **Soovitav DNS-i nimi** (nt `dashboard.apex-research.dev.evr.ee`)
* **Sisemine port** (nt `5173`)
* **Avatuse ulatus**, vali üks:
  * **Sisevõrk (EVR LAN)** — ainult EVR-sisesest võrgust
  * **VPN** — VPN-iga ühendatud kasutajatele
  * **Avalik (Cloudflare Tunnel + autentimine)** — internetist, autentimismehhanism välja 6c
  * **Avalik (Cloudflare Tunnel, ilma autentimiseta)** — täielikult avalik (Tier 0/1 puhul vajab eraldi infoturbe heakskiitu)

Kui teenus on olemasolu poolest sisemine ainult, märgi see siin "puudub avalik HTTP teenus".

### 6b. Interaktiivne shell-ligipääs (SSH)

Kas konteineris on vaja interaktiivset shell-ligipääsu (operaatori SSH, Claude Code agendi pane, debug-shell vms)? Vali üks:

* **Ei vaja** — konteiner on read-only-rakendus, shell-ligipääsu pole vaja
* **Cloudflare Access SSH-proxy kaudu** (`cloudflared access ssh`) — soovitatud kanal avaliku interneti puhul, vt standard
* **Otse-SSH (Tailscale, sisemine VPN, vms üks-võrk-mehhanism)** — märgi mehhanism konkreetselt
* **Otse-SSH avaliku pordi kaudu** — keelatud Tier 0/1 puhul; Tier 2 puhul lubatud erandina, vajab põhjendust

Kui shell-ligipääsu vajatakse, märgi:

* **Soovitav SSH host-nimi** (nt `ssh-apex-research.dev.evr.ee`)
* **Lubatud kasutajate ring** (kes saavad ssh-da — operaatorid, arenduse meeskond, mille tiimi liikmed)

### 6c. Autentimismehhanism (per-channel)

Märgi iga eelnenud kanali kohta autentimismehhanism. EVR-i sisene tava on **EntraID (Microsoft Azure AD) SSO** (vrd ServiceNow, Delinea, FSM jt EVR-i sisesed teenused, mis kõik kasutavad EVR Azure-i tenanti) `[speculative]` (EntraID kohustuslikkus konteinerite-tasandi web-UI-de jaoks on Brunel-i ettepanek tõstetud EVR-i olemasolevast SSO-praktikast — Stage-1 ITOps võib alternatiivse SSO-mehhanismi heaks kiita; vt SSO-konfide allikana [UAM - SSO and EntraID User Provisioning](https://eestiraudtee.atlassian.net/wiki/spaces/FSM/pages/536248326)). Vali avalike HTTP teenuste jaoks üks:

* **EntraID SSO (Azure AD)** — sisemine kasutajaring, soovituslik vaikeväärtus iga avaliku web-UI puhul
* **Cloudflare Access (Cloudflare-tasandi SSO)** — kasulik kui EntraID-liidestus pole veel valmis, ajutine vahepeatus
* **mTLS / klientsertifikaat** — masin-masin liidese juhtum
* **Avatud (autentimiseta)** — vajab eraldi põhjendust ja infoturbe heakskiitu Tier 0/1 puhul

SSH kanali autentimine on alati **avalik võti** (PoC standard) — parooli-autentimine on keelatud.

### 7. Andmete klassifikatsioon

Mis tüüpi andmeid teenus töötleb? Vali üks:

* **Avalik** — saab levitada ilma piiranguteta
* **Sisemine** — EVR-i siseseks kasutamiseks, mitte avalikuks levitamiseks
* **Piiratud** — isikuandmed, ärisaladused, regulatsiooniga kaitstud andmed (vajab eraldi infoturbe heakskiitu Tier 0/1 puhul)

*Näide:* Sisemine — APEX-i metaandmed (mitte rakenduste sisuandmed).

### 8. Turvalise tagastuse kanal

Kuidas vastuvõttev tiim peaks taotlejale tagastama saladusi (Cloudflare Tunneli token, SSH võtmed, GitHub Secrets-i väärtused)? Vali üks:

* **EVR-sisene parooli-haldur** (nt Delinea Secret Server, kui taotlejal on ligipääs)
* **Krüpteeritud e-post** (PGP või S/MIME)
* **GitHub Secrets-i otse-seadistus** (vastuvõtja seadistab repos otse, taotleja ei näe väärtust)
* **Muu** (täpsusta)

*Näide:* GitHub Secrets-i otse-seadistus — vastuvõtja paneb `CLOUDFLARE_TUNNEL_TOKEN` ja `SSH_PUBLIC_KEY` repo Settings-i otse.

### 9. Vastuvõtu kriteeriumid

Mis peab olema tehtud, et taotlust käsitleda lõpetatuks? Loetle konkreetsed checkpoint-id, mille üle vastuvõttev tiim ja taotleja saavad kokku leppida. Hea reegel: 3-5 punkti, mõõdetavad. Vt allpool täielikku apex-team näidet.

---

## Täielik näide — `apex-team` (apex-research / framework-research) konteineri-paigaldus

Käesolev sektsioon näitab, kuidas vorm täidetakse reaalse paigalduse jaoks. Apex-team konteiner hostib AI-uurimismeeskonna agendid (Claude Code instantsid), kes vajavad nii operaatori interaktiivset shell-ligipääsu (panes/tmux) kui ka sisemiste kasutajate jaoks autenditud dashboard-i. Paigaldus on **target-state** käesoleva standardi all — praegune (ajutine) seisund on `100.96.54.170:5173` avatud HTTP, `100.96.54.170:2222` avatud SSH; need on standardi-vastased ja tuleb migreerida käesoleva vormi väärtuste järgi.

| Väli | Väärtus |
|---|---|
| **1. Taotleja** | **VJS 2 meeskond** (juht: Ruth Türk, kontakt: <mihkel.putrinsh@evr.ee>). Sub-initsiatiiv: framework-research / apex-research. Tooteomanik: Ruth Türk. |
| **2. Kasutuseesmärk** | AI-agentide uurimismeeskond, mis vajab mitme-agendi koostöö-keskkonda (tmux pane-id Claude Code instantsidega) + operaatori interaktiivset ligipääsu agentidele (ssh + tmux attach) + sisemiste kasutajate jaoks dashboard-i meeskonna staatusest ja agendi-toodanguist. |
| **3. Kriitilisuse tase** | **Tier 1 — KESKMINE.** Sisetiimi uurimistööriist, andmed on EVR-i sisesed (uurimis-märkmed, ei ole klientide andmeid), tootmist ei mõjuta, aga eluiga on pikem kui 4 nädalat ning meeskond sõltub temast. |
| **4. Oodatav eluiga** | Avatud lõpuga / uurimisperioodi-kestus. Esialgu kuni 2026-12 või kuni teadustöö järgmise verstapostini; vahekontroll iga 3 kuu järel. |
| **5. Arvutusressursside ulatus** | 4 vCPU, 16 GB RAM, 50 GB ketast (mahub agendid + tmux + git workspaces + scratchpadid). Võrgukasutus: keskmine (Claude API päringud, dashboard SSE-stream). |
| **6. Avalikud teenused** | `dashboard.apex-research.dev.evr.ee` → sisemine port `5173` → **Avalik (Cloudflare Tunnel + autentimine)**. (Ühe avaliku HTTP-teenusega; sisemised pordid agendite vaheliseks suhteks ei avalikustata.) |
| **6b. Interaktiivne shell-ligipääs** | **Cloudflare Access SSH-proxy kaudu** (`cloudflared access ssh`). Soovitav host-nimi: `ssh-apex-research.dev.evr.ee`. Lubatud kasutajate ring: framework-research / apex-research operaatorid (esialgu 2-3 isikut, võtmete loend hallatakse `SSH_PUBLIC_KEYS` GitHub Secret-i all). |
| **6c. Autentimismehhanism** | Dashboard: **EntraID SSO** (Azure AD, EVR tenant — sama mehhanism mis ServiceNow, Delinea, FSM). SSH: **avalik võti** (`id_ed25519_apex` võtmepaar). |
| **7. Andmete klassifikatsioon** | **Sisemine.** Uurimis-scratchpadid, agentide mälu, agentide-vaheline komm. Ei ole klientide isikuandmeid ega ärisaladusi. |
| **8. Turvalise tagastuse kanal** | **GitHub Secrets-i otse-seadistus** — vastuvõtja paneb `CLOUDFLARE_TUNNEL_TOKEN` (tunneli token), `SSH_PUBLIC_KEYS` (operaatorite võtmete loend) ning EntraID rakenduse `CLIENT_ID` + `TENANT_ID` repos otse. `CLIENT_SECRET` läheb [Delinea Secret Server](https://eestiraudtee.atlassian.net/wiki/spaces/INFOSEC/pages/851607559)-isse, viidatud GitHub Actions secretiga. |
| **9. Vastuvõtu kriteeriumid** | • `dashboard.apex-research.dev.evr.ee` renderdub ükskõik millise EVR-autenditud (EntraID-kaudu) kasutaja jaoks 200-ga ja näitab live agendi-staatust<br>• `ssh ssh-apex-research.dev.evr.ee` (Cloudflare Access kaudu) avaneb autoriseeritud operaatorile ja annab tmux-pane ligipääsu jooksvale agendi-meeskonnale<br>• Konteineri restardil scratchpad-id (`teams/framework-research/memory/*.md`, `~/.claude/teams/...`) säilivad (volume-mount korrektne)<br>• RACI on täidetud — IT/Cloudflare-admin (DNS + EntraID app-i seadistus + Tunneli token), Sysops/Infra (Swarm host + runner), Tech lead (apex-research initsiatiivi PO), Developer (Brunel + framework-research operaatorid)<br>• Praegune avatud-pordi paigaldus (`100.96.54.170:5173/2222`) on dekomissioneeritud või siirdatud uue Cloudflare Tunneli taha |

`[speculative]` (Apex-team-i Tier-määratlus (Tier 1, mitte Tier 2) on Brunel-i kalibratsioon — uurimis-PoC-d on tihti Tier 2, aga apex-team-i pikem eluiga + meeskonna sõltuvus teevad temast Tier 1; Stage-1 ITOps võib seda muuta.)

---

## Pärast vormi täitmist

1. Vormi tulemus läheb Jira projekti **TPS** (ITOps), assignee = vastuvõttev tiim (TBD — Stage 1 käigus identifitseeritav alamtiim ITOps-i sees).
2. Vastuvõttev tiim hindab taotlust ning kas kinnitab, küsib täpsustusi või lükkab tagasi (nt kui Tier-i määratlus ei vasta sisule).
3. Kinnituse korral järgneb tarne — runner-i registreerimine, tunneli loomine, DNS-i kirje, GitHub Secrets-i seadistus.
4. Tarne lõppedes täidab taotleja + vastuvõttev tiim koos RACI tabeli (vt standard) ning märgib taotluse Done-iks.

(*FR:Brunel*)
