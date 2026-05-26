# Windows Setup Guide

This guide helps you get the Egerton University Transport Portal running on Windows.

## Prerequisites
- Windows 10 or newer
- Administrator access to install software

---

## Step 1: Install Node.js & npm

1. **Download Node.js**:
   - Go to https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended for stability)
   - Run the installer

2. **Verify Installation**:
   Open PowerShell (right-click → "Run as Administrator") and run:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers (e.g., `v18.17.1`, `9.8.1`).

---

## Step 2: Install Project Dependencies

1. **Navigate to project folder**:
   ```powershell
   cd C:\Users\IAN\Documents\GitHub\bla460
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```
   This downloads and installs all packages listed in `package.json`.
   **Note**: This may take 2-5 minutes on first run.

3. **Verify installation** (should see no errors):
   ```powershell
   npm list
   ```

---

## Step 3: Configure Environment (Optional - For Database)

If you want to enable the backend with Postgres database:

1. **Create `.env` file**:
   In the project root folder (`C:\Users\IAN\Documents\GitHub\bla460`), create a new file named `.env` (no extension).

2. **Add environment variables**:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/egerton_transport
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

3. **Update values**:
   - Replace `user` and `password` with your Postgres credentials
   - Keep `localhost:5432` if Postgres is on your machine
   - `PORT=3000` means the server runs on http://localhost:3000

4. **Install Postgres** (if not already installed):
   - Download from https://www.postgresql.org/download/windows/
   - Default port is 5432
   - Remember username and password during installation

5. **Create database** (optional - server auto-creates if `DATABASE_URL` is set):
   Open PowerShell and run:
   ```powershell
   # Connect to Postgres (replace 'user' with your username)
   psql -U user -h localhost

   # In the psql prompt, create database:
   CREATE DATABASE egerton_transport;
   \q  # Exit
   ```

---

## Step 4: Start the Server

From PowerShell in the project folder (`C:\Users\IAN\Documents\GitHub\bla460`):

**Option 1: Development mode** (auto-reloads on file changes):
```powershell
npm run dev
```

**Option 2: Production mode**:
```powershell
npm start
```

**Expected output**:
```
✓ Server running on http://localhost:3000
✓ Compression middleware: ON
✓ Morgan logging: logs/access.log
[Optional] ✓ Database: Connected to PostgreSQL
```

If you see an error like `Address already in use`, port 3000 is taken. Change it in `.env`:
```env
PORT=3001
```
Then restart.

---

## Step 5: Test the Portal

1. **Open browser**:
   - Chrome, Firefox, Edge, or Safari
   - Go to: http://localhost:3000

2. **Test booking flow**:
   - Click "Login"
   - Sign up with email/password
   - Browse vehicles and create a booking
   - Check profile and booking history

3. **Test offline mode**:
   - Stop server (Ctrl+C in PowerShell)
   - Refresh page
   - Bookings should still work (using localStorage fallback)

---

## Step 6: View Access Logs

Once the server is running, monitor incoming requests:

1. **Open PowerShell** in the project folder

2. **View last 20 requests**:
   ```powershell
   Get-Content logs\access.log -Tail 20
   ```

3. **Watch real-time logs** (refreshes as requests come in):
   ```powershell
   Get-Content logs\access.log -Wait
   ```

---

## Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| **`node: command not found`** | Node not installed | Download from nodejs.org and run installer |
| **`Port 3000 already in use`** | Another app using port 3000 | Change `PORT` in `.env`, or run `netstat -ano \| findstr :3000` to find and kill the process |
| **`npm install` hangs** | Network timeout | Try: `npm install --legacy-peer-deps` |
| **Database connection error** | Wrong credentials or Postgres not running | Check `.env` settings; start Postgres service |
| **Emails not sending** | Backend not running | Ensure server started with `npm start` |
| **Images not loading** | Wrong path | Verify `Images/` folder exists and images are there |

---

## Stopping the Server

Press **Ctrl+C** in PowerShell.

---

## Next: Deploy to Production

Once testing locally works:

1. **Use a hosting platform**:
   - **Heroku** (easiest): `git push heroku main`
   - **Render**: Connect GitHub repo, auto-deploys
   - **Azure App Service**: Microsoft's cloud platform
   - **DigitalOcean**: Affordable VPS with Node.js templates

2. **Configure HTTPS**:
   - Most platforms provide free SSL certificates
   - Required for production (users won't trust HTTP)

3. **Set real `DATABASE_URL`**:
   - Use platform's managed Postgres (e.g., Heroku Postgres, Render Postgres)
   - Don't use localhost

4. **Update `CORS_ORIGIN`**:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

---

## Useful Commands

```powershell
# Check Node & npm versions
node --version
npm --version

# Install specific package version
npm install package-name@1.0.0

# Remove package
npm uninstall package-name

# Update all packages (caution: may break code)
npm update

# Clear npm cache (if install fails)
npm cache clean --force

# Run with environment variables
$env:NODE_ENV = 'production'; npm start

# Kill process on port 3000
Get-Process node | Stop-Process -Force
```

---

## Performance Optimization Tips

1. **Use lazy-loading for images**:
   - Replace `src=` with `data-src=` on images
   - Already configured in lazy images in index, home, vehicles pages

2. **Monitor logs**:
   ```powershell
   Get-Content logs\access.log -Tail 100
   ```

3. **Test with Lighthouse** (Chrome DevTools):
   - F12 → Lighthouse tab → Analyze page load

---

## Support & Troubleshooting

1. **Check [README.md](README.md)** for general setup
2. **Check [PERFORMANCE.md](PERFORMANCE.md)** for optimization tips
3. **View server logs**: `logs/access.log`
4. **Check browser console**: F12 → Console tab (errors appear here)

---

**Ready?** Start with Step 1 and follow each step in order. If you hit issues, check the troubleshooting table above.

Happy deploying! 🚀
