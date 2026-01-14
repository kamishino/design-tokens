import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Icons } from "@shared/components/Icons";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  // Get user display name or email
  const displayName = user.user_metadata?.full_name || user.email || "User";
  const email = user.email || "";

  // Get first letter for avatar
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary d-flex align-items-center gap-2"
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {/* Avatar */}
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
          style={{ width: "32px", height: "32px", fontSize: "14px" }}
        >
          {avatarLetter}
        </div>
        <span className="d-none d-md-inline">{displayName}</span>
        <i className={Icons.CHEVRON_DOWN}></i>
      </button>

      {showDropdown && (
        <div
          className="dropdown-menu dropdown-menu-end show"
          style={{ minWidth: "250px" }}
        >
          {/* User Info */}
          <div className="dropdown-header">
            <div className="fw-bold">{displayName}</div>
            <div className="small text-muted">{email}</div>
          </div>

          <div className="dropdown-divider"></div>

          {/* User ID (for debugging) */}
          <div className="dropdown-item-text">
            <div className="small text-muted">User ID</div>
            <div className="font-monospace small text-truncate" title={user.id}>
              {user.id.substring(0, 20)}...
            </div>
          </div>

          <div className="dropdown-divider"></div>

          {/* Sign Out */}
          <button
            className="dropdown-item text-danger"
            onClick={handleSignOut}
          >
            <i className={Icons.CANCEL}></i> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

