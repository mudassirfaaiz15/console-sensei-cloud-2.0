import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileJson,
  Sparkles,
} from "lucide-react";

const examplePolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}`;

export function IAMExplainerPage() {
  const [policy, setPolicy] = useState(examplePolicy);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">IAM Policy Explainer</h1>
        <p className="text-muted-foreground">
          Paste your IAM policy JSON to get a plain English explanation and security analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* JSON Editor */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                IAM Policy JSON
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPolicy(examplePolicy)}>
                Load Example
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              className="font-mono text-sm h-[500px] bg-muted/30 resize-none"
              placeholder="Paste your IAM policy JSON here..."
            />
            <div className="mt-4">
              <Button
                className="w-full"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analyzing Policy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Explanation Panel */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showResults ? (
              <div className="h-[500px] flex items-center justify-center text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <FileJson className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Paste an IAM policy and click "Analyze Policy" to see the explanation
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h3 className="font-semibold mb-2">Policy Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    This policy contains 2 statements that grant permissions for S3 operations.
                  </p>
                </div>

                {/* Statements */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Statements Breakdown</h3>

                  {/* Statement 1 */}
                  <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/5">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">Statement #1</h4>
                          <Badge variant="outline" className="text-xs">
                            Least Privilege
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Allows reading and writing objects in the specific bucket "my-bucket".
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Effect:</span>
                        <span className="ml-2 text-muted-foreground">Allow</span>
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span>
                        <div className="ml-2 mt-1 space-y-1">
                          <Badge variant="secondary" className="text-xs mr-1">
                            s3:GetObject
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            s3:PutObject
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Resource:</span>
                        <code className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          arn:aws:s3:::my-bucket/*
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Statement 2 */}
                  <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/5">
                    <div className="flex items-start gap-3 mb-3">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">Statement #2</h4>
                          <Badge variant="destructive" className="text-xs">
                            Critical Issue
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Grants all S3 permissions on all resources. This is overly broad and violates the principle of least privilege.
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Effect:</span>
                        <span className="ml-2 text-muted-foreground">Allow</span>
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span>
                        <Badge variant="destructive" className="text-xs ml-2">
                          s3:* (All S3 actions)
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Resource:</span>
                        <Badge variant="destructive" className="text-xs ml-2">
                          * (All resources)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-2 text-warning">
                        Security Recommendations
                      </h4>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>• Remove Statement #2 or restrict it to specific resources</li>
                        <li>• Use wildcard (*) permissions only when absolutely necessary</li>
                        <li>• Consider using condition statements to further restrict access</li>
                        <li>• Implement separate policies for different use cases</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Security Risk Score</span>
                    <span className="text-2xl font-bold text-red-500">8/10</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: "80%" }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    High risk due to overly permissive wildcard statement
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Least Privilege</h4>
                <p className="text-sm text-muted-foreground">
                  Only grant the minimum permissions needed for the task
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Avoid Wildcards</h4>
                <p className="text-sm text-muted-foreground">
                  Wildcard (*) permissions can expose your resources to risk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 flex-shrink-0">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Use Conditions</h4>
                <p className="text-sm text-muted-foreground">
                  Add condition statements for IP ranges, MFA, and time-based access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
