import React, { useState } from "react";
import {
    SparklesIcon,
    UserIcon,
    SettingsIcon,
} from "../components/common/Icons";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const login = (role) => {
        const user = {
            email: email || (role === "Admin" ? "admin@rag.local" : "user@rag.local"),
            name: role === "Admin" ? "Admin User" : "Avinash",
            role,
        };

        onLogin?.(user);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        login("User");
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-glow login-glow-one" />
                <div className="login-glow login-glow-two" />
            </div>

            <div className="login-container">
                <div className="login-brand">
                    <div className="login-brand-mark">
                        <SparklesIcon size={22} />
                    </div>

                    <div>
                        <strong>RAG Studio</strong>
                        <span>Knowledge Assistant</span>
                    </div>
                </div>

                <div className="login-card">
                    <div className="login-card-header">
                        <div className="login-icon">
                            <SparklesIcon size={21} />
                        </div>

                        <h1>Welcome back</h1>

                        <p>
                            Sign in to access your organization's
                            knowledge assistant.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-field">
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                        </div>

                        <div className="login-field">
                            <div className="login-label-row">
                                <label htmlFor="password">Password</label>

                                <button
                                    type="button"
                                    className="forgot-password"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                        >
                            Sign in
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>Development mode</span>
                    </div>

                    <div className="development-login">
                        <button
                            type="button"
                            className="development-button"
                            onClick={() => login("User")}
                        >
                            <div className="development-icon">
                                <UserIcon size={17} />
                            </div>

                            <div>
                                <strong>Open User Workspace</strong>
                                <span>Standard knowledge access</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="development-button"
                            onClick={() => login("Admin")}
                        >
                            <div className="development-icon">
                                <SettingsIcon size={17} />
                            </div>

                            <div>
                                <strong>Open Admin Workspace</strong>
                                <span>Knowledge management access</span>
                            </div>
                        </button>
                    </div>

                    <p className="login-development-note">
                        Authentication will be connected to the backend
                        later. These buttons are for UI development only.
                    </p>
                </div>

                <div className="login-footer">
                    <span>RAG Studio</span>
                    <span>•</span>
                    <span>Enterprise Knowledge Assistant</span>
                </div>
            </div>
        </div>
    );
}