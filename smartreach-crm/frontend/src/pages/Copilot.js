import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Chip,
  Grid, CircularProgress, Divider, Stack, Avatar
} from '@mui/material';
import { SendRounded, RocketLaunchRounded, CheckCircleRounded, WarningRounded } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { copilotAPI, campaignAPI } from '../services/api';
import { formatDate } from '../utils/format';

const samplePrompts = [
  'Create a campaign for inactive customers who haven\'t purchased in 30 days and send them a discount email',
  'Run a win-back campaign for high-value users using email',
  'Target users who bought shoes but not socks and send promotional email'
];

export default function Copilot() {
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await campaignAPI.getAll({ page: 1, limit: 8 });
      setCampaigns(res.data.data);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handlePreview = async () => {
    if (!prompt.trim()) return enqueueSnackbar('Please enter a campaign prompt.', { variant: 'warning' });
    try {
      setLoadingPreview(true);
      const res = await copilotAPI.preview({ prompt });
      setPreview(res.data.data);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleLaunch = async () => {
    if (!preview) return enqueueSnackbar('Generate a campaign preview first.', { variant: 'warning' });
    try {
      setLaunching(true);
      const res = await copilotAPI.launch({ prompt });
      enqueueSnackbar(res.data.message, { variant: 'success' });
      setPreview(null);
      setPrompt('');
      fetchCampaigns();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>SmartReach Copilot CRM</Typography>
        <Typography variant="body1" color="text.secondary">
          Type your marketing intent in natural language and let the AI automatically create audiences, generate campaigns, and simulate email performance.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>AI Campaign Builder</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>Enter a prompt describing your campaign goals, audience, and channel.</Typography>

              <TextField
                multiline
                minRows={4}
                placeholder="e.g. Create a campaign for inactive customers who haven't purchased in 30 days and send them a discount email"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {samplePrompts.map((sample) => (
                  <Chip
                    key={sample}
                    label={sample}
                    onClick={() => setPrompt(sample)}
                    sx={{ cursor: 'pointer' }}
                    size="small"
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loadingPreview ? <CircularProgress size={18} color="inherit" /> : <SendRounded />}
                  onClick={handlePreview}
                  disabled={loadingPreview}
                >
                  Generate Preview
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleLaunch}
                  disabled={!preview || launching}
                >
                  {launching ? 'Launching…' : 'Launch Campaign'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {preview && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><RocketLaunchRounded /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Preview</Typography>
                    <Typography variant="caption" color="text.secondary">AI-generated campaign summary and message</Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Audience</Typography>
                    <Typography variant="body1" fontWeight={700}>{preview.audienceName}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>{preview.audienceDescription}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Channel</Typography>
                    <Chip label={preview.channel} color="primary" size="small" />
                    <Typography variant="subtitle2" color="text.secondary" mt={1}>Audience size</Typography>
                    <Typography variant="body1" fontWeight={700}>{preview.audienceSize}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                <Typography variant="h6" fontWeight={700} mb={2}>{preview.messageSubject}</Typography>

                <Typography variant="subtitle2" color="text.secondary">Message</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{preview.messageBody}</Typography>

                <Typography variant="subtitle2" color="text.secondary">Campaign goal</Typography>
                <Typography variant="body2">{preview.campaignGoal}</Typography>
              </CardContent>
            </Card>
          )}

          <Card sx={{ borderRadius: 3, p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>How it works</Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2">1. AI understands your marketing prompt and builds an audience.</Typography>
              <Typography variant="body2">2. It generates a campaign summary, subject, and email copy.</Typography>
              <Typography variant="body2">3. You launch the campaign and the system simulates delivery and engagement.</Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, p: 3, minHeight: 280 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Recent Campaigns</Typography>
                {loadingCampaigns ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                ) : campaigns.length === 0 ? (
                  <Typography color="text.secondary">No campaigns launched yet.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {campaigns.map((campaign) => (
                      <Box key={campaign._id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700}>{campaign.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{campaign.channel} · {campaign.status} · {formatDate(campaign.createdAt)}</Typography>
                        <Typography variant="body2" mt={1} noWrap>{campaign.message}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Campaign Signals</Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleRounded color="success" />
                    <Typography variant="body2">AI auto-generates audiences and campaign copy.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SendRounded color="primary" />
                    <Typography variant="body2">Simulated email delivery with status tracking.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningRounded color="warning" />
                    <Typography variant="body2">Duplicate campaigns are prevented by audience signature matching.</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
