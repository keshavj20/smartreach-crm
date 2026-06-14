import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, Divider, Switch, FormControlLabel, Alert, CircularProgress,
  InputAdornment, IconButton
} from '@mui/material';
import { SaveRounded, VisibilityRounded, VisibilityOffRounded, AutoAwesomeRounded, PaletteRounded, PersonRounded } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { settingsAPI } from '../services/api';
import { PageHeader } from '../components/common/PageElements';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const [settings, setSettings] = useState({ geminiApiKey: '', profileName: 'Admin User', profileEmail: 'admin@smartreach.ai' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { themeMode, toggleTheme } = useApp();

  useEffect(() => {
    settingsAPI.get()
      .then(r => setSettings(s => ({ ...s, ...r.data.data })))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      enqueueSnackbar('Settings saved!', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Configure your SmartReach AI CRM" />

      <Grid container spacing={3}>
        {/* AI Settings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: 'linear-gradient(135deg, #5B4CF5, #9B59FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AutoAwesomeRounded sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>AI Configuration</Typography>
                  <Typography variant="caption" color="text.secondary">Connect Gemini to power AI audience insights</Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                Get your Gemini API key from <strong>Google AI Studio</strong> (aistudio.google.com). Without a key, the system uses smart fallback recommendations.
              </Alert>

              <TextField
                label="Gemini API Key"
                value={settings.geminiApiKey || ''}
                onChange={e => setSettings(s => ({ ...s, geminiApiKey: e.target.value }))}
                fullWidth
                size="small"
                type={showKey ? 'text' : 'password'}
                placeholder="AIza••••••••••••••••••••••••••••••••••••••"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PersonRounded sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Profile Settings</Typography>
                  <Typography variant="caption" color="text.secondary">Your account information</Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Display Name" value={settings.profileName || ''}
                    onChange={e => setSettings(s => ({ ...s, profileName: e.target.value }))}
                    fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email Address" value={settings.profileEmail || ''}
                    onChange={e => setSettings(s => ({ ...s, profileEmail: e.target.value }))}
                    fullWidth size="small" type="email" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                  onClick={handleSave} disabled={saving}>
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Theme & Appearance */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: 'linear-gradient(135deg, #9B59FF, #EC4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PaletteRounded sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Appearance</Typography>
                  <Typography variant="caption" color="text.secondary">Customize your interface</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                <FormControlLabel
                  control={<Switch checked={themeMode === 'dark'} onChange={toggleTheme} color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Dark Mode</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {themeMode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={600} mb={1}>App Version</Typography>
              <Typography variant="body2" color="text.secondary">SmartReach AI CRM v1.0.0</Typography>
              <Typography variant="caption" color="text.secondary">Built with React, Node.js, MongoDB & Gemini AI</Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, rgba(91,76,245,0.08), rgba(155,89,255,0.08))', border: '1px solid rgba(91,76,245,0.15)' }}>
                <Typography variant="body2" fontWeight={700} color="primary.main" mb={0.5}>AI Status</Typography>
                <Typography variant="caption" color="text.secondary">
                  {settings.geminiApiKey && settings.geminiApiKey.length > 8
                    ? '✅ Gemini API connected'
                    : '⚠️ Using fallback recommendations. Add your Gemini API key for live AI insights.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
