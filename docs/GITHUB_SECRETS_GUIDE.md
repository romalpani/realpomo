# GitHub Secrets Setup Guide for Public Repositories

## ✅ Use Repository Secrets (Not Environment Secrets)

For a public repository, use **Repository secrets**. They are:
- ✅ Encrypted and secure (even in public repos)
- ✅ Only accessible to GitHub Actions workflows
- ✅ Simple to set up and use
- ✅ Perfect for code signing credentials

**Environment secrets** are only needed if you have multiple environments (dev/staging/prod) with different credentials.

## 📍 Step-by-Step: Adding Repository Secrets

### 1. Navigate to Secrets Page

1. Go to your repository: `https://github.com/YOUR_USERNAME/realpomo`
2. Click **Settings** (top menu bar)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Make sure you're on the **"Secrets"** tab (not "Variables")

### 2. Add Each Secret

Click **"New repository secret"** and add these 5 secrets:

#### Secret 1: CSC_LINK
- **Name:** `CSC_LINK`
- **Value:** Paste the entire contents of `certificate.p12.base64` file
  - This is the base64-encoded certificate
  - Get it by running: `./scripts/export-certificate.sh`
  - Copy everything from the `.base64` file

#### Secret 2: CSC_KEY_PASSWORD
- **Name:** `CSC_KEY_PASSWORD`
- **Value:** The password you used when exporting the certificate
  - This is the password you entered when running the export script

#### Secret 3: APPLE_ID
- **Name:** `APPLE_ID`
- **Value:** Your Apple ID email address
  - Example: `your.email@example.com`

#### Secret 4: APPLE_ID_PASS
- **Name:** `APPLE_ID_PASS`
- **Value:** Your App-Specific Password
  - Generate at: https://appleid.apple.com/
  - Go to: Sign-In and Security → App-Specific Passwords
  - Label: "RealPomo Notarization"

#### Secret 5: APPLE_TEAM_ID
- **Name:** `APPLE_TEAM_ID`
- **Value:** `U2YWB8CCXX`
  - This is your Team ID from your Apple Developer account

### 3. Verify Secrets Are Added

After adding all 5 secrets, you should see them listed:
- ✅ CSC_LINK
- ✅ CSC_KEY_PASSWORD
- ✅ APPLE_ID
- ✅ APPLE_ID_PASS
- ✅ APPLE_TEAM_ID

**Note:** The values are hidden (shown as `••••••••`) for security.

## 🔒 Security Notes for Public Repositories

### ✅ Safe to Use
- Repository secrets are **encrypted** and **never exposed**
- They can only be accessed by GitHub Actions workflows
- Even if someone forks your repo, they **cannot** access your secrets
- Secrets are **not** visible in workflow logs (they're masked)

### ⚠️ Important Security Practices
- ✅ Never commit certificate files (`.p12`, `.base64`) to git
- ✅ Never hardcode secrets in workflow files
- ✅ Use repository secrets (not environment secrets) for this use case
- ✅ Rotate App-Specific Password if compromised

## 🧪 Testing Secrets

After adding secrets, test by creating a test tag:

```bash
git tag v1.0.5-test
git push origin v1.0.5-test
```

Then check the GitHub Actions workflow:
1. Go to **Actions** tab
2. Find the workflow run
3. Check the build logs for:
   - ✅ "signing" step should show your certificate
   - ✅ "notarization" should complete (may take 10-30 minutes)

## 🔍 Troubleshooting

### Secrets not found in workflow
- Verify you're using **Repository secrets** (not Environment secrets)
- Check secret names match exactly (case-sensitive)
- Ensure workflow has access (should work automatically)

### Code signing fails
- Verify `CSC_LINK` is correct base64 content
- Check `CSC_KEY_PASSWORD` matches export password
- Ensure certificate is valid: `security find-identity -v -p codesigning`

### Notarization fails
- Verify `APPLE_ID` and `APPLE_ID_PASS` are correct
- Check `APPLE_TEAM_ID` matches your Team ID
- App-Specific Password must be valid (regenerate if needed)

## 📚 Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Repository Secrets vs Environment Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#about-encrypted-secrets)

