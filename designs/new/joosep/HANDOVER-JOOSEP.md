# Üleandmine -- konteiner `joosep` (*FR:Brunel*)

**Staatus: MUSTAND, ootab PO eestikeelset ülevaatust** (Celes ei ole S67-s käivitatud; Aen suunas
ülevaatuse PO-le, "Mihkel luges üle" tava järgi). Saadab PO, mitte tiim.

**Sõrmejälge siin EI OLE, ja see on meelega.** See läheb Joosepile eraldi kanalis. Kui mõlemad
tulevad sama kanalit pidi, ei kontrolli võrdlus enam midagi.

---

## Tere, Joosep

Sinu konteiner on RC-serveris valmis ja töötab. Allpool on kõik, mida esimeseks korraks vaja.

### 1. Enne ühendumist

Veendu, et **Cloudflare WARP** on ühendatud (`warp-cli status`). RC on kättesaadav ainult WARP-i kaudu.
Tailscale't EVR ei kasuta -- kui kusagil on nii kirjas, on see vale.

### 2. Kaks ühendusviisi

| Käsk | Kuhu satud |
|---|---|
| `Connect-Joosep` | tavaline **shell** konteineris |
| `Connect-Joosep -Session` | otse **Claude'i sessiooni** (tmux, jääb taustale alles) |

Erinevus on tahtlik. `-Session` jätkab sama sessiooni ka pärast lahtiühendamist -- töö ei kao, kui
aken kinni paneb. Tavaline `Connect-Joosep` annab puhta shelli, ilma et see sessiooni segaks.

Kui `Connect-Joosep` ei ole veel seadistatud, teeb sama asja tavaline `ssh`:

```
ssh -p 2231 joosep@100.96.54.170                    # shell
ssh -t -p 2231 joosep@100.96.54.170 joosep-session  # Claude'i sessioon
```

Võtmefaili ei ole vaja ette anda -- `ssh` leiab Sinu vaikimisi võtme ise.

### 3. Esimene ühendus -- võrdle sõrmejälge

Esimesel korral küsib SSH, kas usaldad serveri võtit. **Nõustu alles siis, kui oled seda võrrelnud
sõrmejäljega, mille saatsin eraldi.** Seda küsitakse ainult üks kord.

**Kui see küsimus hiljem uuesti tuleb, ära nõustu -- võta minuga ühendust.** Võti ei tohi muutuda.
Kui ta muutub, on selleks põhjus, ja seda tasub teada enne kui edasi minna.

### 4. Sinu esimesed ülesanded

Konteineris on fail **`~/FIRST-TASKS.md`** -- see on Sinu tegelik alustamisjuhend (GitHubi token,
Atlassiani ühendus, tiimi käivitamine). Alusta sealt, mitte sellest failist.

Sinu tiim konteineri sees on **`paunvere`** -- kuus agenti, kirjeldused kaustas `~/work/paunvere/`.

### 5. Üks asi, mida oleksid muidu ise avastanud

`~/FIRST-TASKS.md` **asendati eestikeelse versiooniga** pärast seda, kui konteiner juba töötas.

**Sinu tööd ei kirjutatud üle.** Enne asendamist kontrollisime, et fail oli täpselt see, mille
konteiner ise algul lõi -- võrdlesime kontrollsummasid ja need olid identsed, seega ei olnud seal
midagi Sinu oma. Vana ingliskeelne fail on alles Sinu kodukaustas nime all
`~/FIRST-TASKS.md.superseded-20260831-105548`, kui tahad võrrelda.

### 6. Esimene `claude` käivitus

Esimesel korral käib autentimine Sinu enda brauseris (OAuth). Pärast seda jäävad andmed konteinerisse
alles -- ka üle taaskäivituste ja image'i uuenduste.

### 7. Mida Sa ise teha ei saa -- ja see on tahtlik

Sul **ei ole ligipääsu RC hostile endale**, ainult oma konteinerile. See tähendab, et image'i
muutmine, taaskäivitamine ja iga taastamine käib **minu kaudu**.

See ei ole ainult turvameede, see on ka reaalne koormuse nihe: kui konteiner ise kättesaamatuks jääb,
on **"küsi Mihkelilt"** ainus tee. Ütlen selle välja, et see ei tuleks üllatusena esimesel korral,
kui midagi katki läheb.

---

*Küsimused: Mihkel. Konteineri sisemine juhend on `~/FIRST-TASKS.md`, mitte see fail.*
