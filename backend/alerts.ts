export type AlertSeverity = 'critical' | 'high' | 'watch'
export type AlertKind = 'flash-flood' | 'typhoon'

export type RawPAGASAAlert = {
  externalId: string
  kind: AlertKind
  title: string
  area: string
  description: string
  issuedAt: string
  sourceUrl: string
  severity?: AlertSeverity
  centroid?: { latitude: number; longitude: number }
}

export type NormalizedAlert = RawPAGASAAlert & {
  severity: AlertSeverity
  fingerprint: string
}

const severityWords: Array<[AlertSeverity, string[]]> = [
  ['critical', ['danger', 'warning', 'evacuate', 'life-threatening', 'flash flood']],
  ['high', ['typhoon', 'storm signal', 'heavy rainfall', 'gale']],
  ['watch', ['watch', 'advisory', 'monitor']],
]

export function classifySeverity(alert: RawPAGASAAlert): AlertSeverity {
  if (alert.severity) return alert.severity
  const text = `${alert.title} ${alert.description}`.toLowerCase()
  return severityWords.find(([, words]) => words.some((word) => text.includes(word)))?.[0] ?? 'watch'
}

export function normalizeAlert(alert: RawPAGASAAlert): NormalizedAlert {
  const normalized = {
    ...alert,
    title: alert.title.trim(),
    area: alert.area.trim(),
    description: alert.description.trim(),
    severity: classifySeverity(alert),
  }
  return { ...normalized, fingerprint: createFingerprint(normalized) }
}

export function createFingerprint(alert: Pick<RawPAGASAAlert, 'externalId' | 'kind' | 'area' | 'issuedAt'>) {
  return [alert.externalId, alert.kind, alert.area.trim().toLowerCase(), alert.issuedAt].join(':')
}

export function isWithinRadius(point: { latitude: number; longitude: number }, center: { latitude: number; longitude: number }, radiusKm: number) {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return false
  const earthRadiusKm = 6371
  const latDelta = ((point.latitude - center.latitude) * Math.PI) / 180
  const lonDelta = ((point.longitude - center.longitude) * Math.PI) / 180
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos((center.latitude * Math.PI) / 180) * Math.cos((point.latitude * Math.PI) / 180) * Math.sin(lonDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm
}

export function shouldNotify(alert: NormalizedAlert, preferences: { flashFloods: boolean; typhoons: boolean; minimumSeverity: AlertSeverity }) {
  if (alert.kind === 'flash-flood' && !preferences.flashFloods) return false
  if (alert.kind === 'typhoon' && !preferences.typhoons) return false
  const rank = { watch: 0, high: 1, critical: 2 }
  return rank[alert.severity] >= rank[preferences.minimumSeverity]
}

export async function fetchPAGASAAlerts(feedUrl = process.env.PAGASA_ALERT_FEED_URL) {
  if (!feedUrl) throw new Error('PAGASA_ALERT_FEED_URL is not configured')
  const response = await fetch(feedUrl, { headers: { accept: 'application/json, application/xml, text/xml' } })
  if (!response.ok) throw new Error(`PAGASA feed returned ${response.status}`)
  return response.text()
}

export const backendTables = {
  alerts: ['id', 'external_id', 'kind', 'title', 'area', 'description', 'severity', 'issued_at', 'source_url', 'fingerprint', 'created_at'],
  subscriptions: ['id', 'device_token', 'latitude', 'longitude', 'radius_km', 'flash_floods', 'typhoons', 'minimum_severity', 'created_at', 'updated_at'],
  deliveries: ['id', 'alert_id', 'subscription_id', 'status', 'sent_at', 'provider_ticket_id'],
} as const

// Use these tables with the connected Neon/Drizzle service after the live schema is available.
export const requiredEnvironment = ['DATABASE_URL', 'PAGASA_ALERT_FEED_URL', 'EXPO_ACCESS_TOKEN'] as const
