import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
import { useLanguage } from "@/context/LanguageProvider"
import { useCreateLocalUser, useDeleteLocalUser, useLocalUsers } from "@/hooks/queries"
import { type LocalUser } from "@/services/api"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function Users() {
  const { t } = useLanguage()
  const users = useLocalUsers()
  const createUser = useCreateLocalUser()
  const deleteUser = useDeleteLocalUser()
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const columns: ColumnDef<LocalUser>[] = [
    { accessorKey: "username", header: t("username") },
    { accessorKey: "name", header: t("name") },
    { id: "email", header: t("email"), accessorFn: (row) => row.email ?? "—" },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => <Badge variant="secondary" className="rounded-md">{row.original.role}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("delete")}
            onClick={(event) => {
              event.stopPropagation()
              deleteUser.mutate(row.original.username)
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ]

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createUser.mutate(
      { username, name, email, password, role: "admin" },
      {
        onSuccess: () => {
          setUsername("")
          setName("")
          setEmail("")
          setPassword("")
        },
      },
    )
  }

  if (users.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (users.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t("createUser")}>
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={onSubmit}>
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t("username")} required />
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("name")} />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("email")} type="email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("password")} type="password" required />
          <Button type="submit" disabled={createUser.isPending}>{t("create")}</Button>
        </form>
        {createUser.isError && <p className="mt-3 text-sm text-destructive">{t("saveError")}</p>}
      </SectionCard>

      <SectionCard title={t("users")}>
        <DataTable<LocalUser, unknown>
          columns={columns}
          data={users.data ?? []}
          searchPlaceholder={t("users")}
        />
      </SectionCard>
    </div>
  )
}
