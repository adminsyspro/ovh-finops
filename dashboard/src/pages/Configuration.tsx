import { useEffect, useMemo, useState, type FormEvent } from "react"
import { KeyRound, LockKeyhole, Save, ShieldCheck } from "lucide-react"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useLdapSettings,
  useSsoSettings,
  useUpdateLdapSettings,
  useUpdateSsoSettings,
} from "@/hooks/queries"
import { type LdapSettings, type SsoSettings } from "@/services/api"
import { SectionCard } from "@/components/SectionCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const inputGroup = "grid gap-2"
const labelClass = "text-sm font-medium"
const checkboxClass = "size-4 rounded border-border accent-primary"
const textareaClass = "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const emptyLdap: LdapSettings = {
  enabled: false,
  url: "",
  baseDN: "",
  bindDN: "",
  bindPassword: "",
  hasBindPassword: false,
  userFilter: "(uid={{username}})",
  adminGroup: "",
  operatorGroup: "",
  tlsRejectUnauthorized: true,
}

const emptySso: SsoSettings = {
  enabled: false,
  protocol: "oidc",
  providerName: "SSO",
  appBaseUrl: "",
  showLocalLogin: true,
  forceSsoRedirect: false,
  autoProvision: true,
  defaultRole: "viewer",
  oidcIssuerUrl: "",
  oidcClientId: "",
  oidcClientSecret: "",
  hasOidcClientSecret: false,
  oidcScopes: "openid profile email",
  oidcClaimEmail: "email",
  oidcClaimName: "name",
  oidcClaimGroups: "groups",
  oidcAdminGroup: "",
  samlEntryPoint: "",
  samlIssuer: "",
  samlCertificate: "",
  samlCallbackUrl: "",
  samlLogoutUrl: "",
  samlNameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
}

function mutationError(error: unknown, fallback: string) {
  const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
  return responseError || fallback
}

function SettingToggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
      <input
        id={id}
        type="checkbox"
        className={checkboxClass}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

export function Configuration() {
  const { t } = useLanguage()
  const ldap = useLdapSettings()
  const sso = useSsoSettings()
  const saveLdap = useUpdateLdapSettings()
  const saveSso = useUpdateSsoSettings()
  const [ldapForm, setLdapForm] = useState<LdapSettings>(emptyLdap)
  const [ssoForm, setSsoForm] = useState<SsoSettings>(emptySso)

  const browserOrigin = useMemo(() => {
    if (typeof window === "undefined") return ""
    return window.location.origin
  }, [])

  useEffect(() => {
    if (ldap.data) setLdapForm({ ...ldap.data, bindPassword: "" })
  }, [ldap.data])

  useEffect(() => {
    if (sso.data) setSsoForm({ ...sso.data, oidcClientSecret: "" })
  }, [sso.data])

  if (ldap.isLoading || sso.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    )
  }

  if (ldap.isError || sso.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const onLdapSubmit = (event: FormEvent) => {
    event.preventDefault()
    saveLdap.mutate(ldapForm, {
      onSuccess: (data) => setLdapForm({ ...data, bindPassword: "" }),
    })
  }

  const onSsoSubmit = (event: FormEvent) => {
    event.preventDefault()
    saveSso.mutate(ssoForm, {
      onSuccess: (data) => setSsoForm({ ...data, oidcClientSecret: "" }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title={t("ldapAuthentication")}
          actions={<Badge variant={ldapForm.enabled ? "default" : "secondary"}>{ldapForm.enabled ? t("active") : t("inactive")}</Badge>}
        >
          <div className="flex items-start gap-4 pt-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("ldapHelp")}</p>
              {ldapForm.hasBindPassword && <p className="text-xs font-medium text-green-600">{t("secretAlreadyConfigured")}</p>}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("ssoAuthentication")}
          actions={<Badge variant={ssoForm.enabled ? "default" : "secondary"}>{ssoForm.enabled ? t("active") : t("inactive")}</Badge>}
        >
          <div className="flex items-start gap-4 pt-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LockKeyhole className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("ssoHelp")}</p>
              {ssoForm.hasOidcClientSecret && <p className="text-xs font-medium text-green-600">{t("secretAlreadyConfigured")}</p>}
            </div>
          </div>
        </SectionCard>
      </div>

      <Tabs defaultValue="ldap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ldap">
            <ShieldCheck className="size-4" />
            LDAP
          </TabsTrigger>
          <TabsTrigger value="sso">
            <KeyRound className="size-4" />
            OIDC/SAML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ldap">
          <SectionCard title={t("ldapSettings")}>
            <form className="grid gap-5 pt-4" onSubmit={onLdapSubmit}>
              <SettingToggle
                id="ldap-enabled"
                checked={ldapForm.enabled}
                onChange={(enabled) => setLdapForm((current) => ({ ...current, enabled }))}
                label={t("enableLdap")}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-url">{t("ldapUrl")}</label>
                  <Input
                    id="ldap-url"
                    value={ldapForm.url}
                    onChange={(event) => setLdapForm((current) => ({ ...current, url: event.target.value }))}
                    placeholder="ldaps://ldap.example.com:636"
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-base-dn">{t("ldapBaseDn")}</label>
                  <Input
                    id="ldap-base-dn"
                    value={ldapForm.baseDN}
                    onChange={(event) => setLdapForm((current) => ({ ...current, baseDN: event.target.value }))}
                    placeholder="dc=example,dc=com"
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-bind-dn">{t("ldapBindDn")}</label>
                  <Input
                    id="ldap-bind-dn"
                    value={ldapForm.bindDN}
                    onChange={(event) => setLdapForm((current) => ({ ...current, bindDN: event.target.value }))}
                    placeholder="cn=readonly,dc=example,dc=com"
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-bind-password">{t("ldapBindPassword")}</label>
                  <Input
                    id="ldap-bind-password"
                    type="password"
                    value={ldapForm.bindPassword}
                    onChange={(event) => setLdapForm((current) => ({ ...current, bindPassword: event.target.value }))}
                    placeholder={ldapForm.hasBindPassword ? t("keepCurrentSecret") : ""}
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-user-filter">{t("ldapUserFilter")}</label>
                  <Input
                    id="ldap-user-filter"
                    value={ldapForm.userFilter}
                    onChange={(event) => setLdapForm((current) => ({ ...current, userFilter: event.target.value }))}
                    placeholder="(uid={{username}})"
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-admin-group">{t("ldapAdminGroup")}</label>
                  <Input
                    id="ldap-admin-group"
                    value={ldapForm.adminGroup}
                    onChange={(event) => setLdapForm((current) => ({ ...current, adminGroup: event.target.value }))}
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="ldap-operator-group">{t("ldapOperatorGroup")}</label>
                  <Input
                    id="ldap-operator-group"
                    value={ldapForm.operatorGroup}
                    onChange={(event) => setLdapForm((current) => ({ ...current, operatorGroup: event.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <SettingToggle
                    id="ldap-tls"
                    checked={ldapForm.tlsRejectUnauthorized}
                    onChange={(tlsRejectUnauthorized) => setLdapForm((current) => ({ ...current, tlsRejectUnauthorized }))}
                    label={t("verifyTlsCertificate")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {saveLdap.isError && <p className="text-sm text-destructive">{mutationError(saveLdap.error, t("saveError"))}</p>}
                {saveLdap.isSuccess && <p className="text-sm text-green-600">{t("saved")}</p>}
                <Button type="submit" disabled={saveLdap.isPending}>
                  <Save className="size-4" />
                  {t("save")}
                </Button>
              </div>
            </form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="sso">
          <SectionCard title={t("ssoSettings")}>
            <form className="grid gap-5 pt-4" onSubmit={onSsoSubmit}>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <SettingToggle
                  id="sso-enabled"
                  checked={ssoForm.enabled}
                  onChange={(enabled) => setSsoForm((current) => ({ ...current, enabled }))}
                  label={t("enableSso")}
                />
                <div className="inline-flex rounded-lg bg-muted p-1">
                  {(["oidc", "saml"] as const).map((protocol) => (
                    <button
                      key={protocol}
                      type="button"
                      className={`h-8 rounded-md px-4 text-sm font-medium transition ${ssoForm.protocol === protocol ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setSsoForm((current) => ({ ...current, protocol }))}
                    >
                      {protocol.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="sso-provider">{t("providerName")}</label>
                  <Input
                    id="sso-provider"
                    value={ssoForm.providerName}
                    onChange={(event) => setSsoForm((current) => ({ ...current, providerName: event.target.value }))}
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="sso-base-url">{t("appBaseUrl")}</label>
                  <Input
                    id="sso-base-url"
                    value={ssoForm.appBaseUrl}
                    onChange={(event) => setSsoForm((current) => ({ ...current, appBaseUrl: event.target.value }))}
                    placeholder={browserOrigin}
                  />
                </div>
                <div className={inputGroup}>
                  <label className={labelClass} htmlFor="default-role">{t("defaultRole")}</label>
                  <select
                    id="default-role"
                    className={selectClass}
                    value={ssoForm.defaultRole}
                    onChange={(event) => setSsoForm((current) => ({ ...current, defaultRole: event.target.value }))}
                  >
                    <option value="viewer">{t("roleViewer")}</option>
                    <option value="operator">{t("roleOperator")}</option>
                    <option value="admin">{t("roleAdmin")}</option>
                  </select>
                </div>
              </div>

              {ssoForm.protocol === "oidc" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-issuer">{t("oidcIssuerUrl")}</label>
                    <Input
                      id="oidc-issuer"
                      value={ssoForm.oidcIssuerUrl}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcIssuerUrl: event.target.value }))}
                      placeholder="https://auth.example.com/realms/main"
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-client-id">{t("oidcClientId")}</label>
                    <Input
                      id="oidc-client-id"
                      value={ssoForm.oidcClientId}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcClientId: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-client-secret">{t("oidcClientSecret")}</label>
                    <Input
                      id="oidc-client-secret"
                      type="password"
                      value={ssoForm.oidcClientSecret}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcClientSecret: event.target.value }))}
                      placeholder={ssoForm.hasOidcClientSecret ? t("keepCurrentSecret") : ""}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-scopes">{t("oidcScopes")}</label>
                    <Input
                      id="oidc-scopes"
                      value={ssoForm.oidcScopes}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcScopes: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-claim-email">{t("oidcClaimEmail")}</label>
                    <Input
                      id="oidc-claim-email"
                      value={ssoForm.oidcClaimEmail}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcClaimEmail: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-claim-name">{t("oidcClaimName")}</label>
                    <Input
                      id="oidc-claim-name"
                      value={ssoForm.oidcClaimName}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcClaimName: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-claim-groups">{t("oidcClaimGroups")}</label>
                    <Input
                      id="oidc-claim-groups"
                      value={ssoForm.oidcClaimGroups}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcClaimGroups: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="oidc-admin-group">{t("oidcAdminGroup")}</label>
                    <Input
                      id="oidc-admin-group"
                      value={ssoForm.oidcAdminGroup}
                      onChange={(event) => setSsoForm((current) => ({ ...current, oidcAdminGroup: event.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="saml-entry-point">{t("samlEntryPoint")}</label>
                    <Input
                      id="saml-entry-point"
                      value={ssoForm.samlEntryPoint}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlEntryPoint: event.target.value }))}
                      placeholder="https://idp.example.com/sso"
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="saml-issuer">{t("samlIssuer")}</label>
                    <Input
                      id="saml-issuer"
                      value={ssoForm.samlIssuer}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlIssuer: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="saml-callback">{t("samlCallbackUrl")}</label>
                    <Input
                      id="saml-callback"
                      value={ssoForm.samlCallbackUrl}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlCallbackUrl: event.target.value }))}
                      placeholder={`${ssoForm.appBaseUrl || browserOrigin}/auth/saml/callback`}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="saml-logout">{t("samlLogoutUrl")}</label>
                    <Input
                      id="saml-logout"
                      value={ssoForm.samlLogoutUrl}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlLogoutUrl: event.target.value }))}
                    />
                  </div>
                  <div className={inputGroup}>
                    <label className={labelClass} htmlFor="saml-nameid">{t("samlNameIdFormat")}</label>
                    <Input
                      id="saml-nameid"
                      value={ssoForm.samlNameIdFormat}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlNameIdFormat: event.target.value }))}
                    />
                  </div>
                  <div className={`${inputGroup} lg:row-span-2`}>
                    <label className={labelClass} htmlFor="saml-certificate">{t("samlCertificate")}</label>
                    <textarea
                      id="saml-certificate"
                      className={textareaClass}
                      value={ssoForm.samlCertificate}
                      onChange={(event) => setSsoForm((current) => ({ ...current, samlCertificate: event.target.value }))}
                      placeholder="-----BEGIN CERTIFICATE-----"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <SettingToggle
                  id="sso-local-login"
                  checked={ssoForm.showLocalLogin}
                  onChange={(showLocalLogin) => setSsoForm((current) => ({ ...current, showLocalLogin }))}
                  label={t("showLocalLogin")}
                />
                <SettingToggle
                  id="sso-force-redirect"
                  checked={ssoForm.forceSsoRedirect}
                  onChange={(forceSsoRedirect) => setSsoForm((current) => ({ ...current, forceSsoRedirect }))}
                  label={t("forceSsoRedirect")}
                />
                <SettingToggle
                  id="sso-auto-provision"
                  checked={ssoForm.autoProvision}
                  onChange={(autoProvision) => setSsoForm((current) => ({ ...current, autoProvision }))}
                  label={t("autoProvisionUsers")}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                {saveSso.isError && <p className="text-sm text-destructive">{mutationError(saveSso.error, t("saveError"))}</p>}
                {saveSso.isSuccess && <p className="text-sm text-green-600">{t("saved")}</p>}
                <Button type="submit" disabled={saveSso.isPending}>
                  <Save className="size-4" />
                  {t("save")}
                </Button>
              </div>
            </form>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
