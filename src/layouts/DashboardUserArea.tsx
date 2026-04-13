import axios from "axios";
import { ChevronUp, LogOut, UserRound } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import { ProfilePhotoSlot } from "@/components/ProfilePhotoSlot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/modules/auth/AuthContext";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";
import type { EmployeeProfile } from "@/modules/directory/types";
import { cn } from "@/lib/utils";

function profileErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  }
  return String(err);
}

function AccountProfileDetails({ profile }: { profile: EmployeeProfile }) {
  return (
    <dl className="grid gap-2 text-xs sm:grid-cols-2">
      <ProfileRow label="Employee #" value={profile.employee_number} />
      <ProfileRow label="Department" value={profile.department ?? "—"} />
      <ProfileRow label="Title" value={profile.title ?? "—"} />
      <ProfileRow label="Role" value={profile.directory_role} />
      <ProfileRow label="Company" value={profile.company_key} />
      <ProfileRow label="Location" value={profile.location ?? "—"} />
      <ProfileRow
        label="Manager"
        value={
          profile.manager
            ? `${profile.manager.full_name} (${profile.manager.employee_number})`
            : "—"
        }
      />
    </dl>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </div>
  );
}

function AccountLogoutSection({
  onAfterLogout,
  buttonClassName,
}: {
  onAfterLogout?: () => void;
  buttonClassName?: string;
}) {
  const { logout, logoutAllDevices, isLoggingOut } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("w-full justify-center gap-2", buttonClassName)}
        onClick={() => {
          void logout().finally(() => onAfterLogout?.());
        }}
        disabled={isLoggingOut}
      >
        <LogOut className="size-3.5" />
        {isLoggingOut ? "Signing out…" : "Log out"}
      </Button>
      <ConfirmActionDialog
        triggerText="Log out everywhere"
        title="Log out from all devices?"
        description="This will end your active sessions on every device."
        confirmText="Confirm"
        pending={isLoggingOut}
        onConfirm={async () => {
          await logoutAllDevices();
          onAfterLogout?.();
        }}
        variant="destructive"
      />
    </div>
  );
}

function useAccountDisplay() {
  const { session } = useAuth();
  const profileQuery = useDirectoryProfile();
  const email = session?.user.email ?? "";

  const displayName = profileQuery.data?.full_name?.trim() || email || "Account";
  const subtitle =
    profileQuery.data?.employee_number ??
    session?.user.employee_number ??
    (profileQuery.isLoading ? "Loading profile…" : "—");

  const avatarUrl = profileQuery.data?.avatar_url ?? null;

  return { profileQuery, displayName, subtitle, avatarUrl, email };
}

/** Sidebar bottom: opens upward with directory profile + sign out (desktop). */
export function DashboardSidebarAccountBlock() {
  const { profileQuery, displayName, subtitle, avatarUrl, email } = useAccountDisplay();

  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={cn(
          "group flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
        )}
      >
        <ProfilePhotoSlot
          size="sm"
          src={avatarUrl}
          alt={displayName}
          className="ring-sidebar-border"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{displayName}</p>
          <p className="truncate text-xs text-sidebar-foreground/75">{subtitle}</p>
        </div>
        <ChevronUp
          className="size-4 shrink-0 opacity-60 transition-transform group-data-[popup-open]:rotate-180"
          aria-hidden
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={8} className="z-[100]">
          <Popover.Popup className="w-[min(calc(100vw-2rem),18rem)] max-h-[min(70vh,22rem)] origin-bottom overflow-y-auto rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg outline-none">
            <Popover.Title className="sr-only">Account</Popover.Title>
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <ProfilePhotoSlot
                size="md"
                src={avatarUrl}
                alt={displayName}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="py-3">
              {profileQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading directory profile…</p>
              ) : profileQuery.isError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                  <p className="font-medium">Profile unavailable</p>
                  <p className="mt-0.5 opacity-90">{profileErrorMessage(profileQuery.error)}</p>
                </div>
              ) : profileQuery.data ? (
                <Card className="border-border/80 bg-muted/20 py-3 shadow-none ring-1 ring-border/60">
                  <CardContent className="px-3 py-0">
                    <AccountProfileDetails profile={profileQuery.data} />
                  </CardContent>
                </Card>
              ) : null}
            </div>
            <Separator className="bg-border" />
            <div className="pt-3">
              <AccountLogoutSection />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Mobile header: sheet from the right with the same account content. */
export function DashboardMobileAccountSheet() {
  const { profileQuery, displayName, subtitle, avatarUrl, email } = useAccountDisplay();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="icon" aria-label="Open account menu" />
        }
      >
        <UserRound className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full min-h-0 w-[min(100vw-1rem,20rem)] flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border text-left">
          <div className="flex items-start gap-3">
            <ProfilePhotoSlot size="md" src={avatarUrl} alt={displayName} />
            <div className="min-w-0 flex-1 pt-0.5">
              <SheetTitle className="truncate">{displayName}</SheetTitle>
              <SheetDescription className="truncate">{email}</SheetDescription>
              <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {profileQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading directory profile…</p>
          ) : profileQuery.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">Profile unavailable</p>
              <p className="mt-1 text-xs opacity-90">{profileErrorMessage(profileQuery.error)}</p>
            </div>
          ) : profileQuery.data ? (
            <Card className="border-border/80 bg-muted/20 py-3 shadow-none ring-1 ring-border/60">
              <CardContent className="px-3 py-0">
                <AccountProfileDetails profile={profileQuery.data} />
              </CardContent>
            </Card>
          ) : null}
        </div>
        <div className="border-t border-border p-4">
          <AccountLogoutSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
