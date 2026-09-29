import net from 'node:net';

// These belong to another project, even if that project happens to be stopped.
export const protectedPorts = new Set([4000, 35729]);

export function parsePort(value, label) {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error(`${label} must be an integer from 1 to 65535.`);
  }
  const port = Number(value);
  if (protectedPorts.has(port)) throw new Error(`${label} ${port} is reserved for another project.`);
  return port;
}

export async function reservePort({ host, preferred, override, label, unavailable = new Set() }) {
  for (let port = override ?? preferred; port <= 65535; port++) {
    if (protectedPorts.has(port) || unavailable.has(port)) {
      if (override !== undefined) throw new Error(`${label} ${port} conflicts with another selected or reserved port.`);
      continue;
    }
    const server = net.createServer();
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen({ host, port, exclusive: true }, resolve);
      });
      return { port, release: () => new Promise((resolve) => server.close(resolve)) };
    } catch (error) {
      if (!['EADDRINUSE', 'EACCES'].includes(error.code)) throw error;
      if (override !== undefined) throw new Error(`${label} ${port} is unavailable on ${host} (${error.code}). Choose another port; no process was stopped.`);
    }
  }
  throw new Error(`No free ${label} port found.`);
}
