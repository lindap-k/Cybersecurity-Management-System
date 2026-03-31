import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  title: string;
  description: string;
  attackType: string;
  severityLevel: string;
  affectedSystem: string;
  attachment: File | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  attackType?: string;
  severityLevel?: string;
  affectedSystem?: string;
}

// Mock data - will be replaced with database values
const attackTypes = [
  "Malware",
  "Phishing",
  "Ransomware",
  "DDoS Attack",
  "SQL Injection",
  "Cross-Site Scripting (XSS)",
  "Man-in-the-Middle",
  "Zero-Day Exploit",
  "Insider Threat",
  "Social Engineering",
];

const severityLevels = [
  { value: "critical", label: "Critical", color: "text-red-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "low", label: "Low", color: "text-blue-600" },
];

const affectedSystems = [
  "Web Application",
  "Database Server",
  "Email System",
  "Network Infrastructure",
  "Cloud Services",
  "Employee Workstations",
  "Mobile Applications",
  "Payment Processing",
  "Authentication System",
  "File Storage",
];

export function IncidentReportingForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    attackType: "",
    severityLevel: "",
    affectedSystem: "",
    attachment: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [fileName, setFileName] = useState<string>("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Incident title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.attackType) {
      newErrors.attackType = "Attack type is required";
    }

    if (!formData.severityLevel) {
      newErrors.severityLevel = "Severity level is required";
    }

    if (!formData.affectedSystem) {
      newErrors.affectedSystem = "Affected system is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormData({ ...formData, attachment: file });
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    // Generate current date
    const currentDate = new Date().toLocaleString();

    // Here you would normally submit to the database
    console.log("Submitting incident report:", {
      ...formData,
      date: currentDate,
    });

    // Show success message
    toast.success("Incident Reported Successfully", {
      description: `Your incident "${formData.title}" has been submitted and is now being reviewed by the security team.`,
      duration: 5000,
    });

    // Reset form
    setFormData({
      title: "",
      description: "",
      attackType: "",
      severityLevel: "",
      affectedSystem: "",
      attachment: null,
    });
    setFileName("");
    setErrors({});
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Report Security Incident
        </CardTitle>
        <CardDescription>
          Submit a new cybersecurity incident for investigation and response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="required">
                Incident Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the incident"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the incident..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) {
                    setErrors({ ...errors, description: undefined });
                  }
                }}
                rows={5}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Incident Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Incident Details</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="attackType">
                  Attack Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.attackType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, attackType: value });
                    if (errors.attackType) {
                      setErrors({ ...errors, attackType: undefined });
                    }
                  }}
                >
                  <SelectTrigger
                    id="attackType"
                    className={errors.attackType ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select attack type" />
                  </SelectTrigger>
                  <SelectContent>
                    {attackTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.attackType && (
                  <p className="text-sm text-red-500">{errors.attackType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="severityLevel">
                  Severity Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.severityLevel}
                  onValueChange={(value) => {
                    setFormData({ ...formData, severityLevel: value });
                    if (errors.severityLevel) {
                      setErrors({ ...errors, severityLevel: undefined });
                    }
                  }}
                >
                  <SelectTrigger
                    id="severityLevel"
                    className={errors.severityLevel ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.severityLevel && (
                  <p className="text-sm text-red-500">{errors.severityLevel}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affectedSystem">
                Affected System <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.affectedSystem}
                onValueChange={(value) => {
                  setFormData({ ...formData, affectedSystem: value });
                  if (errors.affectedSystem) {
                    setErrors({ ...errors, affectedSystem: undefined });
                  }
                }}
              >
                <SelectTrigger
                  id="affectedSystem"
                  className={errors.affectedSystem ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select affected system" />
                </SelectTrigger>
                <SelectContent>
                  {affectedSystems.map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.affectedSystem && (
                <p className="text-sm text-red-500">{errors.affectedSystem}</p>
              )}
            </div>
          </div>

          {/* File Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">
              Attachment <span className="text-sm text-gray-500">(Optional)</span>
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("attachment")?.click()}
                className="w-full md:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              {fileName && (
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {fileName}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG (Max 10MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="w-full md:w-auto">
              Submit Incident Report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
