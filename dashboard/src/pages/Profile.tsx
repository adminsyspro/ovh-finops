import { useEffect, useState } from "react"
import { useLanguage } from "@/context/LanguageProvider"
import { useAuthProfile, useUpdateAuthProfile } from "@/hooks/queries"
import { SectionCard } from "@/components/SectionCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export function Profile() {
  const { t } = useLanguage()
  const profile = useAuthProfile()
  const updateProfile = useUpdateAuthProfile()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name ?? "")
      setEmail(profile.data.email ?? "")
    }
  }, [profile.data])

  if (profile.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateProfile.mutate(
      {
        name,
        email,
        ...(password ? { password } : {}),
      },
      { onSuccess: () => setPassword("") },
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <SectionCard title={t("profile")}>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="username">{t("username")}</label>
            <Input id="username" value={profile.data.username} disabled />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="name">{t("name")}</label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="email">{t("email")}</label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="password">{t("newPassword")}</label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3">
            {updateProfile.isError && <p className="text-sm text-destructive">{t("saveError")}</p>}
            {updateProfile.isSuccess && <p className="text-sm text-green-600">{t("saved")}</p>}
            <Button type="submit" disabled={updateProfile.isPending}>{t("save")}</Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
