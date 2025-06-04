module.exports = `// Type definitions for Moment.js
export interface Moment {
  format(format?: string): string;
  add(amount?: number, unit?: string): Moment;
  subtract(amount?: number, unit?: string): Moment;
  isBefore(inp?: any): boolean;
  isAfter(inp?: any): boolean;
  toDate(): Date;
  valueOf(): number;
}

declare function moment(inp?: any): Moment;
declare namespace moment {
  function now(): number;
  function utc(inp?: any): Moment;
}

export = moment;
export default moment;`;
