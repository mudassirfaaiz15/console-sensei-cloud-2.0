#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConsoleSenseiStack } from './stack';

const app = new cdk.App();

new ConsoleSenseiStack(app, 'ConsoleSenseiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'ConsoleSensei Cloud - Production AWS SaaS Platform',
});

app.synth();
