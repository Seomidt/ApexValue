import { createApp } from "../server/app";

const appPromise = createApp({ serveClient: false }).then(({ app }) => app);

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
