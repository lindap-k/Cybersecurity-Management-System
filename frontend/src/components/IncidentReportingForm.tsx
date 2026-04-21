import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AttackType, SystemAsset } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function IncidentReportingForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [attackTypeId, setAttackTypeId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [attackTypes, setAttackTypes] = useState<AttackType[]>([]);
  const [systems, setSystems] = useState<SystemAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [attackTypeData, systemData] = await Promise.all([api.getAttackTypes(), api.getSystems()]);
        setAttackTypes(attackTypeData);
        setSystems(systemData);
      } catch (error) {
        toast.error('Could not load form options', { description: (error as Error).message });
      } finally {
        setLookupLoading(false);
      }
    };
    loadLookups();
  }, []);

  const canSubmit = useMemo(() => Boolean(title.trim() && description.trim() && severity), [title, description, severity]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error('Please complete the required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.createIncident({
        title,
        description,
        severity,
        attack_type_ids: attackTypeId ? [Number(attackTypeId)] : [],
        system_ids: systemId ? [Number(systemId)] : [],
      });
      toast.success('Incident submitted successfully');
      setTitle('');
      setDescription('');
      setSeverity('');
      setAttackTypeId('');
      setSystemId('');
    } catch (error) {
      toast.error('Incident submission failed', { description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Report Security Incident</CardTitle>
        <CardDescription>
          This form is the bridge from your Figma screen to the backend. Each field maps to the JSON payload sent to <code>/api/incidents</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lookupLoading ? (
          <p className="text-sm text-slate-500">Loading attack types and systems...</p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Incident title</Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Suspicious phishing email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what happened, who reported it, and what systems were affected." />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue placeholder="Choose severity" /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attack type</Label>
                <Select value={attackTypeId} onValueChange={setAttackTypeId}>
                  <SelectTrigger><SelectValue placeholder="Choose attack type" /></SelectTrigger>
                  <SelectContent>
                    {attackTypes.map((item) => (
                      <SelectItem key={item.attack_type_id} value={String(item.attack_type_id)}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Affected system</Label>
                <Select value={systemId} onValueChange={setSystemId}>
                  <SelectTrigger><SelectValue placeholder="Choose system" /></SelectTrigger>
                  <SelectContent>
                    {systems.map((item) => (
                      <SelectItem key={item.system_id} value={String(item.system_id)}>{item.system_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  In Figma this is only visual state. In code, the submit button serializes the form into JSON, adds the bearer token, and posts it to the Flask API.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Submitting...' : 'Submit incident'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
