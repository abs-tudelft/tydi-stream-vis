// types.ts - Types for the Code Highlight component

// Supported programming languages
export type SupportedLanguage =
    | 'c'
    | 'cpp'
    | 'scala'
    | 'haskell'
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'java'
    | 'ruby'
    | 'csharp'
    | 'php'
    | 'html'
    | 'css'
    | 'xml'
    | 'json'
    | 'bash'
    | 'markdown'
    | 'sql';

// Props interface for the CodeHighlight component
export interface CodeHighlightProps {
    code: string;
    language?: SupportedLanguage;
    title?: string;
    showLineNumbers?: boolean;
    theme?: 'atom-one-dark' | 'github' | 'dracula' | 'vs2015' | 'tomorrow-night';
}

// Theme configuration options
export interface ThemeOption {
    name: string;
    value: string;
    cssClass: string;
}

export const availableThemes: ThemeOption[] = [
    { name: 'Atom One Dark', value: 'atom-one-dark', cssClass: 'theme-atom-one-dark' },
    { name: 'GitHub', value: 'github', cssClass: 'theme-github' },
    { name: 'Dracula', value: 'dracula', cssClass: 'theme-dracula' },
    { name: 'VS 2015', value: 'vs2015', cssClass: 'theme-vs2015' },
    { name: 'Tomorrow Night', value: 'tomorrow-night', cssClass: 'theme-tomorrow-night' }
];