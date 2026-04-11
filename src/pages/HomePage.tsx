import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/modules/auth/AuthContext";

export function HomePage() {
  const { session, logout, logoutAllDevices, isLoggingOut } = useAuth();
  const username = session?.user.email ?? "User";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{username} has logged in</h1>
        <ModeToggle />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => void logout()} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout this device"}
        </Button>
        <ConfirmActionDialog
          triggerText="Logout all devices"
          title="Logout from all devices?"
          description="This will end your active sessions on every device."
          confirmText="Confirm logout"
          pending={isLoggingOut}
          onConfirm={logoutAllDevices}
          variant="destructive"
        />
      </div>
    </main>
  );
}
