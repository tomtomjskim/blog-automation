import { useState } from 'react';
import type { StyleId, LengthId, GenerationMode, ToneId, PersonaId, UploadedImage, TemplateData, TemplateField } from '@/lib/types';

export interface CustomStyle {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  systemPrompt: string;
  fields: TemplateField[];
}

export interface FormState {
  topic: string;
  setTopic: (v: string) => void;
  keywords: string[];
  setKeywords: (v: string[]) => void;
  style: StyleId;
  setStyle: (v: StyleId) => void;
  length: LengthId;
  setLength: (v: LengthId) => void;
  mode: GenerationMode;
  setMode: (v: GenerationMode) => void;
  tone: ToneId;
  setTone: (v: ToneId) => void;
  persona: PersonaId | null;
  setPersona: (v: PersonaId | null) => void;
  naturalize: boolean;
  setNaturalize: (v: boolean) => void;
  templateData: TemplateData;
  setTemplateData: (v: TemplateData | ((prev: TemplateData) => TemplateData)) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  selectedProfile: string;
  setSelectedProfile: (v: string) => void;
  uploadedImages: UploadedImage[];
  setUploadedImages: (v: UploadedImage[]) => void;
  klingConfigured: boolean;
  setKlingConfigured: (v: boolean) => void;
  generateImages: boolean;
  setGenerateImages: (v: boolean) => void;
  customStyles: CustomStyle[];
  setCustomStyles: (v: CustomStyle[]) => void;
}

export function useFormState(): FormState {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [style, setStyle] = useState<StyleId>('casual');
  const [length, setLength] = useState<LengthId>('standard');
  const [mode, setMode] = useState<GenerationMode>('quick');
  const [tone, setTone] = useState<ToneId>('haeyoche');
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [naturalize, setNaturalize] = useState(false);
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [klingConfigured, setKlingConfigured] = useState(false);
  const [generateImages, setGenerateImages] = useState(false);
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);

  return {
    topic, setTopic,
    keywords, setKeywords,
    style, setStyle,
    length, setLength,
    mode, setMode,
    tone, setTone,
    persona, setPersona,
    naturalize, setNaturalize,
    templateData, setTemplateData,
    loading, setLoading,
    error, setError,
    selectedProfile, setSelectedProfile,
    uploadedImages, setUploadedImages,
    klingConfigured, setKlingConfigured,
    generateImages, setGenerateImages,
    customStyles, setCustomStyles,
  };
}
