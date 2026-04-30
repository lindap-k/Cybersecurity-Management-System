import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Loader2, Search, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser, DashboardSummary, Department, Incident } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];
const INCIDENT_STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved'];
type DashboardSection = 'overview' | 'my-tickets' | 'unassigned' | 'manage-team';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
}

function severityBadgeVariant(severity: string) {
  if (severity === 'Critical') return 'destructive' as const;
  return 'secondary' as const;
}

function pageCopy(section: DashboardSection) {
  switch (section) {
    case 'my-tickets':
      return {
        title: 'My tickets',
        description: 'Review the incidents assigned to you and update their progress.',
      };
    case 'unassigned':
      return {
        title: 'Unassigned tickets',
        description: 'Browse open work that is ready to be claimed or assigned.',
      };
    case 'manage-team':
      return {
        title: 'Manage employees',
        description: 'Add and remove employee and analyst accounts for the team.',
      };
    default:
      return {
        title: 'Operations overview',
        description: 'Track active incidents, move work forward, and keep the response team coordinated.',
      };
  }
}

export function DashboardPage({ section = 'overview' }: { section?: DashboardSection }) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'administrator';
  const isAnalyst = user?.role?.toLowerCase() === 'analyst';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<number, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department_id: '',
  });

  const copy = pageCopy(section);

  const analystOptions = useMemo(
    () => users.filter((item) => ['analyst', 'administrator'].includes(item.role?.toLowerCase() || '')),
    [users],
  );

  const myIncidents = useMemo(
    () => incidents.filter((incident) => incident.assigned_to_id === user?.user_id),
    [incidents, user?.user_id],
  );

  const unassignedIncidents = useMemo(
    () => incidents.filter((incident) => !incident.assigned_to_id),
    [incidents],
  );

  const visibleIncidents = useMemo(() => {
    const base = section === 'my-tickets' ? myIncidents : section === 'unassigned' ? unassignedIncidents : incidents;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return base;
    return base.filter((incident) => incident.title.toLowerCase().includes(query));
  }, [incidents, myIncidents, searchTerm, section, unassignedIncidents]);

  const selectedIncident = useMemo(
    () => visibleIncidents.find((incident) => incident.incident_id === selectedIncidentId)
      ?? incidents.find((incident) => incident.incident_id === selectedIncidentId)
      ?? null,
    [incidents, selectedIncidentId, visibleIncidents],
  );

  const canEditSelectedIncident = Boolean(
    selectedIncident && (isAdmin || (isAnalyst && selectedIncident.assigned_to_id === user?.user_id)),
  );

  const syncIncidentDrafts = (incidentData: Incident[]) => {
    setAssignmentDrafts(
      Object.fromEntries(incidentData.map((incident) => [incident.incident_id, incident.assigned_to_id ? String(incident.assigned_to_id) : 'unassigned'])),
    );
    setStatusDrafts(
      Object.fromEntries(incidentData.map((incident) => [incident.incident_id, incident.status])),
    );
    setNotesDrafts(
      Object.fromEntries(incidentData.map((incident) => [incident.incident_id, incident.resolution_notes || ''])),
    );
  };

  const loadData = async () => {
    try {
      const [summaryData, incidentData, userData, departmentData] = await Promise.all([
        api.getDashboardSummary(),
        api.getIncidents(),
        isAdmin ? api.getUsers() : Promise.resolve([]),
        isAdmin ? api.getDepartments() : Promise.resolve([]),
      ]);
      setSummary(summaryData);
      setIncidents(incidentData);
      setUsers(userData);
      setDepartments(departmentData);
      syncIncidentDrafts(incidentData);
    } catch (error) {
      toast.error('Could not load dashboard', { description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const refreshIncidents = async () => {
    const [summaryData, incidentData] = await Promise.all([api.getDashboardSummary(), api.getIncidents()]);
    setSummary(summaryData);
    setIncidents(incidentData);
    syncIncidentDrafts(incidentData);
  };

  const handleClaimIncident = async (incidentId: number) => {
    setBusyId(incidentId);
    try {
      await api.assignIncident(incidentId);
      toast.success('Incident assigned to you');
      await refreshIncidents();
    } catch (error) {
      toast.error('Could not claim incident', { description: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const handleAnalystSave = async (incidentId: number, status: string) => {
    setBusyId(incidentId);
    try {
      await api.updateIncident(incidentId, {
        status,
        assigned_to: user?.user_id ?? null,
        resolution_notes: notesDrafts[incidentId] ?? '',
      });
      toast.success('Incident updated');
      await refreshIncidents();
    } catch (error) {
      toast.error('Could not update incident', { description: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminIncidentSave = async (incidentId: number) => {
    setBusyId(incidentId);
    try {
      const assigneeValue = assignmentDrafts[incidentId];
      await api.updateIncident(incidentId, {
        assigned_to: assigneeValue && assigneeValue !== 'unassigned' ? Number(assigneeValue) : null,
        status: statusDrafts[incidentId],
        resolution_notes: notesDrafts[incidentId] ?? '',
      });
      toast.success('Ticket updated');
      await refreshIncidents();
    } catch (error) {
      toast.error('Could not save ticket changes', { description: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingUser(true);
    try {
      await api.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        department_id: newUser.department_id ? Number(newUser.department_id) : undefined,
      });
      toast.success(`${newUser.role} account created`);
      setNewUser({ name: '', email: '', password: '', role: 'Employee', department_id: '' });
      setUsers(await api.getUsers());
    } catch (error) {
      toast.error('Could not create user', { description: (error as Error).message });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    setBusyId(userId);
    try {
      await api.deleteUser(userId);
      toast.success(`${userName} was removed`);
      setUsers(await api.getUsers());
      await refreshIncidents();
    } catch (error) {
      toast.error('Could not delete user', { description: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg bg-white p-6 shadow-sm">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="rounded-lg bg-white p-6 shadow-sm">Dashboard data unavailable.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{copy.title}</h2>
        <p className="text-sm text-slate-600">{copy.description}</p>
      </section>

      {section === 'overview' ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total incidents', summary.cards.total_incidents],
              ['Open incidents', summary.cards.open_incidents],
              ['Critical incidents', summary.cards.critical_incidents],
              ['Resolved incidents', summary.cards.resolved_incidents],
            ].map(([label, value]) => (
              <Card key={label} className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-3xl">{value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-lg shadow-sm">
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
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-lg shadow-sm">
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
          </section>
        </>
      ) : null}

      {section !== 'manage-team' ? (
        <>
          {selectedIncident ? (
            <Card className="rounded-lg shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedIncident.title}</CardTitle>
                    <CardDescription>Review the full incident record, update progress, and capture resolution notes.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setSelectedIncidentId(null)}>
                    Close details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Incident description</Label>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{selectedIncident.description}</div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Attack types</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.attack_types.length ? selectedIncident.attack_types.map((item) => (
                            <Badge key={item.attack_type_id} variant="outline">{item.name}</Badge>
                          )) : <span className="text-sm text-slate-500">None listed</span>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Affected systems</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.systems.length ? selectedIncident.systems.map((item) => (
                            <Badge key={item.system_id} variant="outline">{item.system_name}</Badge>
                          )) : <span className="text-sm text-slate-500">None listed</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Resolution notes</Label>
                      <Textarea
                        value={notesDrafts[selectedIncident.incident_id] ?? ''}
                        onChange={(event) => setNotesDrafts((current) => ({ ...current, [selectedIncident.incident_id]: event.target.value }))}
                        placeholder="Document what was investigated, the steps taken, and how the incident was resolved."
                        rows={8}
                        disabled={!canEditSelectedIncident}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-medium text-slate-900">Ticket details</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p><span className="font-medium text-slate-800">Severity:</span> {selectedIncident.severity}</p>
                        <p><span className="font-medium text-slate-800">Status:</span> {selectedIncident.status}</p>
                        <p><span className="font-medium text-slate-800">Reported by:</span> {selectedIncident.reported_by || 'Unknown'}</p>
                        <p><span className="font-medium text-slate-800">Assigned to:</span> {selectedIncident.assigned_to || 'Unassigned'}</p>
                        <p><span className="font-medium text-slate-800">Department:</span> {selectedIncident.department || 'No department'}</p>
                        <p><span className="font-medium text-slate-800">Opened:</span> {formatDate(selectedIncident.reported_at)}</p>
                        <p><span className="font-medium text-slate-800">Resolved:</span> {formatDate(selectedIncident.resolved_at)}</p>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                        <div className="space-y-2">
                          <Label>Assignee</Label>
                          <Select
                            value={assignmentDrafts[selectedIncident.incident_id] || 'unassigned'}
                            onValueChange={(value) => setAssignmentDrafts((current) => ({ ...current, [selectedIncident.incident_id]: value }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {analystOptions.map((option) => (
                                <SelectItem key={option.user_id} value={String(option.user_id)}>
                                  {option.name} ({option.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={statusDrafts[selectedIncident.incident_id] || selectedIncident.status}
                            onValueChange={(value) => setStatusDrafts((current) => ({ ...current, [selectedIncident.incident_id]: value }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {INCIDENT_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" disabled={busyId === selectedIncident.incident_id} onClick={() => handleAdminIncidentSave(selectedIncident.incident_id)}>
                          {busyId === selectedIncident.incident_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save ticket changes
                        </Button>
                      </div>
                    ) : null}

                    {isAnalyst && selectedIncident.assigned_to_id === user?.user_id ? (
                      <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={statusDrafts[selectedIncident.incident_id] || selectedIncident.status}
                            onValueChange={(value) => setStatusDrafts((current) => ({ ...current, [selectedIncident.incident_id]: value }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['Assigned', 'In Progress', 'Resolved'].map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" disabled={busyId === selectedIncident.incident_id} onClick={() => handleAnalystSave(selectedIncident.incident_id, statusDrafts[selectedIncident.incident_id] || selectedIncident.status)}>
                          {busyId === selectedIncident.incident_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save notes and status
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>
                {section === 'my-tickets' ? 'My tickets' : section === 'unassigned' ? 'Unassigned tickets' : 'Incident queue'}
              </CardTitle>
              <CardDescription>
                {section === 'my-tickets' ? 'Only incidents assigned to you are shown here.' : section === 'unassigned' ? 'Only incidents without an owner are shown here.' : 'Review recent reports, current ownership, and investigation progress.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search tickets by title" className="pl-9" />
              </div>

              {visibleIncidents.map((incident) => (
                <div key={incident.incident_id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                        <Badge variant={severityBadgeVariant(incident.severity)}>{incident.severity}</Badge>
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{incident.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>Reported by {incident.reported_by || 'Unknown'}</span>
                        <span>Assigned to {incident.assigned_to || 'Unassigned'}</span>
                        <span>{incident.department || 'No department'}</span>
                        <span>Created {formatDate(incident.reported_at)}</span>
                        {incident.resolved_at ? <span>Resolved {formatDate(incident.resolved_at)}</span> : null}
                      </div>
                    </div>

                    <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => setSelectedIncidentId(incident.incident_id)}>
                          Open details
                        </Button>
                      </div>

                      {section === 'unassigned' && isAnalyst ? (
                        <div className="sm:col-span-2">
                          <Button type="button" disabled={busyId === incident.incident_id} onClick={() => handleClaimIncident(incident.incident_id)}>
                            {busyId === incident.incident_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Assign to me
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {!visibleIncidents.length ? (
                <p className="text-sm text-slate-500">No tickets matched that view.</p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {section === 'manage-team' && isAdmin ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr]">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Add team member
              </CardTitle>
              <CardDescription>Create employee and analyst accounts for the response team.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label htmlFor="staff-name">Full name</Label>
                  <Input id="staff-name" value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input id="staff-email" type="email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Temporary password</Label>
                  <Input id="staff-password" type="password" value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser((current) => ({ ...current, role: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Analyst">Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={newUser.department_id || 'none'} onValueChange={(value) => setNewUser((current) => ({ ...current, department_id: value === 'none' ? '' : value }))}>
                      <SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No department</SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department.department_id} value={String(department.department_id)}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={isSavingUser}>
                  {isSavingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Add user
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Team directory
              </CardTitle>
              <CardDescription>Manage employees and analysts who can access the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((teamMember) => (
                <div key={teamMember.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{teamMember.name}</p>
                    <p className="text-sm text-slate-500">{teamMember.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{teamMember.role || 'No role'}</Badge>
                      <Badge variant="secondary">{teamMember.department || 'No department'}</Badge>
                    </div>
                  </div>
                  <Button type="button" variant="outline" disabled={busyId === teamMember.user_id || teamMember.user_id === user?.user_id} onClick={() => handleDeleteUser(teamMember.user_id, teamMember.name)}>
                    {busyId === teamMember.user_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
