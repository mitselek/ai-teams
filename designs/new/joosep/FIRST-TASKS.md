# Esimesed ülesanded -- konteiner `joosep`

Tere, Joosep. See konteiner käivitub **teadlikult ilma kredentsiaalideta**: siin ei ole GitHubi tokenit
ega Atlassiani ligipääsu. See ei ole unustus -- oma kredentsiaalide hankimine on esimene päris töö
sulle ja su agentidele, nii et kõik, milleni see tiim ulatub, on midagi, mille *sina* talle andsid,
*sinu* nime all.

Tee need järjekorras. Igal ühel on **kontroll**; ära liigu edasi enne, kui see läbib.

> **Keelemärkus:** käsud, failinimed, identifikaatorid ja GitHubi/Atlassiani liidese tekstid on
> **inglise keeles meelega** -- sa vaatad neid ingliskeelsest liidesest ja ingliskeelsest koodist.
> Tõlgitud on ainult selgitav osa.

---

## Ülesanne 0 -- Claude'i sisselogimine (sina, üks kord, enne kõike muud)

Miski allpool ei tööta enne, kui Claude on autenditud.

```bash
claude
```

Järgi OAuth-i seadmevoogu oma brauseris. Kredentsiaalid salvestuvad `joosep_home` volume'ile ja jäävad
püsima üle taaskäivituste ja image'i uuesti ehitamiste -- seda sammu ei pea kordama.

**Kontroll:** `claude --version` väljastab versiooni ja `claude` sessioon käivitub ilma
sisselogimisküsimuseta.

---

## Ülesanne 1 -- Loo GitHubi PAT

**Fine-grained** personal access token sinu enda kontol (`JoosepM-565`).

**Täpne skoop -- mitte laiem:**

| Säte | Väärtus |
|---|---|
| Resource owner | `Eesti-Raudtee` |
| Repository access | **Only select repositories** -> `HES-integration-tests`, `rumba` |
| Repository permissions | **Contents: Read-only**, **Metadata: Read-only** (metadata on kohustuslik ja valitakse automaatselt) |
| Kõik muu | jäta **No access** peale |
| Expiration | vali kuupäev, mida sa päriselt uuendad; pane kuskile kirja |

**Teadlikult ANDMATA -- ja põhjus ei ole see, mida sa ilmselt ootad:**

> **Sul endal on juba rohkem õigusi, kui sellel tokenil saab olema.** VJS2 tiimi liikmelisus annab sulle
> **GitHubi admin-õigused `rumba` peal**, kaitsmata `main`-i kohal, ja kirjutusõiguse
> `HES-integration-tests`-is (kuhu tehakse otse-`main` push'e, PR-ajaloota). Nii et siin ei ole ühtegi
> lage, mille vastu sa põrkad -- **sul palutakse anda oma agentidele teadlikult vähem, kui sul endal
> on.** Selles ongi mõte, ja just see samm tundub vormi täites ebavajalik.

- **Mitte mingit write/push õigust.** Mitte sellepärast, et sul õigust poleks, vaid sellepärast, et
  agendil, kellel on kirjutusõigus kaitsmata `main`-i peale, ei ole ühtegi väravat vea ja selle haru
  vahel, millelt kõik teised ehitavad. *Kaitsemehhanismi puudumine ei ole luba.* Sa ei ole ka
  `vjs-code-reviewers` liige -- sa oled `rumba` merge-värava suhtes teadlikult väljaspool, ja tiim ei
  tohi omandada seda, mida sulle ei antud.
- **Mitte admin, mitte org-õigused.** Sinu admin `rumba` peal on täpselt see, mida ei tohi peegeldada.
- **Mitte `workflow` skoopi.** See laseks agendil CI-definitsioone muuta.
- **Ainult kaks repot**, kuigi su org-tiimid ulatuvad 40+-ni. Need on kaks, kuhu sa oled päriselt
  commit'inud; kogu `hes`-tiimi õigus on kasutamata. Laienda nimetatud vajaduse peale, mitte ette.

Kui mõtled "aga ma *saan* siin write'i anda" -- jah, ja just seepärast on see otsus, mitte piirang. Kui
mõni hilisem ülesanne päriselt vajab kirjutusõigust, küsi see siis, selle repo jaoks, ja ütle milleks.

**Paigaldamine:** token läheb `.env`-i **hostis**, mitte selle konteineri sisse. Saada see Mihklile
kanalit pidi, mida kasutaksid parooli jaoks; tema lisab `GITHUB_TOKEN=...` ja käivitab
`./joosep.sh restart`. Repod kloonitakse siis sellel käivitusel automaatselt -- image'it uuesti ehitama
ei pea.

**Kontroll (pärast restarti):**

```bash
gh auth status
ls ~/work/           # oodatav: HES-integration-tests  rumba
git -C ~/work/rumba log --oneline -3
```

Kontrolli ka, et lagi päriselt peab -- liiga lai skoop on viga, mida tasub avastada nüüd, mitte hiljem:

```bash
gh repo view Eesti-Raudtee/vjs_apex_apps 2>&1 | head -2   # oodatav: viga / pole ligipääsetav
```

---

## Ülesanne 2 -- Autendi EVR Atlassiani konnektor

See asendab API-tokenid täielikult -- selles konteineris ei ole ühtegi Atlassiani saladust ja ei tohigi
olla. Konnektor katab **nii Jira kui Confluence'i** sinu enda konto all, nii et kehtivad sinu enda
õigused ja iga tegevus on sinu nimel.

**See on sinu tiimi teine ülesanne, mitte miski, mida sulle ette seadistatakse.** Hoster-poolset
paigaldussammu ei ole: su agendid juhendavad sind selle läbi interaktiivselt. Kui midagi jääb kinni,
küsi Mihklilt -- ära arva, sest vale arvamine jätab poolikult seadistatud MCP-kirje, mis eksitavalt
katki läheb.

Kui konnektor on ühendatud, peaksid oma Claude'i sessioonis nägema Atlassiani tööriistu
(`atlassianUserInfo`, `getVisibleJiraProjects`, `getConfluenceSpaces` pere).

**Kontroll -- kolm asja, kõik odavad:**

1. **Identiteet:** `atlassianUserInfo` tagastab **sinu** konto, mitte jagatud konto.
2. **Jira võtme, mitte kuvanime järgi:** `getVisibleJiraProjects` sisaldab `VJS1`, `VEO`, `HES`,
   `PONY`, `FSM`, `D365`. **Pane tähele: `VEO` kuvatakse nimega "VJS2"** -- anna õigusi ja päri alati
   *võtme* järgi.
3. **Confluence:** `getConfluenceSpaces` sisaldab `VJS2`. Just see kontroll tõestab, et konnektor tegi
   midagi, mida ainult-Jira seadistus ei suudaks.

**Üks omadus, mis tasub enne kasutamist selgeks teha:** sinu kredentsiaal näeb Jirast ja Confluence'ist
*teistsugust* lõiku kui Mihkli oma. **Tühi tulemus sinu tehtud otsingust ei ole tõend, et asja ei ole
olemas** -- see võib olla tõend ainult selle kohta, et see ei ole sulle nähtav. Kui otsing tuleb tühi ja
vastus on oluline, ütle "sellele kontole ei ole nähtav", mitte "ei ole olemas".

---

## Ülesanne 3 -- Kontrolli konteinerit ennast

```bash
type -a claude          # oodatav: TÄPSELT ÜKS tee, ~/.local/bin all
tmux ls                 # tavalisest shellist: sessiooni ei ole (nii peabki olema)
cat ~/FIRST-TASKS.md    # see fail -- muuda seda vabalt, see on nüüd sinu oma
```

Kaks ühendusviisi, milles ongi kogu mõte:

- `Connect-Joosep` -> tavaline shell. Hea gitile, failitööks, ringivaatamiseks.
- `Connect-Joosep -Session` -> kinnitub su töötavasse Claude'i sessiooni. `Ctrl-b d` eraldab ja
  **jätab Claude'i tööle**; terminali sulgemine teeb sama. Ühendu uuesti ja vestlus on seal, kus jäi.

Kui `type -a claude` näitab kunagi **kahte** teed, peatu ja ütle Mihklile -- see tähendab, et teine
paigaldus on sisse hiilinud, ja siis sõltub saadav versioon sellest, kuidas sa sisse logisid.

---

## Ülesanne 4 -- Tiim (pärast 1--3 läbimist)

Sinu tiim on `vedur`: kuus agenti, kõik nimetatud raudtee-ajaloo pioneeride järgi. Failid:
`~/work/vedur/` (roster.json, common-prompt.md, prompts/).

| Nimi | Roll | Töötab |
|---|---|---|
| **Minot** | tiimijuht / dispetšer -- sinu ainus vestluskaaslane, räägib eesti keeles | jagab ülesandeid, ei kirjuta ise koodi |
| **Trevithick** | teenuse ehitaja | `rumba` / `apps/elron-test` |
| **Rastrick** | E2E-komplekti hoidja | `HES-integration-tests` -- kirjutab ja triaažib, **ei käivita** (kredentsiaale konteineris pole) |
| **Saxby** | ülevaataja ja rööpavaht | mõlemad repod; hoiab **ühte kõva ohutusreeglit** |
| **Bradshaw** | release-kaardistaja | Jira 6 projekti + GitHub, **ainult lugemine**; hügieeniaudit = raporteeritakse, ei rakendata |
| **Smiles** | kirjutaja | **ainus**, kes Jirasse/Confluence'i kirjutab: VEO-98, sinu VJS1 piletid, VJS2 ruum -- alati pärast sinu ülelugemist |

Alusta: `Connect-Joosep -Session`, siis `claude` kaustas `~/work`. Minot loeb `vedur/startup.md`,
tervitab sind ja pakub järgmise sammu. **Ta ei spawni kedagi ilma ülesandeta.**

Kaks reeglit, mis on tiimi promptides päevast 1 (õpitud valusalt):

1. **`gh search` indekseerib ainult vaikeharu** -- uuringu käigus jäi 14 sinu 67 commitist märkamata.
   Harude loend käib `repos/{owner}/{repo}/branches` + `commits?sha=<haru>` kaudu.
2. **Hügieenileiud raporteeritakse, mitte ei rakendata.** Koondpilt puudutab viit projekti, mis pole
   sinu omad.

---

## Ülesanne 5 -- Esimene päris töö (ainult lugemine, PAT-i laiendamata)

Kaks iseseisvat asja, mõlemad vaid loevad:

**5a. Saxby vaatab üle haru `feat/VJS1-826-elron-test`** -- mitte et sulle su enda koodi seletada, vaid
PR-valmiduse pilguga (mida `vjs-code-reviewers` küsiks) ja rööpa pilguga. Ta toob välja kaks juba teada
asja, mis on sinu otsustada ja Ruth Türgile viia: guard on alamstringitest `includes('EvrSK_test')`
kolmes koopias, ja rongi-numbrivahemiku kontroll on tööriistast eemaldatud (`faa287e`). Tiim seda
**ei paranda** -- raporteerib.

**5b. Bradshaw teeb esimese release-koondpildi** kuue projekti Jirast (VEO võti = kuvanimi "VJS2"),
koos hügieeni-deltadega su juulikuu mustandi (leht 1928429583) põhjal. Tulemus: mustand
`~/work/vedur/drafts/`, Smiles kirjutab sellest eestikeelse jutu -- sina loed, siis alles läheb VEO-98
alla.

**Kontroll:** Saxby raport on Minoti kaudu sinu ees; Bradshaw mustand on olemas ja iga tühi lahter on
märgitud "andmed puuduvad", mitte "midagi pole".

---

## Ülesanne 6 -- Esimene kirjutamine: VJS1-826 PR-i

Nüüd on esimene **nimeline vajadus** PAT-i laiendamiseks: `rumba` repos **Contents: Read and write** +
**Pull requests: Read and write**. Ainult see repo, ainult need kaks. Saada uus token Mihklile samamoodi
kui ülesandes 1; `./joosep.sh restart`.

Siis: Trevithick teeb Saxby leiud haru peal korda -> Saxby CLEAR -> haru push (mitte `main`) ->
`gh pr create` -> **sina** küsid review'd `vjs-code-reviewers`-ilt. Tiim ei kinnita ega merge'i midagi,
kunagi.

**Kontroll:** PR on lahti, review küsitud, Smiles on VJS1-826 alla kirjutanud lühikese seisu (pärast
sinu ülelugemist).

---

## Üks kõva ohutusreegel

**Mitte mingit kirjutusteed ühessegi VJS / HES / PONY runtime'i ega testkeskkonda, ja mitte mingit
võimalust neisse sõnumeid saata.**

`apps/elron-test` repos `rumba` suudab saata sõnumeid Eesti Raudtee sõnumikeskusesse (EvrSK).
**Sama koodirada**, mis jõuab TEST-sõnumikeskusesse, jõuaks mujale suunatuna **tootmises töötava
raudtee liikluskorraldussüsteemini**. Praeguses koodis on ainus kaitse selle vastu
**kaitserööbas** (routing rail), ja mitte midagi muud:

- endpoint tuleb `SK_ENDPOINT` saladusest, vaikeväärtusega `DEFAULT_TEST_ENDPOINT` failis
  `apps/elron-test/src/lib/soap.ts`;
- iga saatmistee failis `apps/elron-test/src/lib/send-request.ts` keeldub, kui endpoint'i string ei
  sisalda `EvrSK_test`;
- päris kredentsiaalid (`SK_USER`, `SK_PASSWORD`) asuvad Delinea's ja Worker'i saladustes. **Neid ei
  ole selles konteineris ja ei tohi kunagi olla.**

**Sa tunned seda rööbast paremini kui see dokument -- sa ehitasid selle.** Commit `39f16a83` on sinu
(2026-08-26): see eemaldas `isTest` lüliti ja peidetud välja, ja server saadab nüüd alati
`isTest=false`. Siin ei räägita sulle uudiseid sinu enda koodist. Kaks asja tasub siiski öelda, sest
need käivad **konteineri**, mitte rööpa kohta:

**1. Konteiner hoiab `SK_ENDPOINT`-i meelega enda käest ära.** Seda ei ole `.env`-is, ei ole
keskkonnamuutujates, ja seda ei tohi sinna lisada. See on ainus koht kogu selles disainis, kus
"konteiner ei ulatu selleni" on päris ohutus, mitte kahjuraadiuse vähendamine -- kõik muu, mida see
konteiner endast eemal hoiab (docker socket, Cloudflare'i kredentsiaalid, teiste tiimide volume'id,
jagatud saladused), on selle kõrval korrashoid. **Aga täpsuse mõttes: see on teine kiht `EvrSK_test`
kontrolli peal, mitte kontroll ise.**

Kaks selle kontrolli omadust, mis väärivad su pilku selle autorina -- kumbki ei ole etteheide, mõlemad
on asjad, mille ülevaataja tõstataks: **alamstringi** test laseb läbi kõik, mis lihtsalt *sisaldab*
`EvrSK_test`, ja **kolm koopiat** on kolm kohta, mida tuleb sünkroonis hoida.

**2. Reserveeritud ronginumbrid on selle tiimi jaoks siduvad ilma eranditeta -- ja tööriist ise ei
jõusta neid enam.** Iga ronginumber, mille agent kirjutab testi, fixture'isse, vormi, JSON-kehasse või
dokumenti, **peab olema** vahemikus 4020-4029, 4040-4049, 4120-4129, 4140-4149. Mitte ükski muu number,
mitte kunagi.

See kehtib **hoolimata sellest**, et `elron-test` ise lõpetas selle jõustamise: commit `faa287e`
(2026-08-27) eemaldas vahemikukontrolli kliendist **ja** serverist. Docstring failis `timetable.ts:10`
väidab endiselt *"enforced server-side"* -- **see on aegunud**: miski tööriistas ei jõusta seda, ja
keegi meie ahelas ei ole kontrollinud, kas sõnumikeskus ise seda teeb. **See, et tööriist lubab, ei
tähenda, et tiim tohib.**

*(Tasub teada, kuidas see sinuni jõudis: selle konteineri jaoks kirjutatud briefing parandas ära
`isTest`-i eemaldamise -- ja tugines siis ühe rea hiljem vahemikukontrollile, mille sina olid
eemaldanud päev enne selle kirjutamist. Kaitsemehhanismide nimekiri aegub koodi kiirusel, ja ühe kirje
parandamine ei värskenda ülejäänuid.)*

**3. Rööpal ei ole sõltumatut kontrolli, ja just seepärast loeb konteineri-poolne kiht.**
apex-research'i ülevaatus ei leidnud saatmisteelt ühtegi CI-kontrolli, haru kaitset ega seiret, ning
tuvastas, et kaitse autor, hooldaja ja see, keda ta piirab, on sama inimene, ning ainus dokumenteeritud
ülevaatus tuli AI-agendi kaudu. See on **nende** leid PO-le, mitte etteheide su koodile ega midagi,
mida see konteiner parandab. Aga see tähendab, et enda käes hoitud `SK_ENDPOINT` on üks väga vähestest
üldse eksisteerivatest sõltumatutest kontrollidest -- tasub teada enne, kui sina või mõni agent otsustab,
et seda oleks siin mugav seadistatavaks teha.

**Ja ära viita `isTest`-ile üheski prompti-, roster- ega poliitikafailis siin** -- mitte sellepärast, et
sina seda vääriti kasutaksid, vaid sellepärast, et tulevane agent, kes sellist faili loeb, usuks end
olevat kaitstud lipuga, mis on kõvasti seatud ohtlikule väärtusele.

---

*Koostanud (\*FR:Brunel\*) joosep-konteineri jaoks, 2026-08-28. Ülesanded 4--6 ja ohutusreegli sõnastus:
(\*FR:Celes\*). See fail on sinu oma -- muuda seda töö käigus. Puutumata koopia jääb faili
`/opt/FIRST-TASKS.md`; image'i uuesti ehitamine sinu versiooni üle ei kirjuta.*
