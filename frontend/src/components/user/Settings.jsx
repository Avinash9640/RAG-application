import { useEffect, useState } from "react";
import { CheckIcon, SettingsIcon } from "../common/Icons";


export default function Settings({ user }) {
    const [theme, setTheme] = useState("light");
    const [citations, setCitations] = useState(true);
    const [enterToSend, setEnterToSend] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const settings = JSON.parse(localStorage.getItem("rag-user-settings") || "{}");
            setTheme(settings.theme || "light");
            setCitations(settings.citations ?? true);
            setEnterToSend(settings.enterToSend ?? true);
        } catch {
            // Keep safe defaults when local storage contains invalid data.
        }
    }, []);

    const saveSettings = () => {
        localStorage.setItem("rag-user-settings", JSON.stringify({
            theme,
            citations,
            enterToSend,
        }));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="settings-page">
            <div className="page-heading">
                <h1>Settings</h1>
                <p>Configure your RAG Assistant preferences.</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h2>Application settings</h2>
                        <p>Preferences for this browser and workspace.</p>
                    </div>
                    <div className="settings-header-icon"><SettingsIcon size={20} /></div>
                </div>

                <div className="preference-row">
                    <div><strong>Theme</strong><span>Choose the workspace appearance.</span></div>
                    <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </div>

                <div className="preference-row">
                    <div><strong>Show source citations</strong><span>Show sources below assistant answers.</span></div>
                    <button type="button" aria-label="Toggle citations"
                        className={`toggle ${citations ? "on" : ""}`}
                        onClick={() => setCitations((value) => !value)}><span /></button>
                </div>

                <div className="preference-row">
                    <div><strong>Enter to send</strong><span>Press Enter to submit chat messages.</span></div>
                    <button type="button" aria-label="Toggle enter to send"
                        className={`toggle ${enterToSend ? "on" : ""}`}
                        onClick={() => setEnterToSend((value) => !value)}><span /></button>
                </div>

                <div className="preference-row">
                    <div><strong>Role</strong><span>Assigned by your organization.</span></div>
                    <span className="role-badge">{user?.role || "User"}</span>
                </div>

                <div className="settings-footer">
                    <div className="save-success" aria-live="polite">
                        {saved && <><CheckIcon size={15} /> Settings saved</>}
                    </div>
                    <button type="button" className="primary-button" onClick={saveSettings}>Save settings</button>
                </div>
            </div>
        </div>
    );
}
