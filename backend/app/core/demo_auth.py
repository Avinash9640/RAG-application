from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status


@dataclass(frozen=True)
class CurrentActor:
    email: str
    role: str


def get_current_actor(
    x_demo_role: str = Header("User"),
    x_demo_user: str = Header("anonymous@rag.local"),
) -> CurrentActor:
    """Temporary development identity boundary.

    Replace this dependency with validated identity-provider claims before
    production. It deliberately never defaults a caller to Admin.
    """
    if x_demo_role not in {"User", "Admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role.")
    return CurrentActor(email=x_demo_user[:255], role=x_demo_role)


def require_admin(actor: CurrentActor = Depends(get_current_actor)) -> CurrentActor:
    if actor.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    return actor
