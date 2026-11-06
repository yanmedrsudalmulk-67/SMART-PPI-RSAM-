import type { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const nets = os.networkInterfaces();
  const candidates: { name: string; ip: string }[] = [];

  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;

    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254.')) {
          candidates.push({ name, ip: iface.address });
        }
      }
    }
  }

  // Prefer Wi-Fi or Ethernet adapter
  let primaryIp = '127.0.0.1';
  if (candidates.length > 0) {
    const preferred = candidates.find(c => /wi-?fi|ethernet|wlan|lan/i.test(c.name)) || candidates[0];
    primaryIp = preferred.ip;
  }

  // Extract port from Host header if available, otherwise default to 3001
  const host = req.headers.host || '';
  const port = host.includes(':') ? host.split(':')[1] : '3001';

  // Check if custom domain is configured
  let customDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://www.rsudalmulkmobile.xyz';
  const customDomainFile = path.join(process.cwd(), 'data', 'custom_domain.txt');
  if (fs.existsSync(customDomainFile)) {
    try {
      const cd = fs.readFileSync(customDomainFile, 'utf8').trim();
      if (cd.startsWith('http')) {
        customDomain = cd;
      }
    } catch (e) {}
  }

  // Check if public Cloudflare Tunnel URL is active
  let publicUrl: string | null = null;
  const tunnelFile = path.join(process.cwd(), 'data', 'public_tunnel_url.txt');
  if (fs.existsSync(tunnelFile)) {
    try {
      const content = fs.readFileSync(tunnelFile, 'utf8').trim();
      if (content.startsWith('http')) {
        publicUrl = content;
      }
    } catch (e) {
      // ignore
    }
  }

  // Check if tunnel token or service exists
  const tokenFile = path.join(process.cwd(), 'data', 'tunnel_token.txt');
  const isTunnelConfigured = fs.existsSync(tokenFile) || !!process.env.CLOUDFLARE_TUNNEL_TOKEN;

  return res.status(200).json({
    primaryIp,
    candidates,
    port,
    localUrl: `http://localhost:${port}`,
    networkUrl: `http://${primaryIp}:${port}`,
    publicUrl: publicUrl || (isTunnelConfigured ? customDomain : null),
    customDomain,
    isTunnelConfigured,
  });
}
