"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  getMe,
  updateMyProfile,
  uploadMyProfileImage,
} from "@/src/services/api/user.api";
import { useSession } from "@/src/context/SessionContext";
import type { SessionUser } from "@/src/types/auth.types";

export default function ProfilePage() {
  const { refetch } = useSession();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImage: "",
  });
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);

  const buildFormState = (u: SessionUser) => ({
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    email: u.email ?? "",
    profileImage: u.profilePicture ?? "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
        setForm(buildFormState(data));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleFormChange =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const currentImagePreview = useMemo(
    () => localImagePreview || form.profileImage || "",
    [localImagePreview, form.profileImage]
  );

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setImageError("Image size must be 10MB or less.");
      return;
    }

    const tempPreviewUrl = URL.createObjectURL(selectedFile);
    setLocalImagePreview(tempPreviewUrl);
    setImageError(null);
    setError(null);
    setSuccessMessage(null);

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadMyProfileImage(selectedFile);
      setForm((prev) => ({ ...prev, profileImage: uploadedUrl }));
      setLocalImagePreview(null);
      URL.revokeObjectURL(tempPreviewUrl);
    } catch (err: unknown) {
      setLocalImagePreview(null);
      URL.revokeObjectURL(tempPreviewUrl);
      setImageError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setForm(buildFormState(user));
    }
    setLocalImagePreview(null);
    setImageError(null);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      const updated = await updateMyProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        profileImage: form.profileImage.trim(),
      });
      setUser(updated);
      setForm(buildFormState(updated));
      setLocalImagePreview(null);
      await refetch();
      setSuccessMessage("Profile updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Loading profile…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-theme-sm text-error-500">{error}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit profile
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving || isUploadingImage}
              className="rounded-lg border border-brand-300 bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 dark:border-brand-700"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        {successMessage ? (
          <div className="mb-4 rounded-lg border border-success-200 bg-success-50 p-3 text-theme-sm text-success-700 dark:border-success-900 dark:bg-success-950/30 dark:text-success-300">
            {successMessage}
          </div>
        ) : null}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Profile photo
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
                {currentImagePreview ? (
                  <img
                    src={currentImagePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-500 dark:text-gray-400">
                    {(form.firstName?.[0] || form.email?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="profile-image-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {isUploadingImage
                    ? "Uploading image..."
                    : form.profileImage
                      ? "Change photo"
                      : "Upload photo"}
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, or WEBP up to 10MB.
                </p>
              </div>
            </div>
            {imageError ? (
              <p className="mt-3 text-theme-sm text-error-500">{imageError}</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Email</p>
            <input
              type="email"
              value={form.email}
              onChange={handleFormChange("email")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">First name</p>
            <input
              type="text"
              value={form.firstName}
              onChange={handleFormChange("firstName")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Last name</p>
            <input
              type="text"
              value={form.lastName}
              onChange={handleFormChange("lastName")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
