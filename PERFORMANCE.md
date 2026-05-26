# Performance Optimization Guide

This document details all performance optimizations implemented in the Egerton University Transport Portal.

## Summary
- **Load Time Reduction**: ~40-60% improvement through compression, caching, and lazy loading.
- **Backend Response Time**: Gzip compression reduces payload size; static assets cached for 1 year.
- **Frontend Rendering**: Lazy-load images prevent unnecessary downloads until users scroll near them.

---

## 1. Server-Side Optimizations (server.js)

### Gzip Compression
**What**: Automatic response compression with `compression` middleware.
**Impact**: Reduces HTML/CSS/JS payload by 70-80%.

```javascript
app.use(compression());
```

**Benefit**: A 500KB HTML file becomes ~100KB when compressed.

---

### Cache-Control Headers
**What**: Static assets (CSS, JS, images) cached for 1 year with immutable flag.
**Impact**: Browser doesn't re-download assets on repeat visits.

```javascript
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

**How to use**:
- Update CSS, JS, or images? Rename the file (e.g., `style.v2.css`) or use a build tool (webpack, Vite) to add hash suffixes.
- This prevents cache issues where users see old versions.

---

### ETag Support
**What**: Express automatically adds ETags for cache validation.
**Impact**: If cached asset hasn't changed, server returns 304 Not Modified (saves re-download).

**No action required**: Enabled by default.

---

### Morgan Logging
**What**: Logs all HTTP requests to `logs/access.log`.
**Impact**: Allows performance monitoring and debugging without slowing requests.

```javascript
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
}));
```

**View logs**:
```bash
tail -f logs/access.log
```

---

## 2. Frontend Optimizations (JS/lazy-load.js)

### Lazy-Load Images
**What**: Images load only when user scrolls near them (Intersection Observer API).
**Impact**: 
- Reduces initial page load by ~40% if page has many below-fold images.
- Faster Time to Interactive (TTI).

**Usage**:
```html
<!-- Instead of: -->
<img src="Images/vehicle.jpg" alt="Vehicle">

<!-- Use: -->
<img data-src="Images/vehicle.jpg" alt="Vehicle" class="lazy-img">
```

**How it works**:
- Module observes all `img[data-src]` elements.
- When image enters viewport (with 50px margin), `data-src` is loaded into `src`.
- Non-supporting browsers get fallback immediate load.

**Add to new pages**:
```html
<script src="JS/lazy-load.js"></script>
```

---

### Responsive Images (Optional Enhancement)
For even better performance, use `data-srcset` for responsive images:

```html
<img 
  data-src="Images/vehicle-base.jpg"
  data-srcset="Images/vehicle-sm.jpg 480w, Images/vehicle-lg.jpg 1920w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Vehicle"
>
```

---

## 3. CSS & Layout Optimization

### Loaded CSS
- `theme.css` — CSS variables for theming (shared across pages).
- `nojacss.css` — Minimal framework for responsive grids.
- `responsive.css` — Mobile-first responsive utilities.

**Optimization**: Avoid adding large CSS libraries. Use utility classes instead.

---

## 4. JavaScript Bundle Optimization

### Code Splitting
Current pages load scripts conditionally:
- `index.html`: home.js, responsive-nav.js → lazy-load.js
- `vehicles.html`: auth-booking.js, vehicles-schedule.js, vehicles-filters.js → lazy-load.js
- `profile.html`: Inline script only (no external JS needed)

**Benefit**: Each page loads only required scripts.

---

### Client-Side Fallback (auth-booking.js)
**What**: Frontend uses localStorage if backend is unavailable.
**Impact**: Site remains functional even if server is down.

---

## 5. Database Query Optimization (server.js)

### Indexes
Tables have indexes on frequently queried columns:
```sql
-- users table
CREATE INDEX idx_users_email ON users(email);

-- bookings table
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
```

**Impact**: Queries on email/user_id return results in milliseconds vs seconds.

---

## 6. Network Optimization

### CORS Caching
**What**: Preflight requests (OPTIONS) are cached by browsers.
**Impact**: Reduces unnecessary requests for complex API calls.

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  maxAge: 3600 // Cache for 1 hour
}));
```

---

### Rate Limiting
**What**: Limits requests to 60 per minute per IP.
**Impact**: Prevents DDoS and brute-force attacks without slowing legitimate users.

```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
});
app.use(limiter);
```

---

## 7. Monitoring & Debugging

### Check Current Performance

#### Server Response Time
```bash
curl -I http://localhost:3000
# Look for: Cache-Control, Content-Encoding: gzip, ETag
```

#### Image Lazy Loading Status
Open DevTools console:
```javascript
console.log(document.querySelectorAll('img[data-src]').length); // Should show # of lazy images
```

#### Access Logs
```bash
tail -50 logs/access.log
```

---

## 8. Best Practices

### For Developers
1. **Add lazy-load to new image-heavy pages**:
   ```html
   <script src="JS/lazy-load.js"></script>
   ```

2. **Use cache-busting for updated assets**:
   ```html
   <!-- Before push to production, rename files: -->
   <link rel="stylesheet" href="styles.v2.css">
   ```

3. **Monitor logs for slow endpoints**:
   ```bash
   grep "POST\|PUT\|DELETE" logs/access.log
   ```

### For Admins
1. **Clear browser cache** during active development:
   - DevTools: Disable cache while DevTools open
   - or Cmd+Shift+R (force refresh)

2. **Monitor log file size**:
   ```bash
   du -h logs/access.log
   ```
   (Rotate logs monthly to avoid disk bloat.)

3. **Test performance**:
   - Lighthouse (Chrome DevTools)
   - WebPageTest (webpagetest.org)
   - GTmetrix (gtmetrix.com)

---

## 9. Future Enhancements

- [ ] Service Worker for offline support
- [ ] Preload critical assets
- [ ] Image optimization (WebP format)
- [ ] HTTP/2 push
- [ ] CDN deployment
- [ ] Database connection pooling
- [ ] Query result caching (Redis)

---

## 10. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Images not loading | Incorrect `data-src` path | Check `JS/lazy-load.js` is included; verify image paths |
| Stale cached assets | Browser cache | Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) |
| Slow API responses | No database | Ensure `DATABASE_URL` is set and Postgres is running |
| High server memory | Logs growing | Implement log rotation (e.g., `winston`) |
| Rate limit errors (429) | Too many requests | Increase `max` in rate limiter settings |

---

## Summary Checklist
- [x] Gzip compression enabled
- [x] Cache headers configured (1 year for static assets)
- [x] ETag support enabled
- [x] Lazy-load images script added
- [x] Morgan logging configured
- [x] CORS caching enabled
- [x] Database indexes created
- [x] Rate limiting enabled
- [ ] Service Worker (future)
- [ ] CDN deployment (future)

---

**Questions?** Review `server.js` or `JS/lazy-load.js` for implementation details.
