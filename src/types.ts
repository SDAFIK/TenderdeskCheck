export interface Tender { tender_id: string; title: string; procuring_entity: string; bidder: string; submission_deadline: string }
export interface Requirement { id: string; order: number; title_en: string; title_bn: string; mandatory: boolean; has_expiry: boolean }
export interface RequirementsFile { tender: Tender; requirements: Requirement[] }
export type Status = 'missing' | 'not_provided' | 'expiry_needed' | 'expired' | 'ok';
export interface UploadedDocument { id: string; file: File; name: string; size: number; pages: number; hash: string }
export interface Match { documentId: string; expiry: string }
export type Matches = Record<string, Match>;
export type Language = 'en' | 'bn';
