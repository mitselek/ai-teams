> **Ettepanek — ootab ITOps poolt vastu võtmist.** Käesolev leht on Stage-0 ettepanek, mis on avaldatud V2 (VJS 2) tööruumis. Pärast ITOps tiimi poolt vastuvõtmist liigub leht ITOps tööruumi (key `I`) kõrvale "EVR sisene Linux standard"-i ja "BYOD isikliku seadme standard"-iga, banner eemaldatakse ning versioon tõstetakse v1.0-le.

# EVR sisene konteinerite standard

Käesolev dokument selgitab EVR sisese ad-hoc dockeriseeritud paigalduste standardi — kõik konteinerites jooksvad teenused ja rakendused, mis on EVR IT infrastruktuuris kasutusel olukordades, kus täismahuline VM-i juurutus oleks ülemäärane (näiteks PoC, sisetiim-spetsiifiline tööriist, lühiajaline pilootsüsteem või ühe arendaja eksperimentaalne teenus). Standard kehtib kõikidele Docker / Docker Swarm / Kubernetes konteineritele EVR taristus, mis ei tule koos juba olemasoleva tarne- või tooteomaniku-hallatud platvormiga (nt SaaS-i osana). Spetsiifiliste erandite tegemine, et vältida konkreetsetel teenustel talitlushäireid või kiire piloodi pidurdamist, tuleb kõik dokumenteerida (mis erineb standardist, miks, mis on alternatiivid, mis on kaasnevad turvariskid, kes on tooteomanik, oodatav eluiga jne) ning kooskõlastada vastuvõtva tiimi (ITOps) ja infoturbega. Iga muudatus — uus avaliku DNS-i kirje, uus port, uus konteineri tarbitav saladus või tarne uue host-masina peale — tuleb dokumenteerida (kas Jiras, Confluence-i tabelis vms).

Näide: `apex-research.dev.evr.ee` (apex-research konteiner) avalikustatakse Cloudflare Tunneli kaudu Cloudflare Access-i taga ning host-masinal pordid välja ei publitseeri (vt arhitektuuri pilooti `Eesti-Raudtee/hello-world-container`). Kõrvalproduktid (saladuste rotatsiooni mehhanism, GitHub Actions self-hosted runner) on osaks standardist, mitte erand.

EVR kasutab konteinerite tasandil [Docker Swarm](https://docs.docker.com/engine/swarm/)-i ja [Docker Compose](https://docs.docker.com/compose/)-i, registriks lokaalset Docker registrit (port 32768 Swarm-i hostil) ning välisühenduseks [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)-it koos Cloudflare Access-iga. Teistsuguse orkestraatori (nt Kubernetes, Podman) kasutamine on eriolukordadel aktsepteeritav, kuid eeldab eelnevat kooskõlastust ITOps-ga ning erandi dokumenteerimist. `[speculative]` (Tehnoloogiavalik on tõstetud `Eesti-Raudtee/hello-world-container` PoC-st organisatsiooni-tasandi nõudeks; Stage-1 vaatab ITOps üle, kas seda lukustada ainsa lubatud orkestraatori ehk võimaldada laiem ring.)

Jälgime 3-tieri süsteemi `[speculative]` (Tier-süsteemi kuju on võetud üle Linux standardist, kuid tier-ide *sisuline kohandus* konteineri-konteksti — kriitiline-keskmine-madal kategooriate definitsioonid ja nendega kaasnevad nõuded — on Brunel-i ettepanek, mille ITOps Stage-1 käigus saab muuta või kalibreerida):

* **Tier 0 — KRIITILINE.** Tootmislähedased konteinerid, mis töötlevad sisemisi äriandmeid või on äriprotsessi kriitilises ahelas (nt sisemine API gateway, tootmise lähedane andmevärava teenus). Eeldab täielikku RACI-d, infoturbe heakskiitu, monitooringut, logide saatmist sentinelisse ning STIG-i / CIS-i konteineriprofiili järgimist.
* **Tier 1 — KESKMINE.** Sisetiimi tööriistad ja staging-keskkonnad, mis ei ole lõppkasutaja-suunalised, aga kus andmed on EVR-i sisemised või osaliselt piiratud (nt apex-research, hr-devs sandbox). Eeldab RACI-d, monitooringut ja logimist, STIG-i järgimine soovituslik, mitte kohustuslik.
* **Tier 2 — MADAL.** Lühiajalised eksperimentaalsed konteinerid, ühe-arendaja PoC-d, demo-keskkonnad, mille eluiga on kuni 4 nädalat ja mis ei kasuta tootmislähedasi andmeid. Lihtsustatud RACI (developer + tech lead), monitooring soovituslik, lokaalne logimine piisab. Standardist kõrvalekaldumine on Tier 2-s aktsepteeritav, kui see on dokumenteeritud (intake-vorm on siiski kohustuslik). Samuti on algusest peale kokku lepitud konteineri eluiga, mille lõppedes ta kas kustutatakse või edutatakse Tier 1.

## Baasturvalisus ja konteineri kuvand `[speculative]` (Sektsiooni-nimi on Linuxi "Baasturvalisus ja põhimõtted" konteineri-kohandus, lisades kuvandi-tasandi nõuded — image-supply-chain on konteineri-spetsiifiline kategooria, mida Linux standardis ei eksisteeri.)

Konteinerite baasturvalisuseks järgime põhimõtet, et konteineri kuvand (***image***) sisaldab AINULT seda, mis on rakenduse tööks vajalik. Mitte ükski saladus (parool, võti, token) ei tohi olla konteineri kuvandisse sisse küpsetatud — kõik saladused juurutatakse runtime-i ajal kas Docker Swarm-i secret-mehhanismi kaudu (Tier 0/1 jaoks kohustuslik) või keskkonnamuutuja kaudu (Tier 2 aktsepteeritav). Kuvandid peavad olema ehitatud minimaalsest baasist (`alpine`, `debian-slim`, `distroless`) ning kuvandi versioonil peab olema unikaalne tag (commit SHA või semver — `:latest` on keelatud tootmislähedastes paigaldustes).

Konteinereid ei tohi käivitada `--privileged` lipuga ega `root` kasutajaga — kõik teenused jooksevad mitte-priviligeeritud kasutaja all (nt `node`, uid 1000). Hosti ressursside (volume, võrk) ühisharusse panek (`network_mode: host`, bind mountid) on lubatud ainult dokumenteeritud erandina ning eeldab Tier-määratlust ja ITOps-i nõusolekut. Iga avalikustatud teenus peab kasutama Cloudflare Tunnelit — host-masina pordid avalikku võrku publitseerimine on keelatud `[speculative]` (Cloudflare Tunneli kohustuslikkus on tõstetud PoC arhitektuurist organisatsiooni-tasandile; alternatiivid (nt sisemine reverse-proxy) Stage-1 käigus arutatavad).

## Identiteedi ja ligipääsu haldus (IAM/PAM)

Konteineri-tasandi autentimine eristub kaheks selgelt eraldatud kanaliks: **interaktiivne shell-ligipääs** (operaatori SSH konteinerisse) ja **avalikustatud web-UI / dashboard / API** (sisemiste või väliste kasutajate brauseri-päringud). Mõlemal on eraldi autentimismehhanism.

**Interaktiivne shell-ligipääs:** SSH konteinerisse toimub Cloudflare Access-i SSH-proxy kaudu (`cloudflared access ssh`), mitte avaliku SSH-pordi kaudu. SSH parooliga autentimine on keelatud — ainult avaliku võtmega. Avalik võti juurutatakse runtime-i ajal keskkonnamuutuja kaudu (mitte kuvandisse sisse küpsetatud). `root` SSH-login on keelatud (`PermitRootLogin no`).

**Avalikustatud web-UI / dashboard:** Iga konteinerist välja-publitseeritud HTTP-teenus, mis on kasutatav inimese-kasutaja brauseri-kaudu, peab olema **EntraID SSO** (Azure AD, EVR tenant) taga — sama autentimis-tasand mis EVR-i olemasolevatel sisemistel teenustel (ServiceNow, Delinea, FSM). Cloudflare Access (Cloudflare-tasandi SSO) on aktsepteeritav vahepealne lahendus, kui EntraID-rakenduse seadistus ei ole jõudnud valmis, aga see ei ole pikemaks. Avatud (autentimiseta) HTTP-teenuse publitseerimine on lubatud ainult Tier 2 puhul ja vajab dokumenteeritud põhjendust. `[speculative]` (EntraID-kohustus konteinerite-tasandi web-UI-de jaoks on Brunel-i ettepanek, mis tugineb EVR-i olemasolevale SSO-praktikale ([UAM - SSO and EntraID User Provisioning](https://eestiraudtee.atlassian.net/wiki/spaces/FSM/pages/536248326), Delinea Secret Server jt) — Stage-1 vaatab ITOps üle, kas keskenduda EntraID-le või toetada ka teisi SSO-mehhanisme.)

GitHub Actions secret-id (saladused, mis liiguvad CI/CD pipeline-i kaudu konteinerisse) hallatakse repositooriumi tasandil ning rotatsioon on tooteomaniku vastutus `[speculative]` (rotatsiooni-vastutuse omistamine tooteomanikule on Brunel-i ettepanek; alternatiiv = ITOps-i tsentraalne haldus).  
Cloudflare Tunneli token-i rotatsioon toimub commit-SHA-põhise versioneerimisega — uus token-i nimi luuakse iga deployment-i kohta ning vana kustutatakse, kui see ei ole enam kasutuses (vt `Eesti-Raudtee/hello-world-container/.github/workflows/deploy.yml`). Edaspidi on plaanis Cloudflare Access-i poliitikate haldus ja konteineri-tasandi RBAC liidestada keskse PAM-i ([Delinea Secret Server](https://eestiraudtee.atlassian.net/wiki/spaces/INFOSEC/pages/851607559)) — info lisamisel `[speculative]` (Delinea-liidestuse plaan tõstetud Linux standardi IAM/PAM-sektsioonist; konteineri-tasandi RBAC-i kuju ei ole määratletud).

## Monitooring `[speculative]` (Kogu sektsiooni sisu — `healthcheck` kohustus, Tier-eristus, OOM/restart-nähtavus — on Brunel-i ettepanek; Linux standardis on monitooringu-sektsioon "valimisel" (Prometheus vs Zabbix vs PRTG), seega ka konteineri-pool on lahtine.)

Konteinerite tervise monitooring toimub Docker Swarm-i natiivse `healthcheck`-i kaudu — iga teenus peab Compose-failis defineerima `healthcheck` direktiivi (HTTP endpoint või protsessi-tasandi check). Tier 0/1 konteinerid peavad olema ka liidestatud keskse monitooringu (Prometheus + Grafana või Zabbix — sõltuvalt EVR Linux standardi lõplikust valikust) süsteemi. Tier 2 konteinerite jaoks on monitooring soovituslik, mitte kohustuslik. Konteineri restart-rikked, OOM-`kill`id ja tervise-checki ebaõnnestumised peavad olema nähtavad kas Swarm-i logides või monitooringu süsteemis.

## Logimine

Konteinerite stdout/stderr logid kogutakse `docker logs` kaudu — sshd logid suunatakse `-e` lipuga stderr-i (vt walkthrough), nii et need on `docker logs` väljundis nähtavad. Tier 0/1 konteinerid peavad olema seadistatud nii, et logid voolavad host-masina syslog-i ning sealt edasi sentinelisse (sama mehhanism mis Linux standardis) `[speculative]` (konteinerist-syslog-konfi konkreetne mehhanism — `--log-driver=syslog`, vector, fluent-bit vms — ei ole määratletud; Stage-1 ITOps valib).  
Tier 2 jaoks on lokaalsed `docker logs` piisavad, aga eluea lõppedes peab oluline logide info olema dokumenteeritud, kui see on auditi seisukohast vajalik.

## Tarne- ja juurutusprotsessi automatiseerimine

Iga konteineri juurutus peab tulema commit-pealt — manuaalne `docker run` host-masinal on keelatud Tier 0/1 jaoks ning soovimatu Tier 2 jaoks `[speculative]` (commit-pealt-juurutuse kohustus on Brunel-i ettepanek PoC arhitektuuri pealt; Tier-eristus on Brunel-i kalibratsioon). CI/CD pipeline kasutab GitHub Actions-i ning self-hosted runner-it, mis jookseb otse Docker Swarm-i hostil (nii et runner-il on ligipääs Docker daemon-ile). Kuvandid ehitatakse pipeline-is ning lükatakse lokaalsesse Docker registrisse (`localhost:32768`). Pipeline ei küpseta saladusi kuvandisse — kõik saladused juurutatakse Swarm-i secret-i mehhanismi kaudu või keskkonnamuutuja kaudu deploy-staadiumis.

### Uute konteinerite juurutus

Uue konteineri juurutamiseks peab arendaja täitma [intake-vormi](https://eestiraudtee.atlassian.net/wiki/spaces/V2/pages/1715699714/Konteineri+tarne+taotlus+intake-vorm), milles määratakse Tier, oodatav eluiga, andmete klassifikatsioon, võrgule avatuse ulatus ja vastuvõtu kriteeriumid `[speculative]` (intake-vormi väljakogum on Brunel-i ettepanek; Stage-1 ITOps võib lisada/eemaldada välju vastuvõtva tiimi sisemise workflowi järgi). Vorm liigub vastuvõtva tiimini (TBD — Stage 1 käigus identifitseeritav ITOps-alamtiim), kes annab tagasi konteineri tarnimiseks vajaliku konfiguratsiooni: Cloudflare Tunneli token, DNS-i kirje, GitHub Secrets-i sihid, runner-i registreerimine.

Standardisse kuulub ka neljarolline RACI tabel, mis on võetud üle `Eesti-Raudtee/hello-world-container` PR #2 (`docs/DEPLOYMENT-ROLES.md`) tabelist ning kohandatud organisatsiooni tasandile `[speculative]` (Lähtetabel on draft-staadiumis — RFC #2 review pending `deniss-labunets`-i poolt seisuga 2026-04-30. Org-tasandi kohandused (rolli-nimed, vastutuse-veerud) on Brunel-i ettepanek; Stage-1 vaatavad RACI üle nii ITOps kui PR #2 review-d):

| Roll | Vastutus |
|---|---|
| **IT / Cloudflare admin** | Tunneli loomine, DNS, Cloudflare Access poliitika, token-i rotatsioon |
| **Sysops / Infra** (TBD — Stage 1 vastuvõtt) | Self-hosted runner, Docker Swarm, lokaalne register, host-masina hooldus |
| **Tech lead** | Arhitektuuri heakskiit, Tier-i määramine, RACI sõlmimine, erandite kooskõlastamine |
| **Developer** | Workflow seadistus, kuvandi ehitus, deploy, secret-ide nimetamine, lokaalne testimine |

Kõik neli rolli peavad olema isikustatud enne esimest deploy-i — `?` lahter on keelatud go-live-ks. Vastuvõtja ITOps-tiim (kes võtab "Sysops / Infra" rolli organisatsiooni tasandil) selgub Stage-1 tracking-issue käigus.

(*FR:Brunel*)
