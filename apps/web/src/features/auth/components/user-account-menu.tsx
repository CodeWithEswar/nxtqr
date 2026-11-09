"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from "@nxtqr/ui";
import { UserIcon, FolderIcon, BookOpenIcon, LogOutIcon } from "@nxtqr/icons";
import { getCurrentUserProfile, type UserProfile } from "@/features/profiles";
import { signOutUser } from "../services/auth-service";
import { toast } from "sonner";

export function UserAccountMenu() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    getCurrentUserProfile().then((p) => {
      if (mounted) setProfile(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      toast.info("Signed out of NXTQR Studio.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = profile?.displayName || "Studio Engineer";
  const email = profile?.email || "engineer@nxtqr.dev";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="h-8 w-8 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-foreground p-0 overflow-hidden shadow-level-1 focus-visible:ring-1 focus-visible:ring-border-strong focus-visible:outline-none"
          aria-label="User account menu"
        >
          <Avatar className="h-7 w-7 rounded-sm">
            {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-surface-03 text-text-muted text-[11px] font-mono font-medium">
              {initials || <UserIcon className="h-3.5 w-3.5" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-md border border-border-default bg-surface-02 text-foreground shadow-level-2 p-1.5 font-sans"
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-[11px] font-mono text-text-muted truncate">{email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border-subtle my-1" />

        <DropdownMenuItem asChild className="text-xs gap-2 cursor-pointer focus:bg-surface-03 focus:text-foreground">
          <Link href="/workspace/projects">
            <FolderIcon className="h-3.5 w-3.5 text-text-muted" />
            <span>Workspace Projects</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-xs gap-2 cursor-pointer focus:bg-surface-03 focus:text-foreground">
          <Link href="/docs">
            <BookOpenIcon className="h-3.5 w-3.5 text-text-muted" />
            <span>Documentation</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border-subtle my-1" />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOutIcon className="h-3.5 w-3.5 text-destructive" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

