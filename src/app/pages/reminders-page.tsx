import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import {
  Bell,
  Plus,
  Trash2,
  Clock,
  Server,
  DollarSign,
  Database,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";

const existingReminders = [
  {
    id: 1,
    name: "EC2 Running Alert",
    condition: "If any EC2 instance is running",
    frequency: "Every 1 hour",
    notification: "Email",
    enabled: true,
    icon: Server,
  },
  {
    id: 2,
    name: "Cost Threshold",
    condition: "If monthly cost exceeds $100",
    frequency: "Daily at 9:00 AM",
    notification: "Email + Slack",
    enabled: true,
    icon: DollarSign,
  },
  {
    id: 3,
    name: "RDS Instance Check",
    condition: "If RDS instance exists",
    frequency: "Every 6 hours",
    notification: "Email",
    enabled: false,
    icon: Database,
  },
  {
    id: 4,
    name: "Unused Resources",
    condition: "If unattached EBS volumes found",
    frequency: "Weekly on Monday",
    notification: "Email",
    enabled: true,
    icon: Server,
  },
];

export function RemindersPage() {
  const [reminders, setReminders] = useState(existingReminders);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleReminder = (id: number) => {
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">
            Set up smart alerts for your AWS resources and costs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Configure a new alert for your AWS resources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reminderName">Reminder Name</Label>
                <Input
                  id="reminderName"
                  placeholder="e.g., EC2 Instance Alert"
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select defaultValue="ec2">
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ec2">EC2 Instances</SelectItem>
                    <SelectItem value="rds">RDS Instances</SelectItem>
                    <SelectItem value="ebs">EBS Volumes</SelectItem>
                    <SelectItem value="eip">Elastic IPs</SelectItem>
                    <SelectItem value="s3">S3 Buckets</SelectItem>
                    <SelectItem value="cost">Cost Threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select defaultValue="exists">
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exists">If resource exists</SelectItem>
                    <SelectItem value="running">If resource is running</SelectItem>
                    <SelectItem value="stopped">If resource is stopped</SelectItem>
                    <SelectItem value="unattached">If resource is unattached</SelectItem>
                    <SelectItem value="exceeds">If cost exceeds threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Check Frequency</Label>
                <Select defaultValue="1hour">
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="30min">Every 30 minutes</SelectItem>
                    <SelectItem value="1hour">Every 1 hour</SelectItem>
                    <SelectItem value="6hours">Every 6 hours</SelectItem>
                    <SelectItem value="daily">Daily at 9:00 AM</SelectItem>
                    <SelectItem value="weekly">Weekly on Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification">Notification Method</Label>
                <Select defaultValue="email">
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="both">Email + Slack</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Create Reminder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Reminders */}
      <div className="grid gap-4">
        {reminders.map((reminder) => (
          <Card
            key={reminder.id}
            className={`border-border transition-opacity ${
              !reminder.enabled && "opacity-60"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${
                    reminder.enabled ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <reminder.icon
                    className={`w-6 h-6 ${
                      reminder.enabled ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold">{reminder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {reminder.condition}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{reminder.frequency}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {reminder.notification.includes("Email") && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {reminder.notification.includes("Slack") && (
                        <Badge variant="secondary" className="text-xs">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Slack
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{reminders.length}</div>
            <div className="text-sm text-muted-foreground">Total Reminders</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {reminders.filter((r) => r.enabled).length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">24</div>
            <div className="text-sm text-muted-foreground">
              Alerts Sent (Last 7 Days)
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">3</div>
            <div className="text-sm text-muted-foreground">
              Issues Detected
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="border-border bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            How Reminders Work
          </CardTitle>
          <CardDescription>
            Stay on top of your AWS resources with automated alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Resource Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Get notified when EC2 instances are running, RDS databases exist,
                or EBS volumes are unattached. Perfect for cost control.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cost Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Set monthly spending thresholds and get alerts before your bill
                exceeds your budget. Track daily, weekly, or monthly costs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Multiple Channels</h4>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email, Slack, or custom webhooks.
                Configure different channels for different alert types.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Flexible Scheduling</h4>
              <p className="text-sm text-muted-foreground">
                Choose from predefined intervals or create custom schedules.
                Check resources every 15 minutes or once a week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
