# Auto-Update Feature

## How It Works

1. **Background check**: App silently checks for updates on startup (after 5 seconds) and every 4 hours
2. **Background download**: If an update is available, it downloads silently in the background
3. **User notification**: Once downloaded, shows "Update available [Install]" in the top-right corner
4. **Install**: User clicks Install → app restarts and applies the update

## Testing in Development

### Keyboard Shortcuts
- **Cmd+Shift+1**: Show "Update available [Install]"
- **Cmd+Shift+2**: Hide notification

### Console
```javascript
testUpdate(1)  // Show notification
testUpdate(2)  // Hide notification
```

## Menu Access

Users can also check for updates via the app menu:
- **macOS**: RealPomo → Check for Updates...
- **Windows**: Help → Check for Updates...

## Production Deployment

See the production checklist below for deployment steps.
