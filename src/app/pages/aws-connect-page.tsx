import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle2, Key, Globe, Scan, Info, Trash2 } from "lucide-react";
import { notifications } from "@/lib/notifications";
import {
  saveCredentials,
  getCredentials,
  clearCredentials,
  hasCredentials,
  testConnection,
  type AWSCredentials,
} from "@/lib/aws";

export function AWSConnectPage() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-east-1");

  // Check for existing credentials on mount
  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      setAccessKeyId(creds.accessKeyId);
      setSecretAccessKey("•".repeat(20)); // Mask the secret
      setRegion(creds.region);
      setIsConnected(true);
      // Test the existing connection
      testExistingConnection(creds);
    }
  }, []);

  const testExistingConnection = async (creds: AWSCredentials) => {
    const result = await testConnection(creds);
    if (result.success) {
      setAccountId(result.accountId || null);
    } else {
      setIsConnected(false);
      clearCredentials();
    }
  };

  const handleConnect = async () => {
    if (!accessKeyId || !secretAccessKey || secretAccessKey.includes("•")) {
      setError("Please enter both Access Key ID and Secret Access Key");
      return;
    }

    setIsConnecting(true);
    setError(null);

    const credentials: AWSCredentials = {
      accessKeyId,
      secretAccessKey,
      region,
    };

    const result = await testConnection(credentials);

    if (result.success) {
      saveCredentials(credentials);
      setIsConnected(true);
      setAccountId(result.accountId || null);
      notifications.success(
        "AWS Connected!",
        `Successfully connected to account ${result.accountId}`
      );
    } else {
      setError(result.error || "Failed to connect to AWS");
      notifications.error("Connection Failed", result.error || "Please check your credentials");
    }

    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    clearCredentials();
    setIsConnected(false);
    setAccountId(null);
    setAccessKeyId("");
    setSecretAccessKey("");
    notifications.info("Disconnected", "AWS credentials have been removed");
  };

  const handleGoToDashboard = () => {
    navigate("/app");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Connect AWS Account</h1>
        <p className="text-muted-foreground">
          Scan your AWS resources using read-only IAM credentials
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Connection Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Status */}
          {isConnected && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <h4 className="font-semibold text-green-500">Connected</h4>
                      <p className="text-sm text-muted-foreground">
                        AWS Account: {accountId || "Loading..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleGoToDashboard}>
                      Go to Dashboard
                    </Button>
                    <Button variant="outline" onClick={handleDisconnect}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle>IAM Credentials</CardTitle>
              <CardDescription>
                Use read-only credentials with AmazonEC2ReadOnlyAccess, AmazonS3ReadOnlyAccess, IAMReadOnlyAccess, and AWSCostExplorerReadOnlyAccess policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-destructive/10 border-destructive/50">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="accessKey">AWS Access Key ID</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="accessKey"
                    placeholder="AKIA..."
                    className="pl-10 bg-input font-mono"
                    value={accessKeyId}
                    onChange={(e) => setAccessKeyId(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">AWS Secret Access Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="••••••••••••••••••••"
                    className="pl-10 bg-input font-mono"
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    disabled={isConnected}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Default Region</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                  <Select
                    value={region}
                    onValueChange={setRegion}
                    disabled={isConnected}
                  >
                    <SelectTrigger className="pl-10 bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                      <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                      <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                      <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="bg-muted/50 border-border">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>We never ask for your AWS password.</strong> Only
                  read-only IAM credentials are required. Your credentials are
                  stored locally in your browser and never sent to any server.
                </AlertDescription>
              </Alert>

              {!isConnected && (
                <Button
                  className="w-full"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Connect & Test
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Create IAM User</h4>
                <p className="text-muted-foreground">
                  Create a new IAM user in your AWS console with programmatic access only.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Attach Policies</h4>
                <p className="text-muted-foreground">
                  Attach these AWS managed policies:
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    AmazonEC2ReadOnlyAccess
                  </Badge>
                  <br />
                  <Badge variant="outline" className="text-xs">
                    AmazonS3ReadOnlyAccess
                  </Badge>
                  <br />
                  <Badge variant="outline" className="text-xs">
                    IAMReadOnlyAccess
                  </Badge>
                  <br />
                  <Badge variant="outline" className="text-xs">
                    AWSCostExplorerReadOnlyAccess
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Get Credentials</h4>
                <p className="text-muted-foreground">
                  Copy the Access Key ID and Secret Access Key from the IAM console.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Connect & View</h4>
                <p className="text-muted-foreground">
                  Enter your credentials and your real AWS data will appear in the dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-card to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Security Guarantee</h4>
                  <p className="text-sm text-muted-foreground">
                    We only request read-only access. Your credentials are
                    stored locally in your browser. We cannot make any changes
                    to your AWS account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2 text-warning">Important</h4>
                  <p className="text-sm text-muted-foreground">
                    Never share your AWS root account credentials or passwords.
                    Only use IAM credentials with read-only permissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
