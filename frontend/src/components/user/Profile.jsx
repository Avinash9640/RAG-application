import { UserIcon } from "../common/Icons";


export default function Profile({ user }) {
    const role = user?.role || "User";
    const email = user?.email || "user@company.com";
    const isAdmin = role === "Admin";
    const initial = email.charAt(0).toUpperCase();

    return (
        <div className="profile-page">
            <div className="page-heading">
                <h1>Profile</h1>
                <p>Your RAG Assistant account and access level.</p>
            </div>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-large-avatar">{initial}</div>
                    <div>
                        <h2>{isAdmin ? "Administrator" : "Workspace user"}</h2>
                        <p>{email}</p>
                    </div>
                </div>
                <div className="profile-details">
                    <div className="profile-detail"><span>Account type</span><strong>{role}</strong></div>
                    <div className="profile-detail"><span>Knowledge access</span><strong>{isAdmin ? "Manage and search" : "Search authorized documents"}</strong></div>
                    <div className="profile-detail"><span>Status</span><strong className="active-account">Active</strong></div>
                    <div className="profile-detail"><span>Identity</span><strong><UserIcon size={14} /> Demo account</strong></div>
                </div>
            </div>
        </div>
    );
}
