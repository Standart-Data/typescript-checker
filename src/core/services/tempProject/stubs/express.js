module.exports = `// Type definitions for Express
export interface Request {
  body: any;
  query: any;
  params: any;
  headers: any;
}

export interface Response {
  json(obj: any): void;
  send(data: any): void;
  status(code: number): Response;
}

export interface NextFunction {
  (error?: any): void;
}

export interface Application {
  get(path: string, handler: (req: Request, res: Response, next?: NextFunction) => void): void;
  post(path: string, handler: (req: Request, res: Response, next?: NextFunction) => void): void;
  put(path: string, handler: (req: Request, res: Response, next?: NextFunction) => void): void;
  delete(path: string, handler: (req: Request, res: Response, next?: NextFunction) => void): void;
  listen(port: number, callback?: () => void): void;
}

declare function express(): Application;

export default express;`;
