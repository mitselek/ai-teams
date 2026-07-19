// SMMenuBar.swift -- macOS menu bar indicator for stationmaster mail
// (operator identity). Pure RENDERER of ~/.stationmaster-operator/status.json,
// which smc maintains; this app never talks to the hub itself. The launchd
// poller (com.mitselek.sm-notify) remains the only scheduled hub client.
//
// Build: designs/deployed/po-team/operator/build-menubar.sh
// Runs as an LSUIElement agent (no Dock icon), auto-started by launchd
// (com.mitselek.sm-menubar).
//
// Safety rule: message TEXT (summaries) appears ONLY as NSMenuItem titles --
// never interpolated into any shell or AppleScript string. The only values
// that reach a shell are the fixed smc path and hub message ids validated
// against ^[0-9a-f]{16}$.

import AppKit

struct WaitingMessage {
    let id: String
    let fromTeam: String
    let depositedAt: String
    let summary: String
}

struct SMStatus {
    let checkedAt: String
    let waiting: [WaitingMessage]
    let unseen: Int
}

@main
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate,
                         NSUserNotificationCenterDelegate {

    // NSApplication.delegate is unretained -- hold the delegate here.
    static var shared: AppDelegate?

    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        AppDelegate.shared = delegate
        app.delegate = delegate
        app.setActivationPolicy(.accessory)   // belt + braces with LSUIElement
        app.run()
    }

    let statusPath = NSString(string: "~/.stationmaster-operator/status.json")
        .expandingTildeInPath
    let smcPath = NSString(string: "~/.local/bin/smc").expandingTildeInPath

    var statusItem: NSStatusItem!
    var lastGood: SMStatus?          // kept across malformed reads
    var statusFileMissing = true
    var timer: Timer?
    var runningProcs: [Process] = [] // retain async smc runs until they exit

    // Banner-once dedup, persisted so a restart does not re-banner old mail.
    // This app owns notifications (not smc's osascript): banners carry OUR
    // bundle identity, so clicking one opens the inbox -- osascript banners
    // belong to Script Editor and clicking them opened an empty editor.
    let banneredPath = NSString(
        string: "~/.stationmaster-operator/bannered.json").expandingTildeInPath
    var bannered: Set<String> = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        loadBannered()
        NSUserNotificationCenter.default.delegate = self
        statusItem = NSStatusBar.system.statusItem(
            withLength: NSStatusItem.variableLength)
        let menu = NSMenu()
        menu.autoenablesItems = false
        menu.delegate = self
        statusItem.menu = menu
        refresh()
        // Target/selector timer on the main run loop: no Sendable-closure
        // hoops, fires every 10 s. Menu opens also refresh (menuNeedsUpdate).
        // .common mode so ticks also fire while the menu is open
        // (event-tracking mode) -- else the badge freezes during tracking.
        let t = Timer(
            timeInterval: 10, target: self, selector: #selector(timerFired),
            userInfo: nil, repeats: true)
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    @objc func timerFired() { refresh() }

    // ---------------------------------------------------------- notifications

    func loadBannered() {
        guard let data = FileManager.default.contents(atPath: banneredPath),
              let arr = try? JSONSerialization.jsonObject(with: data)
                as? [String] else { return }
        bannered = Set(arr)
    }

    func saveBannered() {
        guard let data = try? JSONSerialization.data(
            withJSONObject: Array(bannered).sorted()) else { return }
        try? data.write(to: URL(fileURLWithPath: banneredPath), options: .atomic)
    }

    /// Post ONE banner covering all not-yet-bannered waiting messages.
    /// Summaries appear only in notification text fields -- never in any
    /// shell/AppleScript string (same rule as menu titles).
    func maybeBanner() {
        guard let status = lastGood else { return }
        let waitingIds = Set(status.waiting.map { $0.id }.filter { !$0.isEmpty })
        let fresh = status.waiting.filter {
            !$0.id.isEmpty && !bannered.contains($0.id) }
        // Prune acked/gone ids so the set cannot grow unboundedly.
        let pruned = bannered.intersection(waitingIds)
        if fresh.isEmpty {
            if pruned != bannered { bannered = pruned; saveBannered() }
            return
        }
        let n = NSUserNotification()
        if fresh.count == 1, let m = fresh.first {
            n.title = "Mail from \(m.fromTeam)"
            n.informativeText = String(m.summary.prefix(140))
        } else {
            n.title = "\(fresh.count) new messages"
            n.informativeText = fresh.map { "\($0.fromTeam): \($0.summary)" }
                .joined(separator: " · ").prefix(140).description
        }
        NSUserNotificationCenter.default.deliver(n)
        bannered = pruned.union(fresh.map { $0.id })
        saveBannered()
    }

    // Show banners even while this (accessory) app is frontmost.
    nonisolated func userNotificationCenter(
        _ center: NSUserNotificationCenter,
        shouldPresent notification: NSUserNotification) -> Bool { true }

    // Clicking a banner opens the inbox in Terminal.
    nonisolated func userNotificationCenter(
        _ center: NSUserNotificationCenter,
        didActivate notification: NSUserNotification) {
        Task { @MainActor in AppDelegate.shared?.openInbox() }
    }

    // ---------------------------------------------------------------- state

    func readStatus() {
        guard FileManager.default.fileExists(atPath: statusPath) else {
            // No status yet (fresh install / state dir wiped): plain envelope.
            statusFileMissing = true
            lastGood = nil
            return
        }
        statusFileMissing = false
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: statusPath))
            guard let obj = try JSONSerialization.jsonObject(with: data)
                    as? [String: Any],
                  let checkedAt = obj["checked_at"] as? String,
                  let waitingRaw = obj["waiting"] as? [[String: Any]]
            else {
                throw NSError(domain: "SMMenuBar", code: 1, userInfo: [
                    NSLocalizedDescriptionKey:
                        "status.json lacks checked_at/waiting"])
            }
            let waiting = waitingRaw.map { w in
                WaitingMessage(
                    id: w["id"] as? String ?? "",
                    fromTeam: w["from_team"] as? String ?? "?",
                    depositedAt: w["deposited_at"] as? String ?? "",
                    summary: w["summary"] as? String ?? "")
            }
            lastGood = SMStatus(checkedAt: checkedAt, waiting: waiting,
                                unseen: obj["unseen"] as? Int ?? 0)
            maybeBanner()
        } catch {
            // Loud in the log, calm in the UI: keep the last good state.
            NSLog("SMMenuBar: malformed status.json, keeping last good state: %@",
                  String(describing: error))
        }
    }

    func refresh() {
        readStatus()
        guard let button = statusItem?.button else { return }
        let waiting = lastGood?.waiting.count ?? 0
        let unseen = lastGood?.unseen ?? 0
        let symbol = unseen > 0 ? "envelope.badge" : "envelope"
        button.image = NSImage(systemSymbolName: symbol,
                               accessibilityDescription: "Stationmaster mail")
        button.imagePosition = .imageLeading
        button.title = waiting > 0 ? " \(waiting)" : ""
    }

    // ---------------------------------------------------------------- menu

    func menuNeedsUpdate(_ menu: NSMenu) {
        refresh()
        menu.removeAllItems()
        let smcInstalled = FileManager.default.isExecutableFile(atPath: smcPath)

        if let st = lastGood {
            menu.addItem(header("\(st.waiting.count) waiting -- checked "
                                + localHHMM(st.checkedAt)))
            for m in st.waiting.prefix(10) {
                let item = NSMenuItem(title: "\(m.fromTeam) -- \(truncate(m.summary))",
                                      action: #selector(openMessage(_:)),
                                      keyEquivalent: "")
                item.target = self
                item.representedObject = m.id
                item.isEnabled = smcInstalled && isHexId(m.id)
                menu.addItem(item)
            }
            if st.waiting.count > 10 {
                menu.addItem(header("... and \(st.waiting.count - 10) more -- smc inbox"))
            }
        } else if statusFileMissing {
            menu.addItem(header("No status yet -- run smc check"))
        } else {
            menu.addItem(header("status.json unreadable -- see log"))
        }

        menu.addItem(.separator())
        if smcInstalled {
            menu.addItem(action("Open message centre", #selector(openInbox)))
            menu.addItem(action("Check now", #selector(checkNow)))
            let ack = action("Ack all", #selector(ackAll))
            ack.isEnabled = (lastGood?.waiting.count ?? 0) > 0
            menu.addItem(ack)
        } else {
            menu.addItem(header("smc missing at ~/.local/bin/smc -- reinstall it"))
        }
        menu.addItem(.separator())
        let quit = NSMenuItem(title: "Quit",
                              action: #selector(NSApplication.terminate(_:)),
                              keyEquivalent: "q")
        quit.target = NSApp
        menu.addItem(quit)
    }

    func header(_ title: String) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        item.isEnabled = false
        return item
    }

    func action(_ title: String, _ sel: Selector) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: sel, keyEquivalent: "")
        item.target = self
        item.isEnabled = true
        return item
    }

    func truncate(_ s: String) -> String {
        s.count > 60 ? String(s.prefix(57)) + "..." : s
    }

    func localHHMM(_ isoUTC: String) -> String {
        let inFmt = DateFormatter()
        inFmt.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
        inFmt.timeZone = TimeZone(identifier: "UTC")
        inFmt.locale = Locale(identifier: "en_US_POSIX")
        guard let date = inFmt.date(from: isoUTC) else { return isoUTC }
        let outFmt = DateFormatter()
        // POSIX locale pins the explicit format against the user's
        // 12/24-hour override (timezone stays local).
        outFmt.locale = Locale(identifier: "en_US_POSIX")
        outFmt.dateFormat = "HH:mm"
        return outFmt.string(from: date)
    }

    func isHexId(_ s: String) -> Bool {
        s.range(of: "^[0-9a-f]{16}$", options: .regularExpression) != nil
    }

    // -------------------------------------------------------------- actions

    @objc func openMessage(_ sender: NSMenuItem) {
        guard let id = sender.representedObject as? String, isHexId(id) else {
            NSLog("SMMenuBar: refusing to open message: id is not 16-hex")
            return
        }
        // id is validated hex, smcPath is a fixed local path -- safe to embed.
        openTerminal(running: "'\(smcPath)' read \(id)")
    }

    @objc func openInbox() {
        openTerminal(running: "'\(smcPath)' inbox")
    }

    @objc func checkNow() {
        runSmcAsync(["check", "--notify"])
    }

    @objc func ackAll() {
        runSmcAsync(["ack", "all"])
    }

    /// Open Terminal running `command` via a temp .command file. Only ever
    /// called with the fixed smc path + a validated hex id -- never message text.
    func openTerminal(running command: String) {
        let script = "#!/bin/bash\nclear\n" + command + "\n"
        // Fixed filename, overwritten per click: at most one temp file ever
        // exists (Terminal reads it at open; a later overwrite is fine).
        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent("sm-open.command")
        do {
            try script.write(to: file, atomically: true, encoding: .utf8)
            try FileManager.default.setAttributes(
                [.posixPermissions: 0o755], ofItemAtPath: file.path)
            let p = Process()
            p.executableURL = URL(fileURLWithPath: "/usr/bin/open")
            p.arguments = ["-a", "Terminal", file.path]
            try p.run()
        } catch {
            NSLog("SMMenuBar: failed to open Terminal: %@",
                  String(describing: error))
        }
    }

    /// Run smc asynchronously; re-read status.json when it exits.
    func runSmcAsync(_ args: [String]) {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: smcPath)
        p.arguments = args
        p.terminationHandler = { _ in
            DispatchQueue.main.async {
                AppDelegate.shared?.runningProcs.removeAll { !$0.isRunning }
                AppDelegate.shared?.refresh()
            }
        }
        do {
            try p.run()
            runningProcs.append(p)
        } catch {
            NSLog("SMMenuBar: failed to run smc %@: %@",
                  args.joined(separator: " "), String(describing: error))
        }
    }
}
