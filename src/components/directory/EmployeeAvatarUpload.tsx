import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ProfilePhotoSlot } from "@/components/ProfilePhotoSlot";
import { Button } from "@/components/ui/button";
import { uploadEmployeeAvatar } from "@/modules/directory/api/directoryApi";

type EmployeeAvatarUploadProps = {
  employeeNumber: string;
  fullName: string;
  /** Stored path or legacy absolute URL */
  value: string;
  onChange: (avatarUrl: string) => void;
  disabled?: boolean;
};

export function EmployeeAvatarUpload({
  employeeNumber,
  fullName,
  value,
  onChange,
  disabled,
}: EmployeeAvatarUploadProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setPending(true);
    try {
      const data = await uploadEmployeeAvatar(employeeNumber, file);
      onChange(data.avatar_url);
      toast.success("Photo uploaded", {
        description: "The profile picture was saved. Submit the form if you have other unsaved changes.",
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employee", employeeNumber] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="text-sm font-medium text-foreground">Profile photo</label>
      <div className="flex flex-wrap items-start gap-4">
        <ProfilePhotoSlot
          size="lg"
          src={value}
          alt={fullName.trim() ? `Profile photo of ${fullName}` : "Profile photo"}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
            aria-label="Choose profile image file"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={disabled || pending}
          >
            {pending ? "Uploading…" : value.trim() ? "Replace photo" : "Upload photo"}
          </Button>
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF. Max 3&nbsp;MB. Upload replaces the current picture immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
