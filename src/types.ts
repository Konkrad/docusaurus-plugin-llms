/**
 * Type definitions for the docusaurus-plugin-llms plugin
 */

import type {LoadContext, RouteConfig} from '@docusaurus/types';

/**
 * Represents a single documentation section with its physical path and URL route base
 */
export interface DocsSection {
  /**
   * Physical directory path relative to siteDir (e.g., 'docs', 'cloud', 'feature-collections').
   * This is the `path` option you pass to `@docusaurus/plugin-content-docs`.
   */
  path: string;
  /**
   * URL route base path. Use '/' when the docs plugin has `routeBasePath: '/'`,
   * otherwise use the same value as `routeBasePath` (e.g., 'cloud', 'feature-collections').
   */
  routeBasePath: string;
  /**
   * Human-readable label used as a section heading in llms.txt and llms-full.txt.
   * Falls back to the `path` value when not provided.
   *
   * @example '☁️ Cloud Resources'
   */
  label?: string;
}

/**
 * Interface for processed document information
 */
export interface DocInfo {
  title: string;
  path: string;
  url: string;
  content: string;
  description: string;
  frontMatter?: Record<string, any>;
  /** Section label derived from the DocsSection this document belongs to. */
  section?: string;
}

/**
 * Interface for custom LLM file configuration
 */
export interface CustomLLMFile {
  /** Name of the output file (e.g., 'llms-python.txt') */
  filename: string;

  /** Glob patterns for files to include */
  includePatterns: string[];

  /** Whether to include full content (true) or just links (false) */
  fullContent: boolean;

  /** Custom title for this file (defaults to site title) */
  title?: string;

  /** Custom description for this file (defaults to site description) */
  description?: string;

  /** Additional patterns to exclude (combined with global ignoreFiles) */
  ignorePatterns?: string[];

  /** Order patterns for controlling file ordering (similar to includeOrder) */
  orderPatterns?: string[];

  /** Whether to include unmatched files last (default: false) */
  includeUnmatchedLast?: boolean;

  /** Version information for this LLM file */
  version?: string;

  /** Custom content to include at the root level (after title/description) */
  rootContent?: string;
}

/**
 * Plugin options interface
 */
export interface PluginOptions {
  /** Whether to generate the llms.txt file (default: true) */
  generateLLMsTxt?: boolean;

  /** Whether to generate the llms-full.txt file (default: true) */
  generateLLMsFullTxt?: boolean;

  /**
   * Base directory (or directories) for documentation files.
   *
   * - Pass a **string** (e.g., `'docs'`) for single-section sites. Defaults to `'docs'`.
   * - Pass an **array of {@link DocsSection} objects** for multi-section sites, mapping each
   *   physical directory to its URL route base path.
   *
   * @example Single section (string form)
   * docsDir: 'docs'
   *
   * @example Multiple sections (array form)
   * docsDir: [
   *   { path: 'docs',  routeBasePath: '/',     label: 'General' },
   *   { path: 'cloud', routeBasePath: 'cloud', label: '☁️ Cloud Resources' },
   *   { path: 'api',   routeBasePath: 'api',   label: '🔌 API Reference' },
   * ]
   */
  docsDir?: string | DocsSection[];

  /** Array of glob patterns for files to ignore */
  ignoreFiles?: string[];

  /** Custom title to use in generated files (defaults to site title) */
  title?: string;

  /** Custom description to use in generated files (defaults to site tagline) */
  description?: string;

  /** Custom file name for the links file (default: 'llms.txt') */
  llmsTxtFilename?: string;

  /** Custom file name for the full content file (default: 'llms-full.txt') */
  llmsFullTxtFilename?: string;

  /** Whether to include blog content (default: false) */
  includeBlog?: boolean;

  /** Path transformation options for URL construction */
  pathTransformation?: {
    /** Path segments to ignore when constructing URLs (will be removed if found) */
    ignorePaths?: string[];
    /** Path segments to add when constructing URLs (will be prepended if not already present) */
    addPaths?: string[];
  };

  /** Array of glob patterns for controlling the order of files (files will be processed in the order of patterns) */
  includeOrder?: string[];

  /** Whether to include files that don't match any pattern in includeOrder at the end (default: true) */
  includeUnmatchedLast?: boolean;

  /** Array of custom LLM file configurations */
  customLLMFiles?: CustomLLMFile[];

  /** Global version for all generated LLM files */
  version?: string;

  /** Whether to exclude import statements from the generated content (default: false) */
  excludeImports?: boolean;

  /** Whether to remove redundant content that duplicates heading text (default: false) */
  removeDuplicateHeadings?: boolean;

  /** Whether to generate individual markdown files and link to them from llms.txt instead of original docs (default: false) */
  generateMarkdownFiles?: boolean;

  /** Array of frontmatter keys to preserve in generated individual markdown files (only used when generateMarkdownFiles is true) */
  keepFrontMatter?: string[];

  /** Custom content to include at the root level of llms.txt (after title/description, before TOC) */
  rootContent?: string;

  /** Custom content to include at the root level of llms-full.txt (after title/description, before content sections) */
  fullRootContent?: string;

  /** Whether to preserve directory structure in generated markdown files (default: true) */
  preserveDirectoryStructure?: boolean;

  /** Batch size for processing large document sets to prevent memory issues (default: 100) */
  processingBatchSize?: number;

  /** Logging level for plugin output (default: 'normal'). Options: 'quiet', 'normal', 'verbose' */
  logLevel?: 'quiet' | 'normal' | 'verbose';

  /** Whether to warn about files that are ignored (no extension or unsupported extension) (default: false) */
  warnOnIgnoredFiles?: boolean;

  /** Index signature for Docusaurus plugin compatibility */
  [key: string]: unknown;
}

/**
 * Plugin context with processed options
 */
export interface PluginContext {
  siteDir: string;
  outDir: string;
  siteUrl: string;
  /**
   * Resolved single-section docs directory string. Kept for backward compatibility with
   * internal helpers that expect a plain string path. When `docsDir` is provided as an array
   * this is derived from the first section's `path`.
   */
  docsDir: string;
  /**
   * Resolved list of all documentation sections to scan.
   * Derived from `docsDir` (array form) or a single section built from the string form.
   */
  docsSections: DocsSection[];
  docTitle: string;
  docDescription: string;
  options: PluginOptions;
  routesPaths?: string[];
  routes?: RouteConfig[];
  routeMap?: Map<string, string>;
}
