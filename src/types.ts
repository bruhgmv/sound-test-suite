export type Tab = 'home' | 'speaker' | 'left-right' | 'headphones' | 'microphone';

export interface DeviceSpec {
  name: string;
  sampleRate: string;
  channels: string;
  echoCancellation: string;
  noiseSuppression: string;
  autoGainControl: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
