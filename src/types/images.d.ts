/**
 * Ambient declarations for static image imports so TypeScript understands
 * `import logo from '@static/images/mitro-logo.jpeg'`.
 * Metro resolves these to an asset module at runtime.
 */
declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg' {
  const content: number;
  export default content;
}

declare module '*.webp' {
  const content: number;
  export default content;
}

declare module '*.gif' {
  const content: number;
  export default content;
}
