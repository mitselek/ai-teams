# Tracking issue — Jira post body

> **Sihtprojekt:** TPS (ITOps), board <https://eestiraudtee.atlassian.net/jira/software/c/projects/TPS/boards/90>  
> **Soovitatud assignee:** Ruth Türk (V2 tööruumi omanik, Stage-0 ettepaneku eestkostja)  
> **Issue type:** Task

---

## Pakutav pealkiri

**EVR sisene konteinerite standard — organisatsiooniülene vastuvõtt**

---

## Body (paste-into-Jira markdown)

### Eesmärk

**VJS 2 meeskond** (juht: Ruth Türk) soovib juurutada **apex-team** AI-uurimismeeskonna konteinerina EVR taristusse. See konkreetne juurutus-vajadus ajendas käesoleva ettepaneku — **EVR sisese konteinerite standardi** (ad-hoc dockeriseeritud paigaldused) — koostamist. Standard formaliseerib, kuidas selliseid juurutusi (apex-team ja edaspidi sarnased ad-hoc konteineripaigaldused — PoC-d, sisetiimi tööriistad, eksperimentaalsed teenused) saab EVR-is turvaliselt taotleda, juurutada, jälgida ja ühtsete rollide järgi käitada.

Käesolev tracking-issue jälgib **standardi vastuvõtu protsessi** ITOps-i poolt — Stage-1 etapis (käesolev issue) ülevaatus + vastuvõtva alamtiimi identifitseerimine, Stage-2 etapis ametlik vastuvõtt + standardi liigutamine ITOps Confluence ruumi (key `I`) v1.0-na. Apex-team-i juurutus ise on standardi esimene tarbiv juhtum (vt intake-vormi täielikku näidet `evr-konteinerite-intake-template-v0.1.md`-s).

### Skoop (sees)

* Standard kehtib kõikidele Docker / Docker Swarm / Kubernetes konteineritele EVR taristus, mis ei tule koos juba olemasoleva tarne- või tooteomaniku-haldatud platvormiga
* 3-tieri klassifikatsioon (Tier 0 — KRIITILINE, Tier 1 — KESKMINE, Tier 2 — MADAL) konteinerite kriitilisuse järgi
* Baasturvalisuse, IAM/PAM, monitooringu, logimise ja tarne-automatiseerimise nõuded
* 4-roleline RACI (IT / Cloudflare admin, Sysops / Infra, Tech lead, Developer) — tõstetud `Eesti-Raudtee/hello-world-container` PR #2-st organisatsiooni tasandile `[speculative]` (Lähtetabel on draft-staadiumis — RFC #2 review pending `deniss-labunets`-i poolt; Stage-1 vaatavad RACI üle nii ITOps kui PR #2 review-d.)
* Intake-vormi (Jira ülesande) struktuur uue konteineri taotlemiseks
* Erandite dokumenteerimise kohustus

### Skoop (väljas)

* Tootmistasandi orkestraatori (full-scale Kubernetes klastri) standardiseerimine — see on iseseisev töö
* Olemasolevate VM-põhiste teenuste konteineriseerimine — eraldi migratsiooni-projekt
* Cloudflare Tunneli ärilise litsentseerimise küsimused — IT poolne otsus, mitte standardi sisuline osa
* Konteineri sisuline koodikvaliteet, testimine, application-tasandi turvalisus

### Stage-0 ettepaneku link

Standard v0.1, intake-vormi mall ja käesolev tracking-issue body asuvad praegu mustanditena `mitselek/ai-teams` repos, asukoht `teams/framework-research/docs/`:

* `evr-sisene-konteinerite-standard-v0.1.md`
* `evr-konteinerite-intake-template-v0.1.md`
* `evr-konteinerite-tracking-issue.md` (käesolev)

Pärast PO heakskiitu publitseeritakse standard V2 (VJS 2) Confluence ruumi (id `1115095052`, key `V2`) Stage-0 ettepanekuna. **Stage-0 lehe URL:** _<lisada pärast publitseerimist>_

### Stage-1 ülesanne (käesolev issue)

**@Ruth Türk** kui V2 tööruumi omanik ja Stage-0 ettepaneku eestkostja:

> Standard publitseeriti algselt D365 tööruumi (selle koostaja Mihkel Putrinš-il puudus V2-s loomisõigus). Esimese sammuna palume Ruthi (kes on V2 ruumi omanik) leht V2 tööruumi tõsta — see on ~30 sekundi tegevus tema õigustega.

1. **Liiguta Stage-0 ettepaneku leht D365 tööruumist V2 tööruumi** (page id `1713864752`, URL: <https://eestiraudtee.atlassian.net/wiki/spaces/D365/pages/1713864752/EVR+sisene+konteinerite+standard>) — see on ettepaneku õige Stage-0 koht; D365-paigutus on ajutine logistika-lahendus loomisõiguse-piirangu tõttu
2. **Vaata standardi v0.1 üle** ja anna tagasiside, kas sisu on EVR-i kontekstis kohane (eriti tier-süsteem, RACI ja intake-vormi väljad)
3. **Eskaleeri ITOps-i suunas** ehk kasuta enda tiimi sisest käsuliini (Roland Kilusk + ITOps tiim, kes haldab "EVR sisene Linux standard"-it ja "BYOD isikliku seadme standard"-it ITOps Confluence ruumis `I`), et **identifitseerida vastuvõttev alamtiim** ITOps-i sees, kes võtab "Sysops / Infra" rolli organisatsiooni tasandil ning saab assignee-ks intake-vormi-põhiselt sisse tulevatele konteineri-taotlustele
4. Kui ITOps võtab standardi vastu, **liigub leht V2-st ITOps ruumi** (key `I`, kõrvuti Linux ja BYOD standarditega), versioon tõstetakse v1.0-le ning banner ("Ettepanek — ootab ITOps poolt vastu võtmist") eemaldatakse

### Bridge — RFC #2 sulgemine

Käesoleva issue sulgemine sulgeb **loomulikul moel ka RFC #2** (`Eesti-Raudtee/hello-world-container` PR #2 — "RFC: Full PoC review — container + tunnel + SSH + CI/CD"), kus deniss-labunets-i review on hetkel pending. RFC #2 oli tehniline review-gate hello-world-container PoC-le; käesoleva tracking-issue sulgemine = standardi org-tasandil vastu võtmine = PoC-i käitlemise raamistiku ametlik kinnitamine = RFC #2 ülesanne täidetud. PR #2 ise jääb avatuks `do not merge` lipuga (selle eesmärk on alati olnud review-pind, mitte merge-kandidaat), kuid review-staatust saab käesoleva issue käigus sulgeda.

### Vastuvõtu kriteeriumid (acceptance criteria)

Käesolev tracking-issue on Done, kui:

* [ ] **Vastuvõttev alamtiim ITOps-i sees on nomineeritud** ning kommunikeeritud (kas käesolevas issue-s kommentaarina või eraldi Confluence-i lehel)
* [ ] **Intake-vormi assignee-väli on täidetud** — vastuvõttev tiim on määratud TPS projekti automaatseks assignee-ks intake-vormi-põhiselt sisse tulevatele konteineri-taotlustele
* [ ] **Standard on liigutatud V2 ruumist ITOps ruumi (`I`)** kõrvuti Linux ja BYOD standarditega, versioon v1.0, banner eemaldatud
* [ ] **RFC #2 (`Eesti-Raudtee/hello-world-container` PR #2)** on review-staatuse poolt suletud (PR ise võib jääda avatuks `do not merge` lipuga) `[speculative]` (Bridge-loogika — käesoleva issue sulgemine = RFC #2 review-staatus suletud — on Brunel-i ettepanek; Stage-1 võib RFC #2 sulgemise eraldada eraldi sammuks.)

### Lisa info

* **Mustand-failid:** `mitselek/ai-teams` repo, branch `main`, asukoht `teams/framework-research/docs/`
* **Seemne PoC repo:** `Eesti-Raudtee/hello-world-container` (tag `v1.2.0` + RFC #2)
* **Taotlev meeskond:** VJS2 (juht: Ruth Türk)
* **Esimene tarbiv juurutus:** apex-team (apex-research / framework-research initsiatiiv) — `dashboard.apex-research.dev.evr.ee` ja `ssh-apex-research.dev.evr.ee`
* **Mirroritav struktuur:** "EVR sisene Linux standard" (Confluence page `1335984130`, ITOps ruum `I`, autor Roland Kilusk)

(_FR:Brunel_)
