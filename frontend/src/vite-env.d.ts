/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SWECHA_API_BASE_URL?: string;
  readonly SWECHA_API_BASE_URL?: string;
  readonly VITE_STANDUP_LABEL_ALIASES?: string;
  readonly VITE_INTERNSHIP_LABEL_ALIASES?: string;
  readonly VITE_GITLAB_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
