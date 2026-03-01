"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { User, Lock, Globe } from "lucide-react"

export function SettingsContent() {
  const { user, updateProfile, updatePassword, logout } = useAuth()

  const [name, setName] = useState(user?.name || "")
  const [timezone, setTimezone] = useState(user?.timezone || "")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setIsProfileLoading(true)
    try {
      const updated = await updateProfile({ name: name.trim(), timezone })
      if (updated) {
        toast.success("Profile updated!")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred while updating profile")
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setIsPasswordLoading(true)
    try {
      const success = await updatePassword(oldPassword, newPassword)
      if (success) {
        toast.success("Password changed!")
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error("Current password is incorrect")
      }
    } catch (error) {
      toast.error("An error occurred while changing password")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("An error occurred while signing out")
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        Settings
      </h1>

      {/* Profile */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Update your name and timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Globe className="size-3.5 text-muted-foreground" />
                <Label htmlFor="timezone">Timezone</Label>
              </div>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York"
              />
            </div>
            <Button type="submit" className="self-start" disabled={isProfileLoading}>
              {isProfileLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="oldPwd">Current Password</Label>
              <Input
                id="oldPwd"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPwd">New Password</Label>
              <Input
                id="newPwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPwd">Confirm New Password</Label>
              <Input
                id="confirmPwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="self-start" disabled={isPasswordLoading}>
              {isPasswordLoading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Account Actions */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
