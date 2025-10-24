# AEM Cloud Service Log Tailing Guide

## Current Setup Status

✅ **Adobe I/O CLI**: Installed at `/opt/homebrew/bin/aio`
✅ **Cloud Manager Plugin**: Installed (v4.2.4)
✅ **AEM CLI**: Installed (v16.5.10)
✅ **Authentication**: Completed with Adobe IMS
✅ **Program ID**: 165753 (configured)

✅ **Organization Selection**: COMPLETED (ASUSTEK COMPUTER INC. - orgId: 269133FB5C51B0DD0A495EF3@AdobeOrg)

## How to Tail AEM Cloud Service Logs

### Step 1: List Available Environments ✅ VERIFIED
```bash
# List all environments for your program
aio cloudmanager:list-environments --programId=165753

# Available environments:
# 1766931 - asus-cto-prod (prod)
# 1766970 - asus-cto-stage (stage)  
# 1767020 - asus-cto-dev (dev)
# 1767021 - asus-cto-rde (rde)
```

### Step 2: Check Available Log Options ✅ VERIFIED
```bash
# List available log options for an environment (uses positional argument!)
aio cloudmanager:list-available-log-options 1766931 --programId=165753
```

### Step 3: Live Stream Logs ✅ TESTED & WORKING

#### Method 1: Real-time Log Streaming (VERIFIED WORKING)
```bash
# IMPORTANT: Uses positional arguments, not --environmentId flag!

# Stream author error logs (PRODUCTION - tested and working)
aio cloudmanager:tail-log 1766931 author aemerror --programId=165753

# Stream publish error logs (tested and working)
aio cloudmanager:tail-log 1766931 publish aemerror --programId=165753

# Stream dispatcher access logs
aio cloudmanager:tail-log 1766931 dispatcher httpdaccess --programId=165753

# Stream author access logs
aio cloudmanager:tail-log 1766931 author aemaccess --programId=165753

# For STAGE environment (use 1766970)
aio cloudmanager:tail-log 1766970 author aemerror --programId=165753
```

#### Method 2: Download Historical Logs
```bash
# Download author logs (alternative method)
aio cloudmanager:download-logs --programId=165753 --environmentId=1766931 --service=author --name=aemerror --days=1

# Download publish logs  
aio cloudmanager:download-logs --programId=165753 --environmentId=1766931 --service=publish --name=aemerror --days=1

# Download dispatcher logs
aio cloudmanager:download-logs --programId=165753 --environmentId=1766931 --service=dispatcher --name=httpdaccess --days=1
```

### Step 4: Available Log Types ✅ VERIFIED

| Environment ID | Service | Log Name | Description |
|----------------|---------|----------|-------------|
| 1766931 (prod) | author | aemerror | AEM Author error logs |
| 1766931 (prod) | author | aemaccess | AEM Author access logs |
| 1766931 (prod) | author | aemrequest | AEM Author request logs |
| 1766931 (prod) | author | cdn | AEM Author CDN logs |
| 1766931 (prod) | publish | aemerror | AEM Publish error logs |
| 1766931 (prod) | publish | aemaccess | AEM Publish access logs |
| 1766931 (prod) | publish | aemrequest | AEM Publish request logs |  
| 1766931 (prod) | publish | cdn | AEM Publish CDN logs |
| 1766931 (prod) | dispatcher | httpdaccess | Dispatcher access logs |
| 1766931 (prod) | dispatcher | httpderror | Dispatcher error logs |
| 1766931 (prod) | dispatcher | aemdispatcher | AEM Dispatcher logs |
| 1766931 (prod) | preview_publish | aemerror | Preview Publish error logs |
| 1766931 (prod) | preview_dispatcher | httpdaccess | Preview Dispatcher logs |

## Alternative Methods

### Using Cloud Manager UI
1. Navigate to https://experience.adobe.com/cloud-manager
2. Select your program (165753)
3. Go to Environments
4. Click on environment → Logs
5. Select log type and download or view

### Using AEM CLI for Local Development
```bash
# Start local AEM proxy (for development)
aem up

# This connects to your configured AEM instance:
# https://author-p165753-e1767020.adobeaemcloud.com/
```

## Package Health Check

### Your Project Status:
- **Project Type**: AEM Edge Delivery Services (EDS)
- **AEM Boilerplate**: v1.3.0
- **Node.js Dependencies**: ✅ Installed
- **EDS Connection**: ✅ Connected to Cloud Service

### Verify Package Installation:
```bash
# Check npm packages
npm list

# Run build processes
npm run build:json

# Check linting (note: currently has ESLint config issue)
npm run lint:css  # CSS linting should work
```

### Environment URLs:
- **Preview**: https://main--asus--AEM-COMP.aem.page/home
- **Live**: https://main--asus--AEM-COMP.aem.live/home
- **Author**: https://author-p165753-e1767020.adobeaemcloud.com/

## Next Steps:
1. Complete organization selection in the running terminal
2. List environments to get the environment ID
3. Start downloading/tailing logs based on your needs
4. Fix ESLint configuration for proper linting

## Quick Commands Reference:
```bash
# List programs
aio cloudmanager:list-programs

# List environments  
aio cloudmanager:list-environments --programId=165753

# List available logs (CORRECT: uses positional argument)
aio cloudmanager:list-available-log-options 1766931 --programId=165753

# LIVE STREAM LOGS (TESTED AND WORKING):
# Stream author error logs
aio cloudmanager:tail-log 1766931 author aemerror --programId=165753

# Stream publish error logs  
aio cloudmanager:tail-log 1766931 publish aemerror --programId=165753

# Download recent logs
aio cloudmanager:download-logs --programId=165753 --environmentId=<ENV_ID> --service=author --name=aemerror --days=1

# Check AEM CLI status
aem status
