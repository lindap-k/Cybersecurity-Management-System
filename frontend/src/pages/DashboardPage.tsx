import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';
import type { DashboardSummary, Incident } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryData, incidentData] = await Promise.all([api.getDashboardSummary(), api.getIncidents()]);
        setSummary(summaryData);
        setIncidents(incidentData);
      } catch (error) {
        toast.error('Could not load dashboard', { description: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="rounded-2xl bg-white p-6 shadow-sm">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="rounded-2xl bg-white p-6 shadow-sm">Dashboard data unavailable.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total incidents', summary.cards.total_incidents],
          ['Open incidents', summary.cards.open_incidents],
          ['Critical incidents', summary.cards.critical_incidents],
          ['Resolved incidents', summary.cards.resolved_incidents],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Incidents by severity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.incidents_by_severity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Incidents by status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.incidents_by_status} dataKey="count" nameKey="status" outerRadius={100} label>
                  {summary.incidents_by_status.map((entry, index) => (
                    <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Recent incidents</CardTitle>
          <CardDescription>This table comes from <code>GET /api/incidents</code>, replacing the Figma mock array.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.incident_id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                    <p className="text-sm text-slate-500">{incident.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{incident.severity}</Badge>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
